#!/bin/sh
OUTPUT_FOLDER="statics"
NAME="Kurento"
VERSION="1.0"
DESCRIPTION="Kurento WebPlayer"

if [ `uname` == 'Darwin' ]; then
	if which gsed > /dev/null 2> /dev/null ; then
	   	echo 'gsed installed' 
	else
	   	echo 'gsed not install, sed in mac have problem, run brew install gnu-sed slove'
		exit 0
	fi
	SED_CMD='gsed'
else
	SED_CMD='sed'
fi

if test -d "$OUTPUT_FOLDER"; then
  echo "old build exist, delete"
  rm -rf $OUTPUT_FOLDER
fi

mkdir $OUTPUT_FOLDER
cp bower.json $OUTPUT_FOLDER

$SED_CMD -i 's/\${project.artifactId}'"/$NAME/g" $OUTPUT_FOLDER/bower.json
$SED_CMD -i 's/\${project.version}'"/$VERSION/g" $OUTPUT_FOLDER/bower.json
$SED_CMD -i 's/\${project.description}'"/$DESCRIPTION/g" $OUTPUT_FOLDER/bower.json

cp -a src/main/resources/static/* $OUTPUT_FOLDER/
cd $OUTPUT_FOLDER 
bower install

mv static/* .
rmdir static
