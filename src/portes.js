const { Board, Pip, Move, Player, clamp } = require("./gameUtil");
const clone = require("ramda.clone");
const { range } = require("./util");

const Portes = () => ({
    // Inherit from generic board
    ...Board(),

    // Implement Portes-specific methods and variables
    // Initialize the board for a game of portes
    initGame() {
        this.pips[24] = Pip(2, Player.black); // Black moves towards pip 1 (decreasing)
        this.pips[19] = Pip(5, Player.white);
        this.pips[17] = Pip(3, Player.white);
        this.pips[13] = Pip(5, Player.black);
        this.pips[12] = Pip(5, Player.white);
        this.pips[8] = Pip(3, Player.black);
        this.pips[6] = Pip(5, Player.black);
        this.pips[1] = Pip(2, Player.white); // White moves towards pip 24 (increasing)
    },

    // Is the move valid?
    // from:    Move from pip # <eg. 1>
    // to:      Move to pip # <eg. 4>
    // return:  Returns a boolean
    isMoveValid(from, to) {
        to = clamp(to);
        if (this.pips[from].top !== this.turn) return false;

        // Bearing off
        if (to === 25 || to === 0) {
            if (this.turn === Player.white && from < 19) return false;
            if (this.turn === Player.black && from > 6) return false;
            // Range of all pips excluding the current player's home quadrant
            const nonHomePips = this.turn === Player.white ? range(1, 18) : range(7, 24);
            for (let i of nonHomePips) {
                if (this.pips[i].top === this.turn || this.pips[i].bot === this.turn) return false;
            }
            // If bearing off from an non-exact number of pips
            if (!this.dice.includes(Math.abs(from - to))) {
                // Check if there's a big enough dice
                if (this.dice[0] > Math.abs(from - to) || this.dice[1] > Math.abs(from - to)) {
                    // Range of pips in the player's home quadrant that are further away than the pip they are trying to bear off of
                    const farHomePips =
                        this.turn === Player.white ? range(19, from - 1) : range(from + 1, 6);
                    for (let i of farHomePips) {
                        if (this.pips[i].top === this.turn || this.pips[i].bot === this.turn)
                            return false;
                    }
                } else {
                    return false;
                }
            }
        }
        // Standard move
        else {
            if (from < 1 || from > 24 || to < 1 || to > 24) return false;
            if (this.pips[to].top !== this.turn && this.pips[to].size > 1) return false;
            if (!this.dice.includes(this.turn * (to - from))) return false;
        }

        return true;
    },

    doMove(from, to) {
        to = clamp(to);

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
            if (this.turn === Player.white) this.off[Player.white]++;
            if (this.turn === Player.black) this.off[Player.black]++;
        } else {
            if (this.pips[to].size === 0) {
                this.pips[to].bot = this.turn;
            }
            this.pips[to].top = this.turn;
            this.pips[to].size++;
        }

        // Handle dice. NOTE: this will only work for 2 distinct values or 4 identical values
        if (this.dice[0] >= Math.abs(from - to)) {
            this.dice.shift();
        } else {
            this.dice.pop();
        }
    },

    // Returns 2D array
    allPossibleTurns() {
        if (this.dice.length === 0) return [];
        let ret = new Array();
        let uniqueDice = this.dice[0] === this.dice[1] ? [this.dice[0]] : this.dice;
        for (const die of uniqueDice) {
            for (let pipIndex = 1; pipIndex <= 24; pipIndex++) {
                if (this.pips[pipIndex].top === this.turn) {
                    let currentMove = Move(pipIndex, clamp(this.turn * die + Number(pipIndex)));
                    if (this.isMoveValid(currentMove.from, currentMove.to)) {
                        // deep copy game board using ramda
                        let newBoard = clone(this);
                        newBoard.doMove(currentMove.from, currentMove.to);
                        let nextTurns = newBoard.allPossibleTurns();
                        if (nextTurns.length) {
                            for (const nextMoves of nextTurns) {
                                ret.push([currentMove, ...nextMoves]);
                                if ([currentMove, ...nextMoves].length === 4)
                                    throw "Possible turn of length 4 detected";
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

    // Validates a turn of 0–4 moves
    isTurnValid(moves) {
        try {
            let maxTurnLength = 0;
            const possibleTurns = this.allPossibleTurns();
            for (let turn of possibleTurns) {
                if (turn.length > maxTurnLength) maxTurnLength = turn.length;
            }
            // Validate turn length
            if (maxTurnLength !== moves.length) return false;
            // Validate single move turn uses the largest dice value possible
            if (maxTurnLength === 1 && this.dice.length === 2) {
                const moveDistance = (m) => Math.abs(m.from - m.to);
                // if the supplied move matches the smaller dice
                // then check if there's a possible move with the larger dice
                if (moveDistance(moves[0]) === this.dice[0]) {
                    for (let turn of possibleTurns) {
                        if (moveDistance(turn[0]) === this.dice[1]) return false;
                    }
                }
            }
        } catch (four) {
            // Code optimization when there's a possible 4 move turn
            if (moves.length !== 4) return false;
        }
        return true;
    },

    // Is the board in a state where the game is won?
    isGameWon() {
        const home = { [Player.white]: this.pips[1], [Player.black]: this.pips[24] };

        // Both player's starting checkers have been trapped: game is a draw
        if (this.pips[1].top !== this.pips[1].bot && this.pips[24].top !== this.pips[24].bot)
            this.winner = Player.neither;
        // Player has beared off all of their checkers
        else if (this.off[this.turn] === 15) this.winner = this.turn;
        // If other player's starting checker has been pinned and current player's is safe
        else if (
            home[this.otherPlayer()].top !== home[this.otherPlayer()].bot &&
            home[this.turn].bot !== this.turn
        ) {
            this.winner = this.turn;
        }

        if (this.winner !== null) {
            this.turn = Player.neither;
            return true;
        }
        return false;
    },
});

exports.Board = Portes;