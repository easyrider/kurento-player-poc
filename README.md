# kurento-player-poc


## build kurento docker

`docker build -t kurento-docker-dev docker/.`

## start kurento docker

`docker run --name kms -p 8888:8888 -e GST_DEBUG=Kurento\*:5 --rm -it kurento-docker-dev`

## start command

1. `cd player`
2. `mvn compile exec:java -Dkms.url=ws://localhost:8888/kurento`


## 需求
1. Kurento Media Server編碼伺服器（透過docker啟動）
2. Java EE App Server（透過mvn啟動）
3. 播放影片的網頁（目前在`src/main/resources/static/`已經有範本）

### 網頁需求：
網頁部份，必須要載入`bower_components/jquery/dist/jquery.min.js`、`bower_components/adapter.js/adapter.js`、`js/kurento-utils.js`、`js/player.js`，`bower_compnents`會在mvn啟動時，會從bower下載套件並複製到伺服器根目錄`target/classes/static/`，`js/`的檔案也會複製過去，而`kurento-utils.js`則是由`Java EE`提供，http上要求會拿到，但是不會複製進去伺服器目錄。
```
<script src="bower_components/jquery/dist/jquery.min.js"></script>
<script src="bower_components/adapter.js/adapter.js"></script>
<script src="js/kurento-utils.js"></script>
<script src="js/player.js"></script>
```

載入上述元件後，網頁須有Video Container放置影片播放器，Video Container內必須有兩個`<video>`標籤作為無縫播放使用，以及各樣控制項目，範例如下：
```
	<div id="my-video-container" class="video-container">
		<video class="video primary" autoplay width="640px" height="480px"
			poster="img/webrtc.png" preload="auto"></video>
		<video class="video slave" autoplay width="640px" height="480px"
			poster="img/webrtc.png" preload="auto" style="display: none"></video>

		<div class="video-controls">
			<button type="button" class="play play-pause">Play</button>
			<input type="range" class="seek-bar" value="0">
			<button type="button" class="text live">LIVE</button>
			<button type="button" class="text">Volume</button>
			<input type="range" class="volume-bar" min="0" max="1" step="0.1" value="1">
      <div class="hr"></div>
			<button type="button" class="full-screen">Full-Screen</button>
			<button class="screenshot-button">Screenshot</button>
      <button class="zoomin">+</button>
      <button class="zoomout">-</button>
      <button class="close left">⇠</button>
      <button class="close right">⇢</button>
      <button class="close up">⇡</button>
      <button class="close down">⇣</button>
      <!--TODO: why does Opera not display the rotation buttons? -->
      <button class="close rotateleft">&#x21bb;</button>
      <button class="close rotateright">&#x21ba;</button>
      <button class="close reset">reset</button>
		</div>
	</div>
```

這份播放器的css在`css/style.css`中，如有需要可以透過下面的程式碼引用：
`<link rel="stylesheet" href="css/style.css">`

引用並準備好容器後，透過以下語法即可初始化播放器：
```
	var wsUrl = 'wss://' + location.host + '/player';
	var fileList = [
		'http://jenkins.trunk.studio/videotest/video1.mkv',
		'http://jenkins.trunk.studio/videotest/video2.mkv',
		'http://jenkins.trunk.studio/videotest/video3.mkv'
	]
	createVideoPlayer(wsUrl, 'my-video-container', fileList);
```

`fileList`為播放清單，清單內容可以是http影片檔案、rtmp串流或是其他Kurento Media Server支援的通訊協定。

如果要是用截圖功能，你會需要再建立一個id為`image`的`img`標籤來放擷取下來的圖片，像是下面的範例：
`<img id="image" style="clear:both;display:none;">`


