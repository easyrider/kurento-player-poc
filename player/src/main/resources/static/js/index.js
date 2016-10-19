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

  // in zul, URL is playList
  var params = [ 'URL', 'startTime', 'videoLength', 'videoStartTime' ];
  var paramString = {};

  params.forEach(function(param) {
    var loading = getUrlParameter(param);
    paramString[param] = loading.split(',');
  })
  console.log(paramString);

  createVideoPlayer(wsUrl, videoContainerId, 
    paramString.URL, paramString.videoLength, paramString.videoStartTime);
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
