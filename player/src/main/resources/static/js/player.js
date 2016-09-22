function createVideoPlayer(wsUrl, videoContainerId, fileList){
    var console = new Console();
    var state = null;
    var isSeekable = false;

    var I_CAN_START = 0;
    var I_CAN_STOP = 1;
    var I_AM_STARTING = 2;
    var seekUpdateTimer = {};
    var seekUpdate = function() {
    	if(!seeking) getPosition(ws1)
    }

    var seeking = false
    var playing = 0;

    var zoomScale = 1;
    var started = false;

    var videoContainer = $( "#"+videoContainerId );
    var webRtcPeer;

    var ws1 = new WebSocket(wsUrl);
    var ws2 = new WebSocket(wsUrl);

	var video1 = document.getElementById('video1');
	var video2 = document.getElementById('video2');

	var playButton = document.getElementById("play-pause");
	var muteButton = document.getElementById("mute");
	var fullScreenButton = document.getElementById("full-screen");

	var seekBar = document.getElementById("seek-bar");
	var volumeBar = document.getElementById("volume-bar");

    var controlPanel = [playButton, seekBar, muteButton, muteButton, fullScreenButton]


    playButton.addEventListener("click", function() {

		var actionName = playButton.innerHTML;
		if (actionName == "Play") {
			// Play the video
			if(!started){
				started = true;
				start(fileList[0], video1, ws1)
			} else {
				resume(ws1)
			}

			// setTimeout(function(){
			// 	console.log("=== start video2 ===");
			// 	start(fileList[1], video2, ws2)
			// }, 5000)
			//
			// setTimeout(function(){
			// 	console.log("=== show video2 ===");
			// 	video1.style.display = 'none';
			// 	video2.style.display = 'block';
			// }, 10000)
			// start(fileList[playing], video2, ws2)

			// Update the button text to 'Pause'

		} else {
			// Pause the video
			pause(ws1);

			// Update the button text to 'Play'
		}
	});


	seekBar.addEventListener("change", function() {
		doSeek(ws1, video1)
	});

	volumeBar.addEventListener("change", function() {
		// Update the video volume
		video.volume = volumeBar.value;
	});

	fullScreenButton.addEventListener("click", function() {
		if (video1.requestFullscreen) {
			video1.requestFullscreen();
		} else if (video1.mozRequestFullScreen) {
			video1.mozRequestFullScreen(); // Firefox
		} else if (video1.webkitRequestFullscreen) {
			video1.webkitRequestFullscreen(); // Chrome and Safari
		}
	});


	// bar end

	var SCREENSHOTS = (function(){
		console.log("SCREENSHOTS");

		var	v = document.getElementsByTagName('video')[0];

		//SCREENSHOTS
		//for screenshot options and creation
		var image = document.getElementById('image');
		var size = document.getElementById("size");
		var screenshotsize = document.getElementById("screenshotsize");

		//control size of screenshot
		size.addEventListener('change', function(){
			var s = this.value;
			screenshotsize.innerHTML = s;
		}, false);

		var screenshot = document.getElementById("screenshot-button");
		screenshot.addEventListener('click', function(){

			//grab current video frame and put it into a canvas element, consider screenshotsize
			canvas = document.createElement("canvas");
			var context = canvas.getContext('2d');

			var w = v.clientWidth * size.value;
			var h = v.clientHeight * size.value;
			canvas.width = w;
			canvas.height = h;
			var fullW = zoomScale * size.value * v.clientWidth;
			var fullH = zoomScale * size.value * v.clientHeight;

			var zoomW = (zoomScale * v.clientWidth);
			var zoomH = (zoomScale * v.clientHeight);

			var scaleX = zoomScale === 1 ? 0 : (zoomW - v.clientWidth) / 2;
			var scaleY = zoomScale === 1 ? 0 : (zoomH - v.clientHeight) / 2;
			var scaleW = v.clientWidth / zoomScale;
			var scaleH = v.clientHeight / zoomScale;

			console.log('drawImage params=>', scaleX,scaleY,scaleW,scaleH,0,0,fullW,fullH);

			context.drawImage(v,scaleX,scaleY,scaleW,scaleH,0,0,fullW,fullH);

			//lets make a screenshot
			image.src = canvas.toDataURL();
			image.style.display = "block";

		},false);
	})();

	// -----------------------------------------------------------------------
	var vidControls = (function () {
		/* predefine zoom and rotate */
		var zoom = 1,
			rotate = 0;

		/* Grab the necessary DOM elements */
		var stage = document.getElementById('video-container'),
			v = document.getElementsByTagName('video')[0],
			controls = document.getElementById('video-controls');

		/* Array of possible browser specific settings for transformation */
		var properties = ['transform', 'WebkitTransform', 'MozTransform',
	                    'msTransform', 'OTransform'],
			prop = properties[0];

		/* Iterators and stuff */
		var i, j, t;

		/* Find out which CSS transform the browser supports */
		for (i = 0, j = properties.length; i < j; i++) {
			if (typeof stage.style[properties[i]] !== 'undefined') {
				prop = properties[i];
				break;
			}
		}

		/* Position video */
		v.style.left = 0;
		v.style.top = 0;

		/* If there is a controls element, add the player buttons */
		/* TODO: why does Opera not display the rotation buttons? */
		if (controls) {
			// controls.innerHTML = controls.innerHTML +
			var controllers = document.createElement("change");
			controllers.innerHTML =
				'<button class="zoomin">+</button>' +
				'<button class="zoomout">-</button>' +
				'<button class="left">⇠</button>' +
				'<button class="right">⇢</button>' +
				'<button class="up">⇡</button>' +
				'<button class="down">⇣</button>' +
				'<button class="rotateleft">&#x21bb;</button>' +
				'<button class="rotateright">&#x21ba;</button>' +
				'<button class="reset">reset</button>';
			controls.insertAdjacentElement('beforeend', controllers)
		}

		/* If a button was clicked (uses event delegation)...*/
		controls.addEventListener('click', function (e) {
			t = e.target;
			if (t.nodeName.toLowerCase() === 'button') {

				/* Check the class name of the button and act accordingly */
				switch (t.className) {

					/* Increase zoom and set the transformation */
				case 'zoomin':
					zoom = zoom + 0.1;
					v.style[prop] = 'scale(' + zoom + ') rotate(' + rotate + 'deg)';
					break;

					/* Decrease zoom and set the transformation */
				case 'zoomout':
					zoom = zoom - 0.1;
					v.style[prop] = 'scale(' + zoom + ') rotate(' + rotate + 'deg)';
					break;

					/* Increase rotation and set the transformation */
				case 'rotateleft':
					rotate = rotate + 5;
					v.style[prop] = 'rotate(' + rotate + 'deg) scale(' + zoom + ')';
					break;
					/* Decrease rotation and set the transformation */
				case 'rotateright':
					rotate = rotate - 5;
					v.style[prop] = 'rotate(' + rotate + 'deg) scale(' + zoom + ')';
					break;

					/* Move video around by reading its left/top and altering it */
				case 'left':
					v.style.left = (parseInt(v.style.left, 10) - 5) + 'px';
					break;
				case 'right':
					v.style.left = (parseInt(v.style.left, 10) + 5) + 'px';
					break;
				case 'up':
					v.style.top = (parseInt(v.style.top, 10) - 5) + 'px';
					break;
				case 'down':
					v.style.top = (parseInt(v.style.top, 10) + 5) + 'px';
					break;

					/* Reset all to default */
				case 'reset':
					zoom = 1;
					rotate = 0;
					v.style.top = 0 + 'px';
					v.style.left = 0 + 'px';
					v.style[prop] = 'rotate(' + rotate + 'deg) scale(' + zoom + ')';
					break;
				}
				zoomScale = zoom;
				e.preventDefault();
			}
		}, false);
	})();


    var wsOnMsg = function(message) {
    	var parsedMessage = JSON.parse(message.data);
    	console.info('Received message: ' + message.data);

    	switch (parsedMessage.id) {
    	case 'startResponse':
    		startResponse(parsedMessage);
    		break;
    	case 'error':
    		onError('Error message from server: ' + parsedMessage.message);
    		break;
    	case 'playEnd':
    		playEnd(video1, ws1);
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

  var start = function (sorceUrl, targetVideo, targetWs) {
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

  var onOffer = function (error, offerSdp, sorceUrl, targetWs) {

  	if (error)
  		return console.error('Error generating the offer');

  	var message = {
  		id : 'start',
  		sdpOffer : offerSdp,
  		videourl : sorceUrl
  		// rtsp://mpv.cdn3.bigCDN.com:554/bigCDN/definst/mp4:bigbuckbunnyiphone_400.mp4
  	}
  	sendMessage(message, targetWs);
  }

  var onError = function (error) {
  	console.error(error);
  }

  var onIceCandidate = function (candidate, targetWs) {
  	console.log('Local candidate' + JSON.stringify(candidate));

  	var message = {
  		id : 'onIceCandidate',
  		candidate : candidate
  	}
  	sendMessage(message, targetWs);
  }

  var startResponse = function (message) {
  	setState(I_CAN_STOP);
  	console.log('SDP answer received from server. Processing ...');

  	webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
  		if (error)
  			return console.error(error);
  	});
  }

  var pause = function (targetWs) {
  	togglePause()
  	console.log('Stopping video ...');
  	playButton.innerHTML = "Play";

  	if(seekUpdateTimer){
  		window.clearInterval(seekUpdateTimer);
  		seekUpdateTimer = null;
  	}
  	console.log('Pausing video ...');
  	var message = {
  		id : 'pause'
  	}
  	sendMessage(message, targetWs);
  }

  var resume = function (targetWs) {
  	playButton.innerHTML = "Pause";
  	seekUpdateTimer = setInterval(seekUpdate, 1000);
  	togglePause()
  	console.log('Resuming video ...');
  	var message = {
  		id : 'resume'
  	}
  	sendMessage(message, targetWs);
  }

  var stop = function (targetWs, targetVideo) {
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
  		sendMessage(message, targetWs);
  	}
  	hideSpinner(targetVideo);
  }

  var playEnd = function (targetVideo, targetWs) {
  	setState(I_CAN_START);
  	hideSpinner(targetVideo);
  	stop(targetWs, targetVideo)
  	playing += 1;

  	if(playing < fileList.length){
  		start(fileList[playing], targetVideo, targetWs);
  	}
  }

  var doSeek = function (targetWs, targetVideo) {
  	var seekPosition = parseInt(document.getElementById('duration').value * (seekBar.value / 100));
  	seeking = true;
  	targetVideo.currentTime = seekPosition;
  	if(seekUpdateTimer){
  		window.clearInterval(seekUpdateTimer);
  		seekUpdateTimer = null;
  	}


  	var message = {
  		id : 'doSeek',
  		position: seekPosition
  	}
  	sendMessage(message, targetWs);
  }

  var getPosition = function (targetWs) {
  	var message = {
  		id : 'getPosition'
  	}
  	sendMessage(message, targetWs);
  }

  var showVideoData = function (parsedMessage) {
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

  var setState = function (nextState) {
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

  var sendMessage = function (message, targetWs) {
  	var jsonMessage = JSON.stringify(message);
  	console.log('Senging message: ' + jsonMessage);
  	// if(!targetWs) targetWs = ws
  	targetWs.send(jsonMessage);
  }

  var togglePause = function () {
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

  var disableButton = function (id) {
  	$(id).attr('disabled', true);
  	$(id).removeAttr('onclick');
  }

  var enableButton = function (id, functionName) {
  	$(id).attr('disabled', false);
  	if (functionName) {
  		$(id).attr('onclick', functionName);
  	}
  }

  var showSpinner = function () {
  	for (var i = 0; i < arguments.length; i++) {
  		arguments[i].poster = './img/transparent-1px.png';
  		arguments[i].style.background = "center transparent url('./img/spinner.gif') no-repeat";
  	}
  }

  var hideSpinner = function () {
  	for (var i = 0; i < arguments.length; i++) {
  		arguments[i].src = '';
  		arguments[i].poster = './img/webrtc.png';
  		arguments[i].style.background = '';
  	}
  }


}
