const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const express = require('express');
const Gun = require('gun');
const path = require('path');

// Create an Express application
const app = express();

// Apply CORS middleware
const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions)); // Use CORS middleware

// Serve the server.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'server.html')); // Adjust the path if needed
});

// Create an HTTP server with Express
const httpServer = http.createServer(app);

// Gun.js setup with WebSocket support
const gun = Gun({
    web: httpServer, // Use the HTTP server instance
});

// Start the HTTP/WebSocket server on the Render provided port or fallback to 3010
const port = process.env.PORT || 3010;
httpServer.listen(port, () => {
    console.log(`HTTP/WebSocket server listening on port ${port}`);
});

// WebSocket server that uses the HTTP server for connections
const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    gun.get('messages').on((data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });

    ws.on('message', (message) => {
        console.log(`Received WebSocket message: ${message}`);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error: ${error.message}`);
    });
});

// Optional: Gun.js peer server
const gunPeerPort = 8765;
const gunServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Gun.js Peer Server is running\n');
});

gunServer.listen(gunPeerPort, () => {
    console.log(`Gun.js peer server listening on port ${gunPeerPort}`);
});
