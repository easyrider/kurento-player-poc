# kurento-player-poc/Player
kurento-player-poc/Player是一款基於Kurento框架的WebRTC影片播放程式，可以解決純HTML5 Video播放器的以下限制：
* 無法支援RTMP或其他通訊協定的串流
* 影片播放格式受瀏覽器限制（請參考Kurento文件）

## 已知問題
請見[issue頁面](https://github.com/trunk-studio/kurento-player-poc/issues)

## 使用方式
iframe版本寬度高度均改為100%，Server起來後直接 `iframe` 伺服器網址 `http://localhost:8123/` 後面透過 `URL` 參數帶入網址，像是這樣： `<iframe src=http://localhost:8123/?URL=rtsp://localhost/stream"></iframe>` ，即可引入播放器。
