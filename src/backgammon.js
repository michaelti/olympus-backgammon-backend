const { Player } = require("./gameUtil");

exports.Board = () => ({
    turn: Player.neither,
    offWhite: 0,
    barWhite: 0,
    offBlack: 0,
    barBlack: 0,
    pips: new Array(25),
    dice: new Array(2),

    rollDice() {
        this.dice = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        // Sort smallest to largest
        if (this.dice[0] > this.dice[1]) this.dice.reverse();
        // Doubles
        if (this.dice[0] === this.dice[1]) this.dice = this.dice.concat(this.dice);
    },

    // Returns the player who's turn it ISN'T
    otherPlayer() {
        if (this.turn === Player.black) return Player.white;
        if (this.turn === Player.white) return Player.black;
        return Player.neither;
    },

    // Returns true if the move was successful
    tryMove(from, to) {
        if (this.isMoveValid(from, to)) {
            this.doMove(from, to);
            return true;
        }
        return false;
    },
});

exports.Pip = (size = 0, owner = Player.neither) => ({
    size: size,
    top: owner,
    bot: owner,
});
