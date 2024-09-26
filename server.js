// const WebSocket = require('ws');
// const http = require('http');
// const cors = require('cors');
// const express = require('express');
// const Gun = require('gun');
// const path = require('path');

// // Create an Express application
// const app = express();

// // Apply CORS middleware
// const corsOptions = {
//     origin: '*', // Allow all origins
//     methods: ['GET', 'POST', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// };
// app.use(cors(corsOptions)); // Use CORS middleware

// // Serve the server.html file
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'server.html')); // Adjust the path if needed
// });

// // Create an HTTP server with Express
// const httpServer = http.createServer(app);

// // Gun.js setup with WebSocket support
// const gun = Gun({
//     web: httpServer, // Use the same HTTP server instance for Gun.js
// });

// // Start the HTTP/WebSocket server on the Render provided port or fallback to 3010
// const port = process.env.PORT || 3010;
// httpServer.listen(port, () => {
//     console.log(`HTTP/WebSocket server listening on port ${port}`);
// });

// // WebSocket server that uses the HTTP server for connections
// const wss = new WebSocket.Server({ server: httpServer });

// wss.on('connection', (ws) => {
//     console.log('New WebSocket client connected');

//     // Notify the client about connection
//     ws.send(JSON.stringify({ message: 'You are connected!' }));

//     gun.get('messages').on((data) => {
//         if (ws.readyState === WebSocket.OPEN) {
//             ws.send(JSON.stringify(data));
//         }
//     });

//     ws.on('message', (message) => {
//         console.log(`Received WebSocket message: ${message}`);
//         wss.clients.forEach((client) => {
//             if (client.readyState === WebSocket.OPEN) {
//                 client.send(message);
//             }
//         });
//     });

//     ws.on('close', () => {
//         console.log('WebSocket client disconnected');
//     });

//     ws.on('error', (error) => {
//         console.error(`WebSocket error: ${error.message}`);
//     });
// });

// // Optional: Serve Gun.js peer server on the same HTTP server
// // You can remove the separate Gun.js peer server code since it's now handled by the Gun instance above.

// console.log(`Gun.js peer server running on the same port ${port}`);


const WebSocket = require('ws')
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT })
wss.on('connection', ws => {
  ws.on('message', message => {
    console.log(`Received message => ${message}`)
  })
  ws.send('Hello! Message From Server!!')
})