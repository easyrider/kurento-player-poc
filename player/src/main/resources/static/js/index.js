var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

window.onload = function() {
  var protocol = (location.protocol == "https:" ? "wss://" : "ws://") ;
  var inCityEyes = location.pathname.split("/")[1]=="CityEyes";
  var path = (inCityEyes ? "/CityEyes/rest/player" : "/player" );
  var wsUrl = protocol + location.host + path;
  var videoContainerId = "video-container-1";

  var params = [ 'URL', 'startTime', 'videoLength', 'videoStartTime' ];
  var paramString = {};

  // in zul, it called "playList"
  var source = getUrlParameter('URL');
  var fileList;
  if (source) {
    fileList = source.split(',');
  } else {
    fileList = [source];
  }
  console.log(fileList);

  /*
  var startTime = getUrlParameter('startTime').split(',');
  console.log(startTime);

  var videoLength = getUrlParameter('videoLength').split(',');
  console.log(videoLength);

  var videoStartTime = getUrlParameter('videoStartTime').split(',');
  console.log(videoStartTime);

  createVideoPlayer(wsUrl, videoContainerId, fileList,videoStartTime);
  */

  createVideoPlayer(wsUrl, videoContainerId, fileList);
}

window.onbeforeunload = function() {
	// ws.close();
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});
