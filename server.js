const Gun = require('gun');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8765;

// Create an HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        // Serve the HTML page
        fs.readFile(path.join(__dirname, 'server.html'), 'utf8', (err, data) => {
            if (err) {
                console.error('Error loading index.html:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        // Handle other requests
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

// Start the HTTP server
server.listen(port, '0.0.0.0', () => {
    console.log(`GunJS relay peer started on port ${port}`);
});

// Initialize Gun with the server
const gun = Gun({
    web: server,
    file: 'data', // Enable file storage
    radisk: true // Use radisk for in-memory storage
});

// Create a 'GuestBook' node in the Gun graph
const guestBook = gun.get('GuestBook');

// Listen for new messages and broadcast them
guestBook.map().on((message, id) => {
    if (message) {
        console.log(`New message: ${JSON.stringify(message)}`);
    } else {
        console.warn(`Received undefined message for ID: ${id}`);
    }
});

// Function to delete messages after 7 days
const deleteMessagesAfterDelay = (delay) => {
    setTimeout(() => {
        guestBook.put(null) // Deletes all messages under the 'GuestBook' node
            .then(() => {
                console.log('All messages deleted after 7 days.');
            })
            .catch(err => {
                console.error('Error deleting messages:', err);
            });
    }, delay);
};

// Call the function with 7 days in milliseconds
deleteMessagesAfterDelay(7 * 24 * 60 * 60 * 1000);

// Keep the process running
setInterval(() => {}, 1000);
