#!/bin/sh

sudo systemctl start docker

docker rm kms

tmux new -d -s EncServer 'docker run --name kms -p 8888:8888 -e GST_DEBUG=Kurento\*:5 --rm -it kurento-docker-dev'

cd player
tmux new -d -s WebServer 'mvn compile exec:java -Dkms.url=ws://localhost:8888/kurento'

./easyDeveloper.sh

URL='http://localhost:8123/'

OS=`uname`
if [ $OS == "Linux" ]; then
  echo 'opening browser'
  xdg-open "$URL"
elif [ $OS == "Darwin" ]; then
  echo 'opening browser'
  open "$URL"
else
  echo 'unknow Operating System, please maunally open '"$URL"
fi

