#!/bin/bash

# See setup-instructions.md for manual steps to run first.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ $# -ne 2 ]; then
	echo "Usage: setup.sh HOSTNAME SERVER"
	exit 1
fi

sudo apt-get update
sudo apt-get install chromium lirc unclutter x11-xserver-utils

sudo cp $DIR/conf/modules /etc/modules
sudo cp $DIR/conf/hardware.conf /etc/lirc/hardware.conf
sudo cp $DIR/conf/lircd.conf /etc/lirc/lircd.conf

sudo update-rc.d ssh defaults

mkdir -p /home/pi/.config/lxsession/LXDE
cp $DIR/conf/autostart /home/pi/.config/lxsession/LXDE/autostart

sudo bash -c 'echo "$1" > /etc/hostname'

sudo bash -c 'echo "0/5 * * * * /home/pi/wallnugget-client/pingreboot.sh $2 >> /var/log/pingreboot.log" > /etc/cron.d/pingreboot'

# Possibly adjust the times on these per nugget.
# support: 700a-700p weekdays
# entryway: 730a-530p weekdays
sudo bash -c 'echo "0 7 * * 1-5 /home/pi/wallnugget-client/projector_on.sh"' > /etc/cron.d/nugget-on
sudo bash -c 'echo "0 19 * * 1-5 /home/pi/wallnugget-client/projector_off.sh"' > /etc/cron.d/nugget-off

# reboot
