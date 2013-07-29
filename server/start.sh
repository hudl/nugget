#!/bin/bash
nohup forever -l forever.log -o server.log -e server.log server.js 2>&1 1>/dev/null &
