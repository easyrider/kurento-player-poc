function createVideoPlayer(wsUrl, videoContainerId, fileList){
    var console = new Console();
    var state = null;
    var isSeekable = false;

    var I_CAN_START = 0;
    var I_CAN_STOP = 1;
    var I_AM_STARTING = 2;
    var seekUpdateTimer = undefined;
    var seekUpdate = function() {
      if(!seeking) getPosition(currentSocket)
    }

    var seeking = false
    var playing = 0;

    var zoomScale = 1;
    var started = false;

    var videoContainer = $( "#"+videoContainerId );
    var webRtcPeer;

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
    var currentVideo = video1;
    var currentSocket = ws1;
    var bufferPrepared = false;

    //store video info
    currentVideo.isSeekable = undefined;
    currentVideo.initSeekable = undefined;
    currentVideo.endSeekable = undefined;
    currentVideo.videoDuration = undefined;

    playButton.click(function() {

    var actionName = playButton.text();
    if (actionName == "Play") {
      // Play the video
      if(!started){
        started = true;
        start(fileList[0], currentVideo, currentSocket)
      } else {
        resume(currentSocket)
      }

      /*
      setTimeout(function(){
        console.log("=== start video2 ===");
        start(fileList[1], video2, ws2)
      }, 5000)

      setTimeout(function(){
        console.log("=== show video2 ===");
        video1.style.display = 'none';
        video2.style.display = 'block';
      }, 10000)
      */


      // Update the button text to 'Pause'

    } else {
      // Pause the video
      pause(currentSocket);

      // Update the button text to 'Play'
    }
  });


  seekBar.change(function() {
    console.log('=== seekBar Changed!! ===');
    console.log(currentSocket);
    console.log(currentVideo);
    doSeek(currentSocket, currentVideo)
  });

  volumeBar.change(function() {
    // Update the video volume
    currentVideo.volume = volumeBar.val();
  });

  fullScreenButton.click(function() {
    if (currentVideo.requestFullscreen) {
      currentVideo.requestFullscreen();
    } else if (currentVideo.mozRequestFullScreen) {
      currentVideo.mozRequestFullScreen(); // Firefox
    } else if (currentVideo.webkitRequestFullscreen) {
      currentVideo.webkitRequestFullscreen(); // Chrome and Safari
    }
  });


  // bar end

  var SCREENSHOTS = (function(){
    console.log("SCREENSHOTS");

    //SCREENSHOTS
    //for screenshot options and creation
    var image = $('#image')[0];
    var size = videoContainer.find(".size")[0];
    var screenshotsize = videoContainer.find(".screenshotsize")[0];

    //control size of screenshot
    size.addEventListener('change', function(){
      var s = this.value;
      screenshotsize.innerHTML = s;
    }, false);

    var screenshot = videoContainer.find(".screenshot-button");
    screenshot.click(function() {

      //grab current video frame and put it into a canvas element, consider screenshotsize
      canvas = document.createElement("canvas");
      var context = canvas.getContext('2d');

      var w = currentVideo.videoWidth * size.value;
      var h = currentVideo.videoHeight * size.value;
      canvas.width = w;
      canvas.height = h;
      var fullW = zoomScale * size.value * currentVideo.videoWidth;
      var fullH = zoomScale * size.value * currentVideo.videoHeight;

      var zoomW = (zoomScale * currentVideo.videoWidth);
      var zoomH = (zoomScale * currentVideo.videoHeight);

      var scaleX = zoomScale === 1 ? 0 : (zoomW - currentVideo.videoWidth) / 2;
      var scaleY = zoomScale === 1 ? 0 : (zoomH - currentVideo.videoHeight) / 2;
      var scaleW = currentVideo.videoWidth / zoomScale;
      var scaleH = currentVideo.videoHeight / zoomScale;

      console.log('drawImage params=>', scaleX,scaleY,scaleW,scaleH,0,0,fullW,fullH);

      context.drawImage(currentVideo,scaleX,scaleY,scaleW,scaleH,0,0,fullW,fullH);

      //lets make a screenshot
      image.src = canvas.toDataURL();
      image.style.display = "block";

    });
  })();

  // -----------------------------------------------------------------------
  // there will create extra controlls elements
  var vidControls = (function () {
    /* predefine zoom and rotate */
    var zoom = 1,
      rotate = 0;

    /* Grab the necessary DOM elements */
    var stage = videoContainer[0];
    var v = currentVideo;
    var controls = videoContainer.find('.video-controls')[0];

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
      console.log(e);
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
          } else {
            video1.isSeekable = parsedMessage.isSeekable;
            video1.initSeekable = parsedMessage.initSeekable;
            video1.endSeekable = parsedMessage.endSeekable;
            video1.videoDuration = parsedMessage.videoDuration;
            pause(ws1,true);
          }
          console.log('someThing have to process');
        }
        break;
      case 'iceCandidate':
        webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
          if (error)
            return console.error('Error adding candidate: ' + error);
        });
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
          //playing += 1;

          if(nextPlaying < fileList.length) {
            console.log('less than 10 second, prepare next video!!');
            if (currentUsing==1) {
              console.log('now using video1, prepare next on video2')
              start(fileList[nextPlaying], video2, ws2);
            } else {
              console.log('now using video2, prepare next on video1')
              start(fileList[nextPlaying], video1, ws1);
            }
          }
        }
        
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
    ws1.onmessage = wsOnMsg;
    ws2.onmessage = wsOnMsg;

  var start = function (sorceUrl, targetVideo, targetWs) {
    // Disable start button
    console.log("=== sorceUrl ===", sorceUrl);
    togglePause();
    if (! seekUpdateTimer) {
      seekUpdateTimer = setInterval(seekUpdate, 1000);
    }
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
    playing += 1;

    //start(fileList[playing], targetVideo, targetWs);
    if(playing < fileList.length){
      console.log('switching video ')
      //switch video player here
      currentVideo.style.display = "none";
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
    } else {
      setState(I_CAN_START);
      hideSpinner(targetVideo);
      stop(ws1, video1);
      stop(ws2, video2);
      started = false;
      togglePause();
    }
    bufferPrepared = false;

  }

  var doSeek = function (targetWs, targetVideo) {
    var seekPosition = parseInt(currentVideo.videoDuration * (seekBar.val() / 100));
    seeking = true;
    console.log();
    console.log(seekPosition);
    console.log(targetVideo.currentTime);
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

  var togglePause = function (Status) {
    var pauseText = playButton.text();
    if (pauseText == "Play") {
      playButton.text("Pause");
      //$("#pause-icon").attr('class', 'glyphicon glyphicon-pause');
      //$("#pause").attr('onclick', "pause()");
    } else {
      playButton.text("Play");
      //$("#pause-icon").attr('class', 'glyphicon glyphicon-play');
      //$("#pause").attr('onclick', "resume()");
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
