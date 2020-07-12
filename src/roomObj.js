const clone = require("ramda.clone");
const plakoto = require("./plakoto");
const { Player, Variant, Move, rollDie } = require("./gameUtil");

const State = Object.freeze({
    undefined: 0,
    setup: 1,
    startingRoll: 2,
    game: 3,
});

// Base Room object
exports.Room = () => ({
    board: null,
    boardBackup: null,
    moves: null,
    players: {},
    startingRolls: { white: null, black: null },
    state: State.setup,

    startGame(type) {
        // Initialize a game
        if (type === Variant.plakoto) this.board = plakoto.Board();
        else console.error("Only plakoto is currently available");
        this.board.initGame();
        this.state = State.startingRoll;
        this.moves = new Array();
    },

    roll(id) {
        switch (this.players[id]) {
            case Player.white:
                if (this.startingRolls.white === null) this.startingRolls.white = rollDie();
                break;
            case Player.black:
                if (this.startingRolls.black === null) this.startingRolls.black = rollDie();
                break;
            default:
                return;
        }
        // If both players have rolled
        if (this.startingRolls.white !== null && this.startingRolls.black !== null) {
            // If those rolls are not the same
            if (this.startingRolls.white !== this.startingRolls.black) {
                this.state = State.game;
                this.board.rollDice();
                this.board.turn =
                    this.startingRolls.black > this.startingRolls.white
                        ? Player.black
                        : Player.white;
                this.boardBackup = clone(this.board);
            }
        }
    },

    rollCleanup() {
        if (this.startingRolls.white === this.startingRolls.black) {
            this.startingRolls.white = null;
            this.startingRolls.black = null;
        }
    },

    addPlayer(id) {
        if (this.players[id]) return;

        // Add entry to the players list for this room, if there's space
        if (Object.keys(this.players).length < 2) {
            if (!Object.values(this.players).includes(Player.white)) {
                this.players[id] = Player.white;
            } else {
                this.players[id] = Player.black;
            }
        }
    },

    removePlayer(id) {
        delete this.players[id];
    },

    isPlayerTurn(id) {
        return this.players[id] === this.board.turn;
    },

    gameMove(from, to) {
        if (this.board.tryMove(from, to)) {
            this.moves.push(Move(from, to));
        }
    },

    // Returns the player who won the game: black, white, or neither
    gameApplyTurn() {
        /* Validate the whole turn by passing the array of moves to a method
         * If the turn is valid, end the player's turn
         * Else, return an error and undo the partial turn */
        if (this.boardBackup.isTurnValid(this.moves)) {
            if (this.board.isGameWon()) {
                this.board.winner = this.board.turn;
                this.board.turn = Player.neither;
            } else {
                this.board.turn = this.board.otherPlayer();
                this.board.rollDice();
                this.boardBackup = clone(this.board);
                this.moves = [];
            }
        } else {
            this.gameUndoTurn();
        }
    },

    gameUndoTurn() {
        this.moves = [];
        this.board = clone(this.boardBackup);
    },
});

exports.State = State;
