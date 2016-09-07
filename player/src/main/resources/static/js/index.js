/*
 * (C) Copyright 2015 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var ws1 = new WebSocket('wss://' + location.host + '/player');
var ws2 = new WebSocket('wss://' + location.host + '/player');
var video1;
var video2;
var ws, video;
var webRtcPeer;
var state = null;
var isSeekable = false;

var I_CAN_START = 0;
var I_CAN_STOP = 1;
var I_AM_STARTING = 2;
var seekUpdateTimer = {};
var seekUpdate = function() {
	// console.log("=== seekUpdate seeking ===", seeking);
	// if(!seeking)getPosition()
}

var playButton = {};
var muteButton = {};
var fullScreenButton = {};

// Sliders
var seekBar = {};
var volumeBar = {};
var seeking = false
var fileList = [
	'http://jenkins.trunk.studio/videotest/video1.mkv',
	'http://jenkins.trunk.studio/videotest/video2.mkv',
	'http://jenkins.trunk.studio/videotest/video3.mkv'
]
var playing = 0;

window.onload = function() {
	console = new Console();
	video1 = document.getElementById('video1');
	video2 = document.getElementById('video2');
	video = video1
	ws = ws1
	setState(I_CAN_START);

	// bar
		// Buttons
		playButton = document.getElementById("play-pause");
		muteButton = document.getElementById("mute");
		fullScreenButton = document.getElementById("full-screen");

		// Sliders
		seekBar = document.getElementById("seek-bar");
		volumeBar = document.getElementById("volume-bar");


		// Event listener for the play/pause button
		playButton.addEventListener("click", function() {
			if (video.paused == true) {
				// Play the video
				console.log("=== start video1 ===");
				start(fileList[0], video1, ws1)

				setTimeout(function(){
					console.log("=== start video2 ===");
					start(fileList[1], video2, ws2)
				}, 5000)

				setTimeout(function(){
					console.log("=== show video2 ===");
					video1.style.display = 'none';
					video2.style.display = 'block';
				}, 10000)
				start(fileList[playing], video2, ws2)

				// Update the button text to 'Pause'

			} else {
				// Pause the video
				pause();

				// Update the button text to 'Play'
			}
		});

		seekBar.addEventListener("change", function() {
			// Calculate the new time

			doSeek()

		});

		volumeBar.addEventListener("change", function() {
			// Update the video volume
			video.volume = volumeBar.value;
		});

		fullScreenButton.addEventListener("click", function() {
			if (video.requestFullscreen) {
				video.requestFullscreen();
			} else if (video.mozRequestFullScreen) {
				video.mozRequestFullScreen(); // Firefox
			} else if (video.webkitRequestFullscreen) {
				video.webkitRequestFullscreen(); // Chrome and Safari
			}
		});


	// bar end

}

window.onbeforeunload = function() {
	ws.close();
}

var wsOnMsg = function(message) {
	var parsedMessage = JSON.parse(message.data);
	console.info('Received message: ' + message.data);

	switch (parsedMessage.id) {
	case 'startResponse':
		startResponse(parsedMessage);
		break;
	case 'error':
		if (state == I_AM_STARTING) {
			setState(I_CAN_START);
		}
		onError('Error message from server: ' + parsedMessage.message);
		break;
	case 'playEnd':
		playEnd();
		break;
	case 'videoInfo':
		showVideoData(parsedMessage);
		break;
	case 'iceCandidate':
		webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
			if (error)
				return console.error('Error adding candidate: ' + error);
		});
		break;
	case 'seek':
		seeking = false;
		console.log("=== seek seeking ===", seeking);
		setTimeout(function(){
			seekUpdateTimer = setInterval(seekUpdate, 1000);
		}, "3000")

		console.log (parsedMessage.message);

		break;
	case 'position':
		document.getElementById("videoPosition").value = parsedMessage.position;
		var seekBar = document.getElementById("seek-bar");
		var videoPosition = document.getElementById("videoPosition").value
		var duration = document.getElementById("duration").value
		var seekBarValue = videoPosition/duration * 100
		console.log("=== seekBarValue ===", seekBarValue);
		seekBar.value = seekBarValue

		break;
	case 'iceCandidate':
		break;
	default:
		if (state == I_AM_STARTING) {
			setState(I_CAN_START);
		}
		onError('Unrecognized message', parsedMessage);
	}
}
ws1.onmessage = wsOnMsg
ws2.onmessage = wsOnMsg

function start(sorceUrl, targetVideo, targetWs) {
	// Disable start button
	console.log("=== sorceUrl ===", sorceUrl);
	playButton.innerHTML = "Pause";
	seekUpdateTimer = setInterval(seekUpdate, 1000);
	setState(I_AM_STARTING);
	showSpinner(targetVideo);

	var mode = $('input[name="mode"]:checked').val();
	console.log('Creating WebRtcPeer in ' + mode + ' mode and generating local sdp offer ...');

	// Video and audio by default
	var userMediaConstraints = {
		audio : true,
		video : true
	}

	if (mode == 'video-only') {
		userMediaConstraints.audio = false;
	} else if (mode == 'audio-only') {
		userMediaConstraints.video = false;
	}

	var options = {
		remoteVideo : targetVideo,
		mediaConstraints : userMediaConstraints,
		onicecandidate : function(candidate){
			onIceCandidate(candidate, targetWs)
		}
	}

	console.info('User media constraints' + userMediaConstraints);

	webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
		if (error)
			return console.error(error);

		webRtcPeer.generateOffer(function(error, offerSdp){
			onOffer(error, offerSdp, sorceUrl, targetWs)
		});
	});
}

function onOffer(error, offerSdp, sorceUrl, targetWs) {
	console.log("=== sorceUrl ===", sorceUrl);
	if (error)
		return console.error('Error generating the offer');
	console.info('Invoking SDP offer callback function ' + location.host);

	var message = {
		id : 'start',
		sdpOffer : offerSdp,
		videourl : sorceUrl
		// rtsp://mpv.cdn3.bigCDN.com:554/bigCDN/definst/mp4:bigbuckbunnyiphone_400.mp4
	}
	sendMessage(message, targetWs);
}

function onError(error) {
	console.error(error);
}

function onIceCandidate(candidate, targetWs) {
	console.log('Local candidate' + JSON.stringify(candidate));

	var message = {
		id : 'onIceCandidate',
		candidate : candidate
	}
	sendMessage(message, targetWs);
}

function startResponse(message) {
	setState(I_CAN_STOP);
	console.log('SDP answer received from server. Processing ...');

	webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
		if (error)
			return console.error(error);
	});
}

function pause() {
	togglePause()
	console.log('Pausing video ...');
	var message = {
		id : 'pause'
	}
	sendMessage(message);
}

function resume() {
	togglePause()
	console.log('Resuming video ...');
	var message = {
		id : 'resume'
	}
	sendMessage(message);
}

function stop() {
	console.log('Stopping video ...');
	if(seekUpdateTimer){
		window.clearInterval(seekUpdateTimer);
		seekUpdateTimer = null;
	}
	setState(I_CAN_START);
	if (webRtcPeer) {
		webRtcPeer.dispose();
		webRtcPeer = null;

		var message = {
			id : 'stop'
		}
		sendMessage(message);
	}
	hideSpinner(video);
}

function playEnd() {
	setState(I_CAN_START);
	hideSpinner(video);
	stop()
	playing += 1;

	if(playing < fileList.length){
		start(fileList[playing]);

	}
}

function doSeek() {
	var seekPosition = parseInt(document.getElementById('duration').value * (seekBar.value / 100));
	seeking = true;
	video.currentTime = seekPosition;
	if(seekUpdateTimer){
		window.clearInterval(seekUpdateTimer);
		seekUpdateTimer = null;
	}


	// Update the video time


	var message = {
		id : 'doSeek',
		position: seekPosition
	}
	sendMessage(message);
}

function getPosition() {
	var message = {
		id : 'getPosition'
	}
	sendMessage(message);
}

function showVideoData(parsedMessage) {
	//Show video info
	isSeekable = parsedMessage.isSeekable;
	if (isSeekable) {
		document.getElementById('isSeekable').value = "true";
		enableButton('#doSeek', 'doSeek()');
	} else {
		document.getElementById('isSeekable').value = "false";
	}

	document.getElementById('initSeek').value = parsedMessage.initSeekable;
	document.getElementById('endSeek').value = parsedMessage.endSeekable;
	document.getElementById('duration').value = parsedMessage.videoDuration;
	// document.getElementById('video').duration=parsedMessage.videoDuration;

	enableButton('#getPosition', 'getPosition()');
}

function setState(nextState) {
	switch (nextState) {
	case I_CAN_START:
		enableButton('#start', 'start()');
		disableButton('#pause');
		disableButton('#stop');
		enableButton('#videourl');
		enableButton("[name='mode']");
		disableButton('#getPosition');
		disableButton('#doSeek');
		break;

	case I_CAN_STOP:
		disableButton('#start');
		enableButton('#pause', 'pause()');
		enableButton('#stop', 'stop()');
		disableButton('#videourl');
		disableButton("[name='mode']");
		break;

	case I_AM_STARTING:
		disableButton('#start');
		disableButton('#pause');
		disableButton('#stop');
		disableButton('#videourl');
		disableButton('#getPosition');
		disableButton('#doSeek');
		disableButton("[name='mode']");
		break;

	default:
		onError('Unknown state ' + nextState);
		return;
	}
	state = nextState;
}

function sendMessage(message, targetWs) {
	var jsonMessage = JSON.stringify(message);
	console.log('Senging message: ' + jsonMessage);
	// if(!targetWs) targetWs = ws
	targetWs.send(jsonMessage);
}

function togglePause() {
	var pauseText = $("#pause-text").text();
	if (pauseText == " Resume ") {
		$("#pause-text").text(" Pause ");
		$("#pause-icon").attr('class', 'glyphicon glyphicon-pause');
		$("#pause").attr('onclick', "pause()");
	} else {
		$("#pause-text").text(" Resume ");
		$("#pause-icon").attr('class', 'glyphicon glyphicon-play');
		$("#pause").attr('onclick', "resume()");
	}
}

function disableButton(id) {
	$(id).attr('disabled', true);
	$(id).removeAttr('onclick');
}

function enableButton(id, functionName) {
	$(id).attr('disabled', false);
	if (functionName) {
		$(id).attr('onclick', functionName);
	}
}

function showSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].poster = './img/transparent-1px.png';
		arguments[i].style.background = "center transparent url('./img/spinner.gif') no-repeat";
	}
}

function hideSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		arguments[i].poster = './img/webrtc.png';
		arguments[i].style.background = '';
	}
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});
