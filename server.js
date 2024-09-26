const Gun = require('gun');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8765;
const server = http.createServer().listen(port, '0.0.0.0');

const gun = Gun({
  web: server,
  file: 'data',
  radisk: true
});

console.log(`GunJS relay peer started on port ${port}`);

// Create a 'GuestBook' node in the Gun graph
const guestBook = gun.get('GuestBook');

// Listen for new messages and broadcast them
guestBook.map().on(function(message, id) {
  console.log(`New message: ${JSON.stringify(message)}`);
});

// Optional: Add any custom event handlers or logic here
gun.on('hi', peer => {
  console.log(`New peer connection: ${peer}`);
});

// Function to delete messages after 7 days
const deleteMessagesAfterDelay = (delay) => {
  setTimeout(() => {
    guestBook.put(null); // Deletes all messages under the 'GuestBook' node
    console.log('All messages deleted after 7 days.');
  }, delay);
};

// Call the function with 7 days in milliseconds
deleteMessagesAfterDelay(7 * 24 * 60 * 60 * 1000);

// Serve the HTML file
server.on('request', (req, res) => {
  if (req.url === '/') {
    // Serve the HTML page
    fs.readFile(path.join(__dirname, 'server.html'), 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    // Handle other requests (e.g., Gun.js WebSocket connections)
    gun.wsp(req, res);
  }
});

// Keep the process running
setInterval(() => {}, 1000);
