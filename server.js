const express = require('express');
const Gun = require('gun');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files (if needed for front-end)
app.use(express.static('public'));

// Initialize a Gun instance with Express
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Attach Gun to the Express server
const gun = Gun({ web: server });

// This will print whenever a new peer connects to the Gun relay
gun.on('hi', peer => {
  console.log('A new peer joined:', peer);
});

// This will print when a peer disconnects
gun.on('bye', peer => {
  console.log('A peer left:', peer);
});

