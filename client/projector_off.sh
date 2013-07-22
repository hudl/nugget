#!/bin/bash

# Ensures the projector is off by first (potentially) turning it on, and then
# turning it off.

# This may turn it on, but at least we know what state it's in now.
irsend SEND_ONCE acer KEY_POWER

# Give it time to warm up if it wasn't on.
sleep 60

# Now send the two power signals to turn it off.
irsend SEND_ONCE acer KEY_POWER
sleep 1
irsend SEND_ONCE acer KEY_POWER