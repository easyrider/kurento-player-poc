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
  const inCityEyes = location.pathname.split("/")[1]=="CityEyes";
  var path = (inCityEyes ? "/CityEyes/rest/player" : "/player" );
  var wsUrl = protocol + location.host + path;
  var videoContainerId = "video-container-1";
  var source = getUrlParameter('URL');
  var fileList;
  if (source && source[0]=='[') {
    fileList = JSON.parse(source);
  } else {
    fileList = [source];
  }

  var videostarttime = eval(getUrlParameter('videostarttime'));
  console.log(videostarttime);

	createVideoPlayer(wsUrl, videoContainerId, fileList,videostarttime);
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
