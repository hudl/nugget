Instructions

- Make sure the pi is plugged into the 'A' socket (and not 'NA')

- On initial pi boot, do the following things from the boot menu:

  - expand_rootfs
  - enable ssh
  - enable desktop on boot
  - set default locale to en_US
  - make timezone central

- Reboot

- Set up WiFi config

  - SSID: hudl
  - Authentication: WPA2-Enterprise (EAP)
  - Encryption: CCMP
  - EAP: PEAP
  - [auth u/p], use the nugget account

- Pull down this directory into `/home/pi/wallnugget-client`
- Have a look at setup.sh and execute everything in it. It hasn't been tested, so it might have problems if it's executed as a script.
- Update server ip in Chromium 
  - TODO in setup.sh, take the provided server name and add it to the chromium startup command in autostart before copying
- May need to manually add `auto wlan0` to `/etc/network/interfaces`
- Power off and attach IR transmitter
- Add public key from server to ~/.ssh/authorized_keys2 on client
- Add hostname to /etc/hosts for 127.0.0.1

- Projector settings

  - Management > ECO Mode: on
  - Management > Turn Off Mode: Instant Off
  - Audio > Volume to zero (don't mute, it displays an icon)
