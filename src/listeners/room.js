const { randomAlphanumeric } = require("../util.js");
const { State, Room } = require("../roomObj");
const { Variant } = require("../gameUtil");

/* ROOM EVENT LISTENERS */

module.exports = function (socket, io, rooms = io.sockets.adapter.rooms) {
    // Room event: start room
    socket.on("event/start-room", (acknowledge) => {
        // Generate a random room name string
        const roomName = randomAlphanumeric(6);

        // Leave previous room if already in one that's not this one
        if (socket.currentRoom && socket.currentRoom !== roomName) {
            rooms[socket.currentRoom].removePlayer(socket.id);
            socket.leave(socket.currentRoom);
        }

        socket.join(roomName, () => {
            // 1. Set the current room reference on this socket
            // 2. Initialize the room object
            // 3. Send an acknowledegment with room name back to the client
            socket.currentRoom = roomName;
            Object.assign(rooms[roomName], Room()).initRoom();
            acknowledge({ ok: true, roomName });
        });
    });

    // Room event: join room
    socket.on("event/join-room", (roomName, acknowledge) => {
        // Check if the room exists
        if (!rooms[roomName]) return acknowledge({ ok: false, roomName });

        // Leave previous room if already in one that's not this one
        if (socket.currentRoom && socket.currentRoom !== roomName) {
            rooms[socket.currentRoom].removePlayer(socket.id);
            socket.leave(socket.currentRoom);
        }

        socket.join(roomName, () => {
            // 1. Set the current room reference on this socket
            // 2. Add this player to the room object
            // 3. Send an acknowledgement with room name back and player enum to the client
            socket.currentRoom = roomName;
            rooms[socket.currentRoom].addPlayer(socket.id);
            acknowledge({
                ok: true,
                roomName,
                player: rooms[socket.currentRoom].players[socket.id],
            });

            // Broadcast the board to everyone in the room
            io.sockets
                .in(socket.currentRoom)
                .emit("game/update-board", rooms[socket.currentRoom].board);
        });
    });

    // Room event: select variant
    socket.on("room/select-variant", (variant, acknowledge) => {
        if (!socket.currentRoom) return;
        if (rooms[socket.currentRoom].state !== State.setup) return;
        if (!Object.values(Variant).includes(variant)) return;

        rooms[socket.currentRoom].startGame(variant);
        acknowledge({ ok: true });

        // Broadcast the board to everyone in the room
        io.sockets
            .in(socket.currentRoom)
            .emit("game/update-board", rooms[socket.currentRoom].board);
    });
};
