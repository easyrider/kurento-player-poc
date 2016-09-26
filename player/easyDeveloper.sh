#!/bin/sh

currentDir=`pwd`
if ! [ `basename $currentDir` == "player" ]; then
  echo "cd to player dir first"
  exit 1
else
  echo 'soft-link link http server''s file from src/main/resources/static/'
  echo 'that will make change in src/main/resources/static/ directly push to server don''t need restart server'
fi

cd src/main/resources/static/
fileList=`ls`

cd ../../../../


cd target/classes/static/
for i in $fileList; do
  echo $i
  rm -rf $i
done
ln -s ../../../src/main/resources/static/* .

cd ../../../
