## build kurento docker

`docker build -t kurento-docker-dev docker/.`

## start kurento docker

`docker run --name kms -p 8888:8888 -e GST_DEBUG=Kurento\*:5 --rm -it kurento-docker-dev`

## start command

1. `cd player`
2. `mvn compile exec:java -Dkms.url=ws://localhost:8888/kurento`
