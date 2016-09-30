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
  // TODO:
  // moving zoomin, zoomout, rotateleft, left, right, up, down to use these
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
  /*
  for (var i = 0, properties.length; i < properties.length; i++) {
    if (typeof stage.style[properties[i]] !== 'undefined') {
      prop = properties[i];
      break;
    }
  }
  */


  playButton.click(function() {
    var actionName = playButton.text();
    if (actionName == "Play") {
      // Play the video
      if(!started){
        started = true;
        start(fileList[0], currentVideo, currentSocket);
      } else {
        resume(currentSocket);
      }
    } else {
      // Pause the video
      pause(currentSocket);
    }
  });

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

  var SCREENSHOTS = (function(){
    console.log("SCREENSHOTS");

    //SCREENSHOTS
    //for screenshot options and creation
    var image = $('#image')[0];

    var screenshot = videoContainer.find(".screenshot-button");
    screenshot.click(function() {

      //grab current video frame and put it into a canvas element, consider screenshotsize
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
      image.src = canvas.toDataURL();
      image.style.display = "block";

    });
  })();

  // -----------------------------------------------------------------------
  // there will create extra controlls elements
  var vidControls = (function () {

    /* Grab the necessary DOM elements */
    var stage = videoContainer[0];
    var v = currentVideo;
    var controls = videoContainer.find('.video-controls')[0];

    /* If there is a controls element, add the player buttons */
    /* TODO: why does Opera not display the rotation buttons? */
    if (controls) {
      // controls.innerHTML = controls.innerHTML +
      // TODO: use jQuery's methos to add control element.. 
      //       or direct add on index.html ?
      var extraControllers = document.createElement("change");
      extraControllers.innerHTML =
        '<button class="zoomin">+</button>' +
        '<button class="zoomout">-</button>' +
        '<button class="left">⇠</button>' +
        '<button class="right">⇢</button>' +
        '<button class="up">⇡</button>' +
        '<button class="down">⇣</button>' +
        '<button class="rotateleft">&#x21bb;</button>' +
        '<button class="rotateright">&#x21ba;</button>' +
        '<button class="reset">reset</button>';
      controls.insertAdjacentElement('beforeend', extraControllers)
    }

    /* If a button was clicked (uses event delegation)...*/
    // TODO: use jQuer's controls.click instead
    controls.addEventListener('click', function (e) {
      t = e.target;
      console.log("this class Name clicked: "+t.className);
      if (t.nodeName.toLowerCase() === 'button') {

        /* Check the class name of the button and act accordingly */
        switch (t.className) {

          /* Increase zoom and set the transformation */
        case 'zoomin':
          videoAdjust.zoom += 0.1;
          v.style[videoAdjust.transform] = 
              'scale(' + videoAdjust.zoom + ') rotate(' + videoAdjust.rotate + 'deg)';
          break;

          /* Decrease zoom and set the transformation */
        case 'zoomout':
          videoAdjust.zoom -= 0.1;
          v.style[videoAdjust.transform] = 
              'scale(' + videoAdjust.zoom + ') rotate(' + videoAdjust.rotate + 'deg)';
          break;

          /* Increase rotation and set the transformation */
        case 'rotateleft':
          videoAdjust.rotate += 5;
          v.style[videoAdjust.transform] = 
              'scale(' + videoAdjust.zoom + ') rotate(' + videoAdjust.rotate + 'deg)';
          break;
          /* Decrease rotation and set the transformation */
        case 'rotateright':
          videoAdjust.rotate -= 5;
          v.style[videoAdjust.transform] = 
              'scale(' + videoAdjust.zoom + ') rotate(' + videoAdjust.rotate + 'deg)';
          break;

        /* Move video around by reading its left/top and altering it */
        case 'left':
          videoAdjust.left -= 5;
          v.style.left = (videoAdjust.left) + 'px';
          break;
        case 'right':
          videoAdjust.left += 5;
          v.style.left = (videoAdjust.left) + 'px';
          break;
        case 'up':
          videoAdjust.top -= 5;
          v.style.top = (videoAdjust.top) + 'px';
          break;
        case 'down':
          videoAdjust.top -= 5;
          v.style.top = (videoAdjust.top) + 'px';
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
        e.preventDefault();
      }
    }, false);
  })();

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
