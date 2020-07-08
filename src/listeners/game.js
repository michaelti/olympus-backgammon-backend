const plakoto = require("../plakoto.js");
const clone = require("ramda.clone");
const rooms = require("../rooms");

/* GAME EVENT LISTENERS */

module.exports = function (socket, io) {
    // Game event: move
    socket.on("game/move", (from, to) => {
        if (!socket.currentRoom) return;
        if (rooms[socket.currentRoom].players[socket.id] !== rooms[socket.currentRoom].board.turn)
            return;

        if (rooms[socket.currentRoom].board.tryMove(from, to)) {
            rooms[socket.currentRoom].moves.push(plakoto.Move(from, to));
        }

        // Broadcast the board to everyone in the room
        io.sockets
            .in(socket.currentRoom)
            .emit("game/update-board", rooms[socket.currentRoom].board);
    });

    // Game event: apply turn
    socket.on("game/apply-turn", () => {
        if (!socket.currentRoom) return;
        if (rooms[socket.currentRoom].players[socket.id] !== rooms[socket.currentRoom].board.turn)
            return;

        /* Validate the whole turn by passing the array of moves to a method
         * If the turn is valid, end the player's turn
         * Else, return an error and undo the partial turn
         */
        if (rooms[socket.currentRoom].boardBackup.isTurnValid(rooms[socket.currentRoom].moves)) {
            rooms[socket.currentRoom].board.turn = rooms[socket.currentRoom].board.otherPlayer();
            rooms[socket.currentRoom].board.rollDice();
            rooms[socket.currentRoom].boardBackup = clone(rooms[socket.currentRoom].board);
        } else {
            rooms[socket.currentRoom].board = clone(rooms[socket.currentRoom].boardBackup);
        }
        rooms[socket.currentRoom].moves = [];

        // Broadcast the board to everyone in the room
        io.sockets
            .in(socket.currentRoom)
            .emit("game/update-board", rooms[socket.currentRoom].board);
    });

    // Game event: undo
    socket.on("game/undo", () => {
        if (!socket.currentRoom) return;
        if (rooms[socket.currentRoom].players[socket.id] !== rooms[socket.currentRoom].board.turn)
            return;

        rooms[socket.currentRoom].moves = [];
        rooms[socket.currentRoom].board = clone(rooms[socket.currentRoom].boardBackup);

        // Broadcast the board to everyone in the room
        io.sockets
            .in(socket.currentRoom)
            .emit("game/update-board", rooms[socket.currentRoom].board);
    });
};
