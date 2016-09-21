FROM kurento/kurento-media-server:6.5.0

RUN	apt-get update \
  && apt-get -y install gstreamer1.5-plugins-good \
  && apt-get -y install openh264-gst-plugins-bad-1.5 \
	&& apt-get clean \
  && rm -rf /var/lib/apt/lists/*

EXPOSE 8888
COPY ./entrypoint.sh /entrypoint.sh
ENV GST_DEBUG=Kurento*:5
ENTRYPOINT ["/entrypoint.sh"]
