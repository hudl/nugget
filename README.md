Architecture
=====

[TODO Image]

Terms
=====

So that we're on the same page, here are a few quick definitions that you'll see in guides and the code.

**Server**

The node.js host that clients connect to. Responsible for aggregating data and pushing stats to clients. This is where you'll be implementing your own datasources and displays.

**Client**

A browser that's connected to the server and displaying stats. Could be your local browser, or Chromium running on a Raspberry Pi.

**Display**

The page that actually gets shown by a client - what users see. "Display" is synonymous with "Nugget" - you might define a "Current Users" nugget (i.e. display) and a "Latest Tweet" nugget and show them in different locations.

Displays are just a page in a browser, which means you write them like you'd build any other web page. The entire world of JavaScript, CSS, and everything else is at your disposal.

A display can be built from several different datasources.

[TODO Example]

**Datasource**

On the server, a bit of code that grabs data, usually from a remote location, and turns it into something consumable by a display.

A datasource might connect to a streaming API, or might poll and scrape a page somewhere.

**Stat**

A message containing some data for a display. Stats are published/emitted by datasources.

**Dashboard**

Although this whole project works with "dashboards", in our context it just refers to a control panel of sorts (hosted by the server) that shows active clients and provides the ability to control them. Available at `http://server:42420/dashboard`.

[TODO Screenshot]

The Server
=====

Getting set up
-----

TODO

Crude install steps

- fork this repo
- clone it on your server
- `cd nugget/server`
- `npm install`
- `npm install -g forever`
- `./start.sh`

Creating a new datasource
-----

TODO

Creating a new display
-----

TODO

The Clients
=====

TODO
