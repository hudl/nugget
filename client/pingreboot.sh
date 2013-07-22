#!/bin/bash

RESULT=`ping -c 1 -W 5 $1`
STATUS=$?

if [ "$STATUS" -ne "0" ]; then
	TIME=`date -R`
	echo "${TIME} Rebooting"
	killall chromium
	sudo reboot
fi
