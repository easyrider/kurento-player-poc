function createVideoPlayer(wsUrl, videoContainerId, fileList, videoStartTime){
  var seekUpdateTimer = undefined;
  var seekUpdate = function() {
    if (currentVideo.isNotLive && !seeking) { 
      getPosition(currentSocket);
    } else {
      console.log('live video, don\' need getPosition');
    }
  }

  var seeking = false;
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
  var fullScreenButton = videoContainer.find(".full-screen");
  var seekBar = videoContainer.find(".seek-bar");
  var volumeBar = videoContainer.find(".volume-bar");
  var timing = videoContainer.find(".timing");

  //default player is video1
  var currentUsing = 1;
  var currentProcess = 1;
  var currentVideo = video1;
  var currentSocket = ws1;
  var bufferPrepared = false;
  var multiFile = false;
  var multiFileInfo = [];
  var multiFileInfoTotalTime;
  var multiFileLoading = false;
  var multiFileLoadingimer = undefined;
  var multiFileSeeking = undefined;

  //store video info
  //currentVideo.isSeekable = undefined;
  //currentVideo.initSeekable = undefined;
  //currentVideo.endSeekable = undefined;
  currentVideo.videoDuration = undefined;
  currentVideo.isNotLive = undefined;
  currentVideo.started = undefined;

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
    if (videoAdjust.zoom > 1) {
      adjustVideo('zoom',-0.1);
    }
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

    const videoWidth = currentVideo.videoWidth;
    const videoHeight = currentVideo.videoHeight;
    const zoomRatio = videoAdjust.zoom;
    // why it really working!! why!! why!! why!!
    const unknowRatio = 1 / zoomRatio;

    var playerAndVideoRatio = currentVideo.videoWidth / currentVideo.clientWidth;
    // if video is 1080x1920 not 1920x1080, it's a vertical Video
    // vertical Video will fit by height not width
    var verticalVideoRatio = currentVideo.videoHeight / currentVideo.clientHeight;
    if ( verticalVideoRatio > playerAndVideoRatio ) {
      playerAndVideoRatio = verticalVideoRatio;
    }

    var totalWidthCrop = videoWidth * ( zoomRatio -1 ) * unknowRatio;
    var leftCrop = totalWidthCrop / 2 - videoAdjust.left * playerAndVideoRatio * unknowRatio;
    //var rightCrop = totalWidthCrop / 2 + videoAdjust.left * playerAndVideoRatio * unknowRatio;

    var totalHeightCrop = videoHeight * ( zoomRatio -1 ) * unknowRatio;
    var topCrop = totalHeightCrop / 2 - videoAdjust.top * playerAndVideoRatio * unknowRatio;
    //var buttonCrop = totalHeightCrop / 2 + videoAdjust.top * playerAndVideoRatio * unknowRatio;

    //guide: http://www.w3schools.com/tags/canvas_drawimage.asp
    var cropX = leftCrop;    //完整一張圖，從左邊裁調多少px
    var cropY = topCrop;     //完整一張圖，從上面裁調多少px
    var cropW = videoWidth - totalWidthCrop;   //上面裁切後，取多少寬度
    var cropH = videoHeight - totalHeightCrop; //上面裁切後，取多少高度
    var fullW = videoWidth;  //上面裁切都結束後，最後輸出的寬度
    var fullH = videoHeight; //上面裁切都結束後，最後輸出的高度

    //canvas's size, or after all, it will be crop again
    canvas.width = currentVideo.videoWidth;
    canvas.height = currentVideo.videoHeight;

    console.log('drawImage params=>', cropX,cropY,cropW,cropH,0,0,fullW,fullH);

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
      // just load video
      // preload mutiFiles
      if (multiFileLoading) {
        console.log('=======================multiFileLoading=========================');
        multiFileInfo.push(JSON.parse(message.data).videoDuration);
        console.log(multiFileInfo);

        // cleanup current webrtc
        webRtcPeer1.dispose();
        webRtcPeer = null;

        if (fileList.length == multiFileInfo.length) {
          console.log('all video Duration loaded')
          multiFileLoading = false;
          break;
        } else {
          console.log('some video Duration not loaded')
          preLoadInfo(multiFileInfo.length);
          break;
        }
      } else if (bufferPrepared==false) {
        var targetVideo = currentVideo;
        var targetWs = currentSocket;
      // preload mutiFiles
      // preload video for gpaless play
      } else {
        if ( currentUsing==1 ) {
          var targetVideo = video2;
          var targetWs = ws2;
        } else {
          var targetVideo = video1;
          var targetWs = ws1;
        }
        targetVideo.isNotLive = ( parsedMessage.isSeekable && parsedMessage.videoDuration>0 );
        if (targetVideo.isNotLive) {
          pause(targetWs,true);
          sendSeek(targetWs,targetVideo,0);
        }
      }

      targetVideo.videoDuration = parsedMessage.videoDuration;
      targetVideo.isNotLive = ( parsedMessage.isSeekable && parsedMessage.videoDuration>0 );
      if (targetVideo.isNotLive) {
        console.log('seekbar should show');
        toggleSeekBar(true);
      } else {
        console.log('seekbar should hide');
        toggleSeekBar(false);
      }

      if (multiFileSeeking) {
        doSeek(currentSocket, currentVideo);
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
      if (parsedMessage.message == 'success' ) {
        // console.log("=== seek seeking ===", seeking);
        toggleSeekTimer(true);
      } else {
        console.log('seek failed')
      }
      break;
    case 'position':
      var videoPosition = 0;
      var seekBar = videoContainer.find(".seek-bar")[0];

      var duration;
      if (!multiFile) {
        videoPosition = parsedMessage.position;
        duration = currentVideo.videoDuration;
      } else { 
        for (var index=0; index < playing; index++) {
          console.log('seekbar value should add previewious video ');
          videoPosition += multiFileInfo[index];
        }
        videoPosition += parsedMessage.position;
        duration = multiFileInfoTotalTime;

        //console.log(duration);
        //console.log(videoPosition);
      }
      var durationSecond = parseInt(duration / 1000);
      var positionSecond = parseInt(videoPosition / 1000);

      var durationMinute = parseInt(durationSecond/60);
      var positionMinute = parseInt(positionSecond/60);

      durationSecond = ( durationSecond % 60 );
      positionSecond = ( positionSecond % 60 );

      var timingText = durationMinute.toString() + ":" + durationSecond + " / " +
          positionMinute.toString() + ":" + positionSecond.toString();

      timing.text(timingText);

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


  var preLoadInfo = function(fileListNumber) {
      var options = {
        onicecandidate : function(candidate){
          onIceCandidate(candidate, ws1)
        }
      }
      webRtcPeer1 = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error) {
        if (error) {
          return console.error(error);
        }

        webRtcPeer1.generateOffer(function(error, offerSdp){
          onOffer(error, offerSdp, fileList[fileListNumber], ws1)
        });
      });
  }  

  // actually video control functions
  var start = function (sorceUrl, targetVideo, targetWs, noToggle) {
    if (noToggle===undefined||noToggle==false) {
      // Disable start button
      console.log("=== sorceUrl ===", sorceUrl);
      togglePause();
    }
    showSpinner(targetVideo);
    var startVideo = function() {
      // Video and audio by default
      var userMediaConstraints = {
        audio : true,
        video : true
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
      targetVideo.started = true;
    }

    var multiFileInfoLoaded = (!multiFile);
    // preload all file info for totalLength
    if (fileList.length>1&&multiFileInfoLoaded) {
      console.log('===multiFiles===');
      console.log('===enable toggles===');
      multiFile = true;
      multiFileLoading = true;
      preLoadInfo(0);

      if (videoStartTime) {
        console.log('it\'s videoStartTime, maybe can read time from videoStartTime, not finish');
      }

      multiFileLoadingTimer = setInterval(function(checkLoaded) {
        if (multiFileLoading) {
          console.log('still loading all video info');
        } else {
          console.log('all video info loaded');
          clearInterval(multiFileLoadingTimer);

          multiFileInfoTotalTime = 0;
          multiFileInfo.forEach(function(entry) {
            multiFileInfoTotalTime += entry;
          });
          console.log(multiFileInfoTotalTime);

          startVideo();
        }
      }, 1000);

    } else {
      startVideo();
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
      toggleSeekTimer(false);
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
      toggleSeekTimer(true);
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
      toggleSeekTimer(false);
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
      currentVideo.style.display = "";

      // another video may start or not
      if (currentVideo.started) {
        resume(currentSocket,true);
      } else {
        start(fileList[playing], currentVideo, currentSocket);
      }

      // restore adjust
      adjustVideo();
      if (fullscreen) {
        console.log('resume fullscreen');
        toggleFullscreen();
      }
    // playlist end
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
    if (currentVideo.videoDuration===undefined || !currentVideo.isNotLive) {
      console.log('should not doSeek');
      return 0;
    }
    var totalVideoDuration;
    if (multiFile) {
      totalVideoDuration = multiFileInfoTotalTime;
    } else {
      totalVideoDuration = currentVideo.videoDuration;
    }

    var seekPosition = parseInt(totalVideoDuration * (seekBar.val() / 100));
    seeking = true;
    toggleSeekTimer(false);

    if (multiFile) {
      for (var index in properties) { 
        fileDuration = multiFileInfo[index];
        if (seekPosition < fileDuration) {
          console.log('in file '+index.toString());
          break;
        } else {
          seekPosition -= fileDuration;
        }
      }

      if (index==playing) {
        console.log('just seek');
        sendSeek(targetWs, targetVideo, seekPosition);
        multiFileSeeking = false;
      } else {
        console.log('need switch file');
        stop(currentSocket,currentVideo,false);
        playing = index;
        start(fileList[playing], currentVideo, currentSocket);
        multiFileSeeking = true;
        togglePause(true);
        
        //throw('not finish');
      }
    } else {
      sendSeek(targetWs, targetVideo, seekPosition);
    }
  }

  var sendSeek = function (targetWs, targetVideo, seekPosition) {
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

  var togglePause = function (forceToPause) {
    var pauseText = playButton.text();
    if (pauseText == "Play" || forceToPause ) {
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

  var toggleSeekBar = function (showOrHide) {
    if (showOrHide===true) {
      // cleanup seekUpdateTimer if exist
      toggleSeekTimer(true);
      videoContainer.find('.seek-bar').css('display', 'inline');
      videoContainer.find('.live').css('display', 'none');
    
    } else {
      toggleSeekTimer(false);
      videoContainer.find('.seek-bar').css('display', 'none');
      videoContainer.find('.live').css('display', 'inline');
    }
  }

  var toggleSeekTimer = function (startOrStop) {
    if (startOrStop===true) {
      // enable timer if not exist
      if (! seekUpdateTimer) {
        seekUpdateTimer = setInterval(seekUpdate, 1000);
      }

    } else {
      // diseable timer if exist
      if(seekUpdateTimer) {
        window.clearInterval(seekUpdateTimer);
        seekUpdateTimer = null;
      }

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
