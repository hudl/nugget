What's a nugget?
---

It's a simple dashboard. It's meant as an information radiator, and not intended for use as a decision-making tool.

Here's an example - Hudl's concurrent user count:

![Current Users](http://i.imgur.com/NEIJCSS.png "Concurrent Users")

The number moves up and down in real time.

You can put one up on a spare monitor or a TV, but for maximum #mindblown, you should project it onto a surface:

![Current Users projected onto a floor](http://i.imgur.com/vwylvFn.jpg "Concurrent Users")

How do I make one?
---

1. Fork this repository
2. Create a datasource and a display
3. (optional) Get a projector

Still interested? Continue on for more detail.

Project Structure
---

The system is just a simple client-server architecture, with a node.js/socket.io server retrieving and curating data, and a browser/socket.io client subscribing to data events fired by the server.

![Architecture](http://i.imgur.com/h1RoOJC.png "Architecture")

Terminology
---

- **Stat** - A (javascript object) message containing a small piece of data to be displayed.
- **Datasource** - A node.js module on the server that grabs data from one or more external sources, builds them into a stat, and emits that stat.
- **Display** - A require.js module in a browser client that consumes stats and renders them.

Datasource
---

Datasource modules go in [`server/user/datasource`](https://github.com/hudl/nugget/tree/master/server/user/datasources).

See a simple, documented [Current System Time datasource example](https://github.com/hudl/nugget/blob/master/server/user/datasources/current-time.js).

Display
---

Display JavaScript, HTML, and CSS goes in [`server/user/displays`](https://github.com/hudl/nugget/tree/master/server/user/displays).

For each display you should define exactly one file with the same name. For a display called `current-time`, you'll create:

- [`server/user/displays/current-time.js`](https://github.com/hudl/nugget/blob/master/server/user/displays/current-time.js)
- `server/user/displays/current-time.css`(https://github.com/hudl/nugget/blob/master/server/user/displays/current-time.css)
- `server/user/displays/current-time.html`(https://github.com/hudl/nugget/blob/master/server/user/displays/current-time.html)

Each of the links above is to an example that works with the `system-time` datasource (above).
