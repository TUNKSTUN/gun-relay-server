const net = require('net');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const express = require('express');
const Gun = require('gun');
const fs = require('fs');
const path = require('path');

// JSON file to store client data
const CLIENT_DATA_FILE = path.join(__dirname, 'clients.json');

// Array to store connected TCP clients
const clients = [];
// Map to store usernames associated with TCP clients
const userNames = new Map();

// Create an Express application
const app = express();

// Apply CORS middleware
const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions)); // Use CORS middleware

// Create an HTTP server with Express
const httpServer = http.createServer(app);

// Gun.js setup with WebSocket support
const gun = Gun({
    web: httpServer, // Use the HTTP server instance
});

// Simple HTTP endpoint
app.get('/', (req, res) => {
    res.status(200).send('Gun.js World Chat Server is running\n');
});

// Start the HTTP/WebSocket server on the Render provided port or fallback to 3010
const port = process.env.PORT || 3010;
httpServer.listen(port, () => {
    console.log(`HTTP/WebSocket server listening on port ${port}`);
});

// Load clients from JSON file (if it exists)
function loadClientData() {
    if (fs.existsSync(CLIENT_DATA_FILE)) {
        const rawData = fs.readFileSync(CLIENT_DATA_FILE);
        return JSON.parse(rawData);
    }
    return {};
}

// Save client data to JSON file
function saveClientData(data) {
    fs.writeFileSync(CLIENT_DATA_FILE, JSON.stringify(data, null, 2));
}

// Delete JSON file after 7 days
function deleteClientDataFile() {
    if (fs.existsSync(CLIENT_DATA_FILE)) {
        fs.unlinkSync(CLIENT_DATA_FILE);
        console.log('Client data file deleted after 7 days.');
    }
}

// Schedule JSON file deletion after 7 days
setInterval(deleteClientDataFile, 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds

// Create a TCP server for handling chat clients
function startTcpServer(tcpPort) {
    const clientData = loadClientData(); // Load existing client data

    const tcpServer = net.createServer((client) => {
        clients.push(client);
        console.log('New TCP client connected');

        client.on('data', (data) => {
            const message = data.toString().trim();

            if (!userNames.has(client)) {
                if (message.startsWith('--username ')) {
                    const username = message.split(' ')[1];
                    if ([...userNames.values()].includes(username)) {
                        client.write(`Username "${username}" is already taken. Please choose a different username.\n`);
                    } else {
                        userNames.set(client, username);

                        // Generate a userId (for demo purposes, using a timestamp)
                        const userId = Date.now();

                        // Store the client info in the JSON file
                        clientData[userId] = { username, userId, connectedAt: new Date().toISOString() };
                        saveClientData(clientData);

                        // Log the username on the server console
                        console.log(`User connected: ${username} (ID: ${userId})`);

                        client.write(`Welcome, ${username}! Type your messages below:\n`);
                    }
                } else {
                    client.write('Please set your username first using "--username YourName"\n');
                }
                return;
            }

            const username = userNames.get(client);
            console.log(`Received from ${username}: ${message}`);

            gun.get('messages').set({ username, message, time: Date.now() });

            clients.forEach((c) => {
                if (c !== client) {
                    c.write(`${username}: ${message}\n`);
                }
            });
        });

        client.on('end', () => {
            const username = userNames.get(client);
            console.log(`TCP client disconnected: ${username}`);
            clients.splice(clients.indexOf(client), 1);
            userNames.delete(client);
        });

        client.on('error', (err) => {
            console.error(`Client error: ${err.message}`);
        });
    });

    tcpServer.listen(tcpPort, () => {
        console.log(`TCP server listening on port ${tcpPort}`);
    });
}

// Get a random free port and start the TCP server
getRandomFreePort(startTcpServer);

// WebSocket server that uses the HTTP server for connections
const wss = new WebSocket.Server({ server: httpServer });

// Handle new WebSocket client connections
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

// Function to find a random free port
function getRandomFreePort(callback) {
    const server = net.createServer();
    server.listen(0, () => {
        const port = server.address().port;
        server.close(() => callback(port));
    });
}
