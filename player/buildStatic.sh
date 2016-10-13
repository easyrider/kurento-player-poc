#!/bin/sh
OUTPUT_FOLDER="statics"
NAME="Kurento"
VERSION="1.0"
DESCRIPTION="Kurento WebPlayer"



if test -d "$OUTPUT_FOLDER"; then
  echo "old build exist, delete"
  rm -rf $OUTPUT_FOLDER
fi

mkdir $OUTPUT_FOLDER
cp bower.json $OUTPUT_FOLDER

sed -i 's/${project.artifactId}'"/$NAME/g" $OUTPUT_FOLDER/bower.json
sed -i 's/${project.version}'"/$VERSION/g" $OUTPUT_FOLDER/bower.json
sed -i 's/${project.description}'"/$DESCRIPTION/g" $OUTPUT_FOLDER/bower.json

cp -a src/main/resources/static/* $OUTPUT_FOLDER/
cd $OUTPUT_FOLDER 
bower install

mv static/* .
rmdir static
