const Gun = require('gun');
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8765;

// Create an HTTP server
const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        // Serve the HTML page (if needed)
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
    } else if (req.method === 'POST' && req.url === '/submit-message') {
        // Handle POST requests to save messages
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { userId, gitHubUsername, messageContent, messageId } = JSON.parse(body);
                
                // Validate fields
                if (!userId || !gitHubUsername || !messageContent || !messageId) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Missing required fields' }));
                }

                // Call the function to save the message with the client-sent messageId
                saveMessage(userId, gitHubUsername, messageContent, messageId);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'Message saved successfully' }));
            } catch (err) {
                console.error('Error parsing request body:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
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
    file: 'data', // Enable local file storage
    radisk: true  // Use radisk for persistent storage
});

// Create a 'GuestBook' node in the Gun graph
const guestBook = gun.get('GuestBook');

// Listen for new messages and log them
guestBook.map().on((message, id) => {
    if (message) {
        console.log(`New message from ${message.GitHubUsername} (${message.UserId}): ${message.Message}`);
    } else {
        console.warn(`Received undefined message for ID: ${id}`);
    }
});

// Function to save a message to the 'GuestBook' node with the client-provided messageId
function saveMessage(userId, gitHubUsername, messageContent, messageId) {
    const message = {
        UserId: userId,
        GitHubUsername: gitHubUsername,
        DatePosted: new Date().toISOString(),
        Message: messageContent,
        MessageId: messageId // Use the client-sent messageId
    };

    // Save the message with the provided messageId as the key
    guestBook.get(messageId).put(message, (ack) => {
        if (ack.err) {
            console.error('Error saving message:', ack.err);
        } else {
            console.log(`Message saved: ${JSON.stringify(message)}`);
        }
    });
}

// Function to delete messages after a set delay (e.g., 7 days)
const deleteMessagesAfterDelay = (delay) => {
    setTimeout(() => {
        guestBook.map().once((message, id) => {
            if (message && message.DatePosted) {
                const messageDate = new Date(message.DatePosted).getTime();
                const currentDate = new Date().getTime();

                // If the message is older than 7 days, delete it
                if (currentDate - messageDate >= delay) {
                    guestBook.get(id).put(null, (ack) => {
                        if (ack.err) {
                            console.error(`Error deleting message with ID ${id}:`, ack.err);
                        } else {
                            console.log(`Message with ID ${id} deleted after 7 days.`);
                        }
                    });
                }
            }
        });
    }, delay);
};

// Call the function with 7 days in milliseconds
deleteMessagesAfterDelay(7 * 24 * 60 * 60 * 1000);

// Keep the process running
setInterval(() => {}, 1000);
