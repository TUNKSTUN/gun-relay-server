const Gun = require('gun');

const port = process.env.PORT || 8765;

const server = require('http').createServer().listen(port, '0.0.0.0');

const gun = Gun({
  web: server,
  file: 'data',
  radisk: true
});

console.log(`GunJS relay peer started on port ${port}`);

// Create a 'messages' node in the Gun graph
const messages = gun.get('messages');

// Listen for new messages and broadcast them
messages.map().on(function(message, id) {
  console.log(`New message: ${JSON.stringify(message)}`);
  // The .on() method automatically broadcasts to all peers
});

// Optional: Add any custom event handlers or logic here
gun.on('hi', peer => {
  console.log(`New peer connection: ${peer}`);
});

// Keep the process running
setInterval(() => {}, 1000);