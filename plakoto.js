const prompt = require('prompt-sync')();

// Enum-like object
const Player = Object.freeze({
  black : {value: -1, name: "Black", code: "B"}, 
  empty : {value: 0,  name: "Empty", code: "-"}, 
  white : {value: 1,  name: "White", code: "W"}
});

let Pip = {
	size: 0,
	top: Player.empty,
	bot: Player.empty,
};

let Board = {
	turn: Player.black,
	off1: 0, off2: 0,
	bar1: 0, bar2: 0,
	pips: new Array(25),

	// Initialize the board for a game of plakoto
	initPlakoto() {
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
	// turn: 	Who's turn is it <B or W>
	// from: 	Move from pip # <eg. 1>
	// to: 		Move to pip # <eg. 4>
	// return: 	Returns a boolean
	isValid(from, to) {
		if (this.turn === Player.black) {
			if (this.pips[from].top !== Player.black) {
				return false;
			}
			if (this.pips[to].top === Player.white && this.pips[to].size > 1) {
				return false;
			}
		}
		else if (this.turn === Player.white) {
			if (this.pips[from].top !== Player.white) {
				return false;
			}
			if (this.pips[to].top === Player.black && this.pips[to].size > 1) {
				return false;
			}
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
	}
};

var board1 = Object.create(Board);
board1.initPlakoto();
board1.print();
let from;
let to;

while (true) {
	do {
		from = prompt('Black move from: ');
		  to = prompt('Black move to  : ');
	} 
	while (! board1.isValid(from, to));

	board1.doMove(from, to);
	board1.print();
	board1.turn = Player.white;
	do {
		from = prompt('White move from: ');
		  to = prompt('White move to  : ');
	} 
	while (! board1.isValid(from, to));

	board1.doMove(from, to);
	board1.print();
	board1.turn = Player.black;
}