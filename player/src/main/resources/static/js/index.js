window.onload = function() {
	var wsUrl = 'wss://' + location.host + '/player';
	var videoContainerId = "video-container-1";
	var fileList = [
		'http://jenkins.trunk.studio/videotest/video1.mkv',
		'http://jenkins.trunk.studio/videotest/video2.mkv'
	]
	createVideoPlayer(wsUrl, videoContainerId, fileList);

	videoContainerId = 'video-2';
	fileList = [
		'http://jenkins.trunk.studio/videotest/video3.mkv'
	]
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
