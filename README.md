*Client/server framework for building awesome projector dashboards.*

Architecture
=====

[TODO Image]

Terms
=====

So that we're on the same page, here are a few quick definitions that you'll see in guides and the code.

**Server**

The node.js host that all of the clients connect to. It's responsible for pulling in data and serving up stats. This is where you'll be implementing your own datasources and displays.

**Client**

A browser that's connected to the **server** and displaying stats. Could be your local browser, or Chromium running on a Raspberry Pi.

**Dashboard**

A control panel of sorts (hosted by the server) that shows active clients and provides the ability to control them. Available at `http://server:42420/dashboard`.

[TODO Screnshot]

**Display**

The page that actually gets shown by a **client** - what users see. "Display" is synonymous with "Nugget" - you might define a "Current Users" nugget (i.e. display) and a "Latest Tweet" nugget and show them in different locations.

Displays are just a page in a browser, which means you write them like you'd build any other web page. The entire world of JavaScript, CSS, and everything else is at your disposal.

A display can be built from several different **datasources**.

[TODO Example]

Datasource

On the **server**, a bit of code that grabs data, usually from a remote location, and turns it into something consumable by a **display**.

A datasource might connect to a streaming API, or might poll and scrape a page somewhere.

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
- `node server`

Creating a new datasource
-----

TODO

Creating a new display
-----

TODO

The Clients
=====

TODO
