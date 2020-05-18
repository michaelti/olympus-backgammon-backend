const prompt = require('prompt-sync')();

// Enum-like object
const Player = Object.freeze({
  empty : {value: 0, name: "Empty", code: "-"},
  white : {value: 1, name: "White", code: "W"},
  black : {value: 2, name: "Black", code: "B"},
});

let Pip = {
	size: 0,
	top: Player.empty,
	bot: Player.empty,
};

let Board = {
	turn: Player.empty,
	off1: 0, off2: 0,
	bar1: 0, bar2: 0,
	pips: new Array(25),

	// Initialize the board for a game of plakoto
	initPlakoto() {
		this.turn = Player.black;	// Later, players will roll to see who goes first
		for (i=0; i<=24; i++) {
			this.pips[i] = Object.create(Pip);
		}
		this.pips[1].top = this.pips[1].bot = Player.white; 
		this.pips[1].size = 15;
		this.pips[24].top = this.pips[24].bot = Player.black; 
		this.pips[24].size = 15;
	},

	// Print an ASCII game board to console
	print() {
		let temp = "";
		for (i=13; i<=24; i++) {
			temp += `(${ i })${ this.pips[i].top.code }${ this.pips[i].size }${ this.pips[i].bot.code } `;
		}
		console.log(temp);
		temp = "";
		for (i=12; i>=1; i--) {
			if (i < 10)
				temp += `( ${ i })${ this.pips[i].top.code }${ this.pips[i].size }${ this.pips[i].bot.code } `;
			else
				temp += `(${ i })${ this.pips[i].top.code }${ this.pips[i].size }${ this.pips[i].bot.code } `;
		}
		console.log(temp + '\n');
	},

	// Is the move valid?
	// from: 	Move from pip # <eg. 1>
	// to: 		Move to pip # <eg. 4>
	// return: 	Returns a boolean
	isValid(from, to) {
		if (this.pips[from].top !== this.turn) {
			return false;
		}
		if (this.pips[to].top === this.otherPlayer() && this.pips[to].size > 1) {
			return false;
		}
		return true;
	},

	doMove(from, to) {
		// From pip
		if (this.pips[from].size === 1) {
			this.pips[from].top = Player.empty;
			this.pips[from].bot = Player.empty;
		}
		else if (this.pips[from].size === 2 && this.pips[from].top !== this.pips[from].bot){
			this.pips[from].top = this.pips[from].bot;
		}
		this.pips[from].size --;

		// To pip
		if (this.pips[to].size === 0) {
			this.pips[to].bot = this.turn;
		}
		this.pips[to].top = this.turn;
		this.pips[to].size ++;
	},

	// Returns the player who's turn it ISN'T
	otherPlayer() {
		if (this.turn === Player.black) return Player.white;
		if (this.turn === Player.white) return Player.black;
		return Player.empty;
	}
};

var board = Object.create(Board);
board.initPlakoto();
board.print();
let from;
let to;

while (true) {
	do {
		from = prompt(`${board.turn.name} move from: `);
		  to = prompt(`${board.turn.name} move to  : `);
	} 
	while (! board.isValid(from, to));

	board.doMove(from, to);
	board.print();
	board.turn = board.otherPlayer();
}