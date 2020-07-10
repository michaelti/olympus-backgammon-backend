/* GAME EVENT LISTENERS */

module.exports = function (socket, io, rooms = io.sockets.adapter.rooms) {
    // Game event: move
    socket.on("game/move", (from, to) => {
        if (!socket.currentRoom) return;
        if (!rooms[socket.currentRoom].isPlayerTurn(socket.id)) return;

        rooms[socket.currentRoom].gameMove(from, to);

        // Broadcast the board to everyone in the room
        io.sockets
            .in(socket.currentRoom)
            .emit("game/update-board", rooms[socket.currentRoom].board);
    });

    // Game event: apply turn
    socket.on("game/apply-turn", () => {
        if (!socket.currentRoom) return;
        if (!rooms[socket.currentRoom].isPlayerTurn(socket.id)) return;

        let winner = rooms[socket.currentRoom].gameApplyTurn();

        // Broadcast the board to everyone in the room
        io.sockets
            .in(socket.currentRoom)
            .emit("game/update-board", rooms[socket.currentRoom].board);

        if (winner) {
            console.log("Player " + winner + " is the winner");
            io.sockets.in(socket.currentRoom).emit("game/win", winner);
        }
    });

    // Game event: undo
    socket.on("game/undo", () => {
        if (!socket.currentRoom) return;
        if (!rooms[socket.currentRoom].isPlayerTurn(socket.id)) return;

        rooms[socket.currentRoom].gameUndoTurn();

        // Broadcast the board to everyone in the room
        io.sockets
            .in(socket.currentRoom)
            .emit("game/update-board", rooms[socket.currentRoom].board);
    });
};
