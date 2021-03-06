#!/bin/sh

sudo systemctl start docker

docker rm kms

tmux new -d -s EncServer 'docker run --name kms -p 8888:8888 -e GST_DEBUG=Kurento\*:5 --rm -it kurento-docker-dev'

cd player
tmux new -d -s WebServer 'mvn compile exec:java -Dkms.url=ws://localhost:8888/kurento'

./easyDeveloper.sh


if [ `uname` == "Linux" ]; then
  echo 'opening browser'
  xdg-open 'https://localhost:8443/'
elif [ `uanme` == "Darwin" ]; then
  echo 'opening browser'
  open 'https://localhost:8443/'
else
  echo 'unknow Operating System, please maunally open https://localhost:8443/ '
fi

