## build kurento docker

`docker build -t kurento-docker-dev docker/.`

## start kurento docker

`docker run --name kms -p 8888:8888 -e GST_DEBUG=Kurento\*:5 --rm -it kurento-docker-dev`

## start command

1. `cd player`
2. `mvn compile exec:java -Dkms.url=ws://localhost:8888/kurento`

## easy develop

due to java server will copy file to http server root, change file in player/src/main/resources/static/ have to restart server 

use `easyDeveloper.sh` script will delete file in server root and make soft-link

1. `cd player`
2. `./easyDeveloper.sh`

## or more simply

that will do all above (require tmux)

`./env.sh`
