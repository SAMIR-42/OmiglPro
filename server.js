const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const waitingUsers = new Map();
const matchedUsers = new Map();
const port = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/chat', (request, response) => {
    response.sendFile(path.join(__dirname, 'pages', 'chat.html'));
});

const publicProfile = (profile) => ({
    name: profile.name,
    gender: profile.gender,
    country: profile.country
});

const removeFromWaiting = (socketId) => {
    waitingUsers.delete(socketId);
};

const releaseMatch = (socketId, shouldRequeue = false) => {
    const partnerId = matchedUsers.get(socketId);
    matchedUsers.delete(socketId);

    if (partnerId) {
        matchedUsers.delete(partnerId);
        const partner = io.sockets.sockets.get(partnerId);
        if (partner) {
            partner.emit('partner-left');
            if (shouldRequeue && partner.data.profile) {
                waitingUsers.set(partnerId, partner.data.profile);
                partner.emit('waiting');
            }
        }
    }
};

const matchWaitingUsers = () => {
    while (waitingUsers.size >= 2) {
        const waiting = Array.from(waitingUsers.entries());
        const firstIndex = Math.floor(Math.random() * waiting.length);
        let secondIndex = Math.floor(Math.random() * (waiting.length - 1));
        if (secondIndex >= firstIndex) {
            secondIndex += 1;
        }

        const [firstId, firstProfile] = waiting[firstIndex];
        const [secondId, secondProfile] = waiting[secondIndex];
        const firstSocket = io.sockets.sockets.get(firstId);
        const secondSocket = io.sockets.sockets.get(secondId);

        waitingUsers.delete(firstId);
        waitingUsers.delete(secondId);

        if (!firstSocket || !secondSocket) {
            if (firstSocket) waitingUsers.set(firstId, firstProfile);
            if (secondSocket) waitingUsers.set(secondId, secondProfile);
            continue;
        }

        matchedUsers.set(firstId, secondId);
        matchedUsers.set(secondId, firstId);
        firstSocket.emit('matched', publicProfile(secondProfile));
        secondSocket.emit('matched', publicProfile(firstProfile));
    }
};

io.on('connection', (socket) => {
    socket.on('join-pool', (profile) => {
        if (!profile || typeof profile.name !== 'string' || typeof profile.gender !== 'string' || typeof profile.country !== 'string') {
            socket.emit('server-error', 'A valid profile is required.');
            return;
        }

        releaseMatch(socket.id);
        removeFromWaiting(socket.id);
        socket.data.profile = {
            name: profile.name.trim().slice(0, 40),
            gender: profile.gender,
            country: profile.country
        };
        waitingUsers.set(socket.id, socket.data.profile);
        socket.emit('waiting');
        matchWaitingUsers();
    });

    socket.on('message', (message) => {
        const partnerId = matchedUsers.get(socket.id);
        const partner = partnerId ? io.sockets.sockets.get(partnerId) : null;
        if (!partner || typeof message !== 'string' || !message.trim()) {
            return;
        }
        partner.emit('message', {
            text: message.trim().slice(0, 1000),
            sender: socket.data.profile ? socket.data.profile.name : 'User'
        });
    });

    socket.on('typing', () => {
        console.log('Typing event received from:', socket.id); // TEMP DEBUG
        const partnerId = matchedUsers.get(socket.id);
        const partner = partnerId ? io.sockets.sockets.get(partnerId) : null;
        if (partner && socket.data.profile && (socket.data.profile.gender === 'male' || socket.data.profile.gender === 'female')) {
            partner.emit('typing', { gender: socket.data.profile?.gender });
        }
    });

    socket.on('stop-typing', () => {
        const partnerId = matchedUsers.get(socket.id);
        const partner = partnerId ? io.sockets.sockets.get(partnerId) : null;
        if (partner) {
            partner.emit('stop-typing');
        }
    });

    socket.on('next', () => {
        releaseMatch(socket.id, true);
        waitingUsers.set(socket.id, socket.data.profile);
        socket.emit('waiting');
        matchWaitingUsers();
    });

    socket.on('disconnect', () => {
        removeFromWaiting(socket.id);
        releaseMatch(socket.id, true);
    });
});

server.listen(port, () => {
    console.log(`OmiglPro server listening on http://localhost:${port}`);
});
