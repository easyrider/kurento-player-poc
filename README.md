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

另外，以上指令可以透過 `./env.sh` 全部完成（環境需要有 `tmux` 指令）

## 使用方式
iframe版本寬度高度均改為100%，Server起來後直接 `iframe` 伺服器網址 `http://localhost:8123/` 後面透過 `URL` 參數帶入網址，像是這樣： `<iframe src=http://localhost:8123/?URL=rtsp://localhost/stream"></iframe>` ，即可引入播放器。

如果需要引入多個來源，可以使用JavaScript陣列作為來源，像是`["http://example.com/movie-01.mp4","http://example.com/movie-02.mp4"]`
