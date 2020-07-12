const clone = require("ramda.clone");
const plakoto = require("./plakoto");
const { Player, Variant, Move, rollDie } = require("./gameUtil");

const Step = Object.freeze({
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
    startingRolls: { [Player.white]: null, [Player.black]: null },
    step: Step.setup,

    initGame(type) {
        // Initialize a game
        if (type === Variant.plakoto) this.board = plakoto.Board();
        else console.error("Only plakoto is currently available");
        this.board.initGame();
        this.step = Step.startingRoll;
        this.moves = new Array();
    },

    startGame() {
        this.step = Step.game;
        this.board.rollDice();
        this.board.turn =
            this.startingRolls[Player.black] > this.startingRolls[Player.white]
                ? Player.black
                : Player.white;
        this.boardBackup = clone(this.board);
    },

    roll(player) {
        if (this.startingRolls[player] === null) this.startingRolls[player] = rollDie();

        // If both players have rolled different values
        if (this.startingRolls[Player.white] && this.startingRolls[Player.black]) {
            if (this.startingRolls[Player.white] !== this.startingRolls[Player.black]) {
                this.startGame();
            }
        }
    },

    // If the players roll the same number, clear the saved values so they can roll again
    rollCleanup() {
        if (this.startingRolls[Player.white] === this.startingRolls[Player.black]) {
            this.startingRolls = { [Player.white]: null, [Player.black]: null };
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

exports.Step = Step;
