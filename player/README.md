# kurento-player-poc/Player

## easy develop

due to java server will copy file to http server root, change file in player/src/main/resources/static/ have to restart server 

use `easyDeveloper.sh` script will delete file in server root and make soft-link

1. `cd player`
2. `./easyDeveloper.sh`

## or more simply

that will do all above (require tmux)

`./env.sh`

