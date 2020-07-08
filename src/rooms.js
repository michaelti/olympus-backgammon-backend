const plakoto = require("./plakoto.js");
const clone = require("ramda.clone");
const { Player } = require("./gameUtil");

// Base Room object
const Room = (roomName) => ({
    roomName,
    board: null,
    boardBackup: null,
    moves: null,
    players: null,

    initRoom() {
        // Initialize a game
        this.board = plakoto.Board();
        this.board.initPlakoto();
        this.boardBackup = clone(this.board);
        this.moves = new Array();

        // Initialize a list of players
        this.players = {};
    },

    leaveRoom(socketId) {
        delete this.players[socketId];
    },

    addPlayer(socketId) {
        if (this.players[socketId]) return;

        // Add entry to the players list for this room, if there's space
        if (Object.keys(this.players).length < 2) {
            if (!Object.values(this.players).includes(Player.white)) {
                this.players[socketId] = Player.white;
            } else {
                this.players[socketId] = Player.black;
            }
        }
    },
});

// Global Rooms object
const rooms = {
    createRoom(roomName) {
        this[roomName] = Room(roomName);
        this[roomName].initRoom();
    },
};

module.exports = rooms;
