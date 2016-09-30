function createVideoPlayer(wsUrl, videoContainerId, fileList){
  var console = new Console();
  var isSeekable = false;

  var seekUpdateTimer = undefined;
  var seekUpdate = function() {
    if(!seeking) getPosition(currentSocket)
  }

  var seeking = false
  var playing = 0;
  var started = false;
  var videoAdjust = {
    zoom: 1,
    rotate: 0,
    left: 0,
    top: 0
  };

  var videoContainer = $( "#"+videoContainerId );
  var webRtcPeer1;
  var webRtcPeer2;

  var ws1 = new WebSocket(wsUrl);
  var ws2 = new WebSocket(wsUrl);

  var video1 = videoContainer.find('.video.primary')[0];
  var video2 = videoContainer.find('.video.slave')[0];

  var playButton = videoContainer.find(".play-pause");

  // mute button not complete 
  // no Action register on mute button
  var muteButton = videoContainer.find(".mute");

  var fullScreenButton = videoContainer.find(".full-screen");

  var seekBar = videoContainer.find(".seek-bar");
  var volumeBar = videoContainer.find(".volume-bar");

  var controlPanel = [playButton, seekBar, muteButton, muteButton, fullScreenButton]

  //default player is video1
  var currentUsing = 1;
  var currentProcess = 1;
  var currentVideo = video1;
  var currentSocket = ws1;
  var bufferPrepared = false;

  //store video info
  currentVideo.isSeekable = undefined;
  currentVideo.initSeekable = undefined;
  currentVideo.endSeekable = undefined;
  currentVideo.videoDuration = undefined;

  var screenshotImage = $("#image");

  // Array of possible browser specific settings for transformation
  var properties = ['transform', 'WebkitTransform', 'MozTransform',
                    'msTransform', 'OTransform'];
  // Find out which CSS transform the browser supports
  for (var key in properties) {
    var element = properties[key];
    if (currentVideo.style[element]==='') {
      videoAdjust.transform = element;
      break;
    }
  }

  // click event
  playButton.click(function() {
    var actionName = playButton.text();
    if (actionName == "Play") {
      // Play the video
      if(!started){
        started = true;
        start(fileList[playing], currentVideo, currentSocket);
      } else {
        resume(currentSocket);
      }
    } else {
      // Pause the video
      pause(currentSocket);
    }
  });

  videoContainer.find('.zoomin').click(function() {
    adjustVideo('zoom',0.1);
  });

  videoContainer.find('.zoomout').click(function() {
    adjustVideo('zoom',-0.1);
  });

  videoContainer.find('.rotateleft').click(function() {
    adjustVideo('rotate',5);
  });

  videoContainer.find('.rotateright').click(function() {
    adjustVideo('rotate',-5);
  });

  videoContainer.find('.left').click(function() {
    adjustVideo('left',-5);
  });

  videoContainer.find('.right').click(function() {
    adjustVideo('left',5);
  });

  videoContainer.find('.up').click(function() {
    adjustVideo('top',-5);
  });

  videoContainer.find('.down').click(function() {
    adjustVideo('top',5);
  });

  videoContainer.find('.reset').click(function() {
    adjustVideo('reset');
  });

  videoContainer.find(".screenshot-button").click(function() {
    canvas = document.createElement("canvas");
    var context = canvas.getContext('2d');

    var cropX = 0;  //從左邊裁調多少px
    var cropY = 0;  //從上面裁調多少px
    var cropW = currentVideo.videoWidth;  //上面裁切後，取多少寬度
    var cropH = currentVideo.videoHeight; //上面裁切後，取多少高度
    var fullW = currentVideo.videoWidth;  //上面裁切都結束後，最後輸出的寬度
    var fullH = currentVideo.videoHeight; //上面裁切都結束後，最後輸出的高度

    //canvas's size, or after all, it will be crop again
    canvas.width = fullW;
    canvas.height = fullH;

    console.log('drawImage params=>', cropX,cropY,cropW,cropH,0,0,fullW,fullH);

    //guide: http://www.w3schools.com/tags/canvas_drawimage.asp
    context.drawImage(currentVideo,cropX,cropY,cropW,cropH,0,0,fullW,fullH);

    //lets make a screenshot
    screenshotImage.attr('src', canvas.toDataURL() );
    screenshotImage.css('display', "block");

  });

  // change event
  seekBar.change(function() {
    doSeek(currentSocket, currentVideo)
  });

  volumeBar.change(function() {
    // Update the video volume
    currentVideo.volume = volumeBar.val();
  });

  fullScreenButton.click(function() {
    toggleFullscreen();
  });
  // bar end

  var adjustVideo = function(mode,amout) {
    switch (mode) {
      case 'reset':
        videoAdjust.left = 0;
        videoAdjust.top = 0;
        videoAdjust.zoom = 1;
        videoAdjust.rotate = 0;
        break;
      case undefined:
        break;
      default:
        // default can be left, top, zoom, rotate
        videoAdjust[mode] += amout;
        break;
    }

    // apply setting
    currentVideo.style.top = (videoAdjust.top) + 'px';
    currentVideo.style.left = (videoAdjust.left) + 'px';
    currentVideo.style[videoAdjust.transform] = 
      'scale(' + videoAdjust.zoom + ') rotate(' + videoAdjust.rotate + 'deg)';
  }

  // WebSocket action all here
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
      playEnd(currentVideo, currentSocket);
      break;
    case 'videoInfo':
      if (bufferPrepared==false) {
        currentVideo.isSeekable = parsedMessage.isSeekable;
        currentVideo.initSeekable = parsedMessage.initSeekable;
        currentVideo.endSeekable = parsedMessage.endSeekable;
        currentVideo.videoDuration = parsedMessage.videoDuration;
      } else {
        if (currentUsing==1) {
          video2.isSeekable = parsedMessage.isSeekable;
          video2.initSeekable = parsedMessage.initSeekable;
          video2.endSeekable = parsedMessage.endSeekable;
          video2.videoDuration = parsedMessage.videoDuration;
          pause(ws2,true);
          // TODO: should seek to head, or it will lose 1second video
          // issue #17
        } else {
          video1.isSeekable = parsedMessage.isSeekable;
          video1.initSeekable = parsedMessage.initSeekable;
          video1.endSeekable = parsedMessage.endSeekable;
          video1.videoDuration = parsedMessage.videoDuration;
          pause(ws1,true);
          // TODO: should seek to head, or it will lose 1second video
          // issue #17
        }
      }
      break;
    case 'iceCandidate':
      if (currentProcess==1) {
        webRtcPeer1.addIceCandidate(parsedMessage.candidate, function(error) {
          if (error) {
            return console.error('Error adding candidate: ' + error);
          }
        });
      } else {
        webRtcPeer2.addIceCandidate(parsedMessage.candidate, function(error) {
          if (error) {
            return console.error('Error adding candidate: ' + error);
          }
        });
      }
      break;
    case 'seek':
      seeking = false;
      // console.log("=== seek seeking ===", seeking);
      setTimeout(function(){
        seekUpdateTimer = setInterval(seekUpdate, 1000);
      }, "3000")

      // console.log (parsedMessage.message);

      break;
    case 'position':
      var videoPosition = parsedMessage.position;
      var seekBar = videoContainer.find(".seek-bar")[0];
      var duration = currentVideo.videoDuration;
      var seekBarValue = videoPosition/duration * 100;
      // console.log("=== seekBarValue ===", seekBarValue);
      seekBar.value = seekBarValue

      var left = ( currentVideo.videoDuration - videoPosition ) / 1000;
      // console.log("=== left:"+left.toString()+" ===" )
      if (left<10 && bufferPrepared==false) {
        // even no next video, still have to mark prepared
        bufferPrepared = true;

        // check next video exist
        nextPlaying = playing + 1;
        if(nextPlaying < fileList.length) {
          console.log('less than 10 second, prepare next video!!');
          if (currentUsing==1) {
            console.log('now using video1, prepare next on video2')
            currentProcess = 2;
            start(fileList[nextPlaying], video2, ws2, true);
          } else {
            console.log('now using video2, prepare next on video1')
            currentProcess = 1;
            start(fileList[nextPlaying], video1, ws1, true);
          }
        }
      }
      
      break;
    case 'iceCandidate':
      break;
    default:
      //start = false;
      onError('Unrecognized message', parsedMessage);
    }
  }
  // register event when server send message over WebSocket
  ws1.onmessage = wsOnMsg;
  ws2.onmessage = wsOnMsg;

  // actually video control functions
  var start = function (sorceUrl, targetVideo, targetWs, noToggle) {
    if (noToggle===undefined||noToggle==false) {
      // Disable start button
      console.log("=== sorceUrl ===", sorceUrl);
      togglePause();
    }
    if (! seekUpdateTimer) {
      seekUpdateTimer = setInterval(seekUpdate, 1000);
    }
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

    if (currentProcess==1) {
      webRtcPeer1 = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
        if (error) {
          return console.error(error);
        }

        webRtcPeer1.generateOffer(function(error, offerSdp){
          onOffer(error, offerSdp, sorceUrl, targetWs)
        });
      });
    } else {
      webRtcPeer2 = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
        if (error) {
          return console.error(error);
        }

        webRtcPeer2.generateOffer(function(error, offerSdp){
          onOffer(error, offerSdp, sorceUrl, targetWs)
        });
      });
    }
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
    console.log('SDP answer received from server. Processing ...');

    var tarWebRtcPeer = undefined;
    if ( currentProcess==1 ) {
      tarWebRtcPeer = webRtcPeer1;
    } else {
      tarWebRtcPeer = webRtcPeer2;
    }
    tarWebRtcPeer.processAnswer(message.sdpAnswer, function(error) {
      if (error)
        return console.error(error);
    });
  }

  var pause = function (targetWs,wsOnly) {
    if (wsOnly===undefined||wsOnly===false) {
      togglePause();
      console.log('Stopping video ...');
      if(seekUpdateTimer){
        window.clearInterval(seekUpdateTimer);
        seekUpdateTimer = null;
      }
    }
    console.log('Pausing video ...');
    var message = {
      id : 'pause'
    }
    sendMessage(message, targetWs);
  }

  var resume = function (targetWs,wsOnly) {
    if (wsOnly===undefined||wsOnly===false) {
      togglePause();
      seekUpdateTimer = setInterval(seekUpdate, 1000);
    }
    console.log('Resuming video ...');
    var message = {
      id : 'resume'
    }
    sendMessage(message, targetWs);
  }

  var stop = function (targetWs, targetVideo, keepSeekUpdate) {
    console.log('Stopping video ...');
    if(keepSeekUpdate===undefined||keepSeekUpdate==false) {
      window.clearInterval(seekUpdateTimer);
      seekUpdateTimer = null;
    }

    var webRtcPeer = undefined;
    if (currentUsing==1) {
      webRtcPeer = webRtcPeer1;
    } else {
      webRtcPeer = webRtcPeer2;
    }
    console.log(webRtcPeer)
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
    playing += 1;

    //start(fileList[playing], targetVideo, targetWs);
    if(playing < fileList.length){
      console.log('switching video');
      // check video fullscreen or not
      var fullscreen = fetchFullscreen();
      if (fullscreen) {
        console.log('already fullscreen!!');
        toggleFullscreen();
      }
      
      // switch
      currentVideo.style.display = "none";
      stop(currentSocket,currentVideo,true);
      if (currentUsing==1) {
        currentUsing = 2;
        currentVideo = video2;
        currentSocket = ws2;
      } else {
        currentUsing = 1;
        currentVideo = video1;
        currentSocket = ws1;
      }
      resume(currentSocket,true)
      adjustVideo();
      currentVideo.style.display = "";
      if (fullscreen) {
        console.log('resume fullscreen');
        toggleFullscreen();
      }
    } else {
      hideSpinner(targetVideo);
      stop(ws1, video1);
      stop(ws2, video2);
      started = false;
      playing = 0;
      togglePause();
    }
    bufferPrepared = false;
  }

  var doSeek = function (targetWs, targetVideo) {
    // prevent user set seekbar before video load
    if (currentVideo.videoDuration===undefined) {
      return 0;
    }
    var seekPosition = parseInt(currentVideo.videoDuration * (seekBar.val() / 100));
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

  // low level function
  var sendMessage = function (message, targetWs) {
    var jsonMessage = JSON.stringify(message);
    console.log('Senging message: ' + jsonMessage);
    targetWs.send(jsonMessage);
  }

  var togglePause = function () {
    var pauseText = playButton.text();
    if (pauseText == "Play") {
      playButton.text("Pause");
    } else {
      playButton.text("Play");
    }
  }

  var fetchFullscreen = function () {
    if ( document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ) {
        return true;
    } else {
      return false;
    }
    
  }

  var toggleFullscreen = function () {
    if ( fetchFullscreen() ) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        }
    } else {
      if (currentVideo.requestFullscreen) {
        currentVideo.requestFullscreen();
      } else if (currentVideo.mozRequestFullScreen) {
        currentVideo.mozRequestFullScreen(); // Firefox
      } else if (currentVideo.webkitRequestFullscreen) {
        currentVideo.webkitRequestFullscreen(); // Chrome and Safari
      } else if (currentVideo.msRequestFullscreen) {
        currentVideo.msRequestFullscreen(); // IE11
      }
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
