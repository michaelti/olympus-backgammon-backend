const prompt = require("prompt-sync")({ sigint: true });
const clone = require("ramda.clone");

// Enum-like object
const Player = Object.freeze({
    neither: 0,
    white: 1,
    black: -1,
});

const Pip = (size = 0, owner = Player.neither) => ({
    size: size,
    top: owner,
    bot: owner,
});

const Submove = (from, to) => ({ from, to });

const Board = () => ({
    turn: Player.neither,
    offWhite: 0,
    barWhite: 0,
    offBlack: 0,
    barBlack: 0,
    pips: new Array(25),
    dice: new Array(2),

    // Initialize the board for a game of plakoto
    initPlakoto() {
        this.turn = Player.black; // Later, players will roll to see who goes first
        this.rollDice();
        for (let i = 0; i <= 24; i++) {
            this.pips[i] = Pip();
        }
        this.pips[24] = Pip(15, Player.black); // Black moves towards pip 1 (decreasing)
        this.pips[1] = Pip(15, Player.white); // White moves towards pip 24 (increasing)
    },

    initTest() {
        this.turn = Player.white; // Later, players will roll to see who goes first
        this.dice = [3, 5];
        for (let i = 0; i <= 24; i++) {
            this.pips[i] = Pip();
        }
        this.pips[12] = Pip(15, Player.black); // Black moves towards pip 1 (decreasing)
        this.pips[21] = Pip(5, Player.white); // White moves towards pip 24 (increasing)
        this.pips[23] = Pip(5, Player.white);
    },

    rollDice() {
        this.dice = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        // Sort smallest to largest
        if (this.dice[0] > this.dice[1]) this.dice.reverse();
        // Doubles
        if (this.dice[0] === this.dice[1]) this.dice = this.dice.concat(this.dice);
    },

    // Is the move valid?
    // from:    Move from pip # <eg. 1>
    // to:      Move to pip # <eg. 4>
    // return:  Returns a boolean
    isValid(from, to) {
        if (to > 25) to = 25;
        if (to < 0) to = 0;

        if (this.pips[from].top !== this.turn) return false;
        // Bearing off; TODO: re-write this
        if (to === 25 && this.turn === Player.white) {
            if (from <= 18) return false;
            for (let i = 1; i <= 18; i++) {
                if (this.pips[i].top === this.turn || this.pips[i].bot === this.turn) return false;
            }
            // If not an exact match
            if (!this.dice.includes(to - from)) {
                // Then check if there's a bigger dice
                if (this.dice[0] > to - from || this.dice[1] > to - from) {
                    for (let i = 19; i < from; i++) {
                        if (this.pips[i].top === this.turn || this.pips[i].bot === this.turn)
                            return false;
                    }
                } else {
                    return false;
                }
            }
        } else if (to === 0 && this.turn === Player.black) {
            if (from > 6) return false;
            for (let i = 24; i >= 6; i--) {
                if (this.pips[i].top === this.turn || this.pips[i].bot === this.turn) return false;
            }
            // If not an exact match
            if (!this.dice.includes(from - to)) {
                // Then check if there's a bigger dice
                if (this.dice[0] > from - to || this.dice[i] > from - to) {
                    for (let i = 6; i> from; i--) {
                        if (this.pips[i].top === this.turn || this.pips[i].bot === this.turn)
                            return false;
                    }
                } else {
                    return false;
                }
            }
        } else {
            if (from < 1 || from > 24 || to < 1 || to > 24) return false;
            if (this.pips[to].top === this.otherPlayer() && this.pips[to].size > 1) return false;
            if (!this.dice.includes(this.turn * (to - from))) return false;
        }
        return true;
    },

    doSubmove(from, to) {
        if (to > 25) to = 25;
        if (to < 0) to = 0;
        // From pip
        if (this.pips[from].size === 1) {
            this.pips[from].top = Player.neither;
            this.pips[from].bot = Player.neither;
        } else if (this.pips[from].size === 2 && this.pips[from].top !== this.pips[from].bot) {
            this.pips[from].top = this.pips[from].bot;
        }
        this.pips[from].size--;

        // To pip
        if (to === 0 || to === 25) {
            // Bearing off
            if (this.turn === Player.white) this.offWhite++;
            if (this.turn === Player.black) this.offBlack++;
        } else {
            if (this.pips[to].size === 0) {
                this.pips[to].bot = this.turn;
            }
            this.pips[to].top = this.turn;
            this.pips[to].size++;
        }

        // Handle dice. NOTE: this will only work for 2 distinct values or 4 idencital values
        if (this.dice[0] >= Math.abs(from - to)) {
            this.dice.shift();
        } else {
            this.dice.pop();
        }
    },

    // Returns the player who's turn it ISN'T
    otherPlayer() {
        if (this.turn === Player.black) return Player.white;
        if (this.turn === Player.white) return Player.black;
        return Player.neither;
    },

    // Returns 2D array
    allPossibleMoves() {
        if (this.dice.length === 0) return [];
        let ret = new Array();
        let uniqueDice = this.dice[0] === this.dice[1] ? [this.dice[0]] : this.dice;
        for (const die of uniqueDice) {
            for (let pipIndex = 1; pipIndex <= 24; pipIndex++) {
                if (this.pips[pipIndex].top === this.turn) {
                    let currentMove = Submove(pipIndex, this.turn * die + Number(pipIndex));
                    if (this.isValid(currentMove.from, currentMove.to)) {
                        // deep copy game board using ramda
                        let newBoard = clone(this);
                        newBoard.doSubmove(currentMove.from, currentMove.to);
                        let nextMoves = newBoard.allPossibleMoves();
                        if (nextMoves.length) {
                            for (const nextMove of nextMoves) {
                                ret.push([currentMove, ...nextMove]);
                            }
                        } else {
                            ret.push([currentMove]);
                        }
                    }
                }
            }
        }
        return ret;
    },

    // Returns true if the move was successful
    trySubmove(from, to) {
        if (this.isValid(from, to)) {
            this.doSubmove(from, to);
            return true;
        }
        return false;
    },

    isTurnValid() {
        return true;
    },
});

function playPlakoto() {
    let board = Board();
    board.initPlakoto();
    console.dir(board.pips);
    let from, to;

    while (true) {
        while (board.dice.length > 0) {
            console.log("Your dice are: " + board.dice);
            console.log(board.allPossibleMoves());
            from = prompt(`Player ${board.turn} move from: `);
            to = prompt(`Player ${board.turn} move to  : `);
            if (board.isValid(Number(from), Number(to))) {
                board.doSubmove(Number(from), Number(to));
                console.dir(board.pips);
            }
        }
        board.turn = board.otherPlayer();
        board.rollDice();
    }
}

//playPlakoto();
exports.Board = Board;
exports.Submove = Submove;
