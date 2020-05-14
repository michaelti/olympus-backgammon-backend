const prompt = require('prompt-sync')();

//const colour = Object.freeze({"empty":0, "black":1, "white":2});
let Pip = {
	size: 0,
	top: "-",//colour.empty,
	bot: "-",//colour.empty,
	print() {
		console.log(this.size + 1);
	}
};
let Board = {
	off1: 0, off2: 0,
	bar1: 0, bar2: 0,
	pips: new Array(25),

	// Initialize the board for a game of plakoto
	initPlakoto() {
		for (i=0; i<=24; i++) {
			this.pips[i] = Object.create(Pip);
		}
		this.pips[1].top = this.pips[1].bot = "W"; 
		this.pips[1].size = 15;
		this.pips[24].top = this.pips[24].bot = "B"; 
		this.pips[24].size = 15;
	},

	// Print an ASCII game board to console
	print() {
		let temp = "";
		for (i=13; i<=24; i++) {
			temp += `(${ i })${ this.pips[i].top }${ this.pips[i].size }${ this.pips[i].bot } `;
		}
		console.log(temp);
		temp = "";
		for (i=12; i>=1; i--) {
			if (i < 10)
				temp += `( ${ i })${ this.pips[i].top }${ this.pips[i].size }${ this.pips[i].bot } `;
			else
				temp += `(${ i })${ this.pips[i].top }${ this.pips[i].size }${ this.pips[i].bot } `;
		}
		console.log(temp + '\n');
	},

	// Is the move valid?
	// turn: 	Who's turn is it <B or W>
	// from: 	Move from pip # <eg. 1>
	// to: 		Move to pip # <eg. 4>
	// return: 	Returns a boolean
	isValid(turn, from, to) {
		if (turn === "black") {
			if (this.pips[from].top !== "B") {
				return false;
			}
			if (this.pips[to].top === "W" && this.pips[to].size > 1) {
				return false;
			}
		}
		else if (turn === "white") {
			if (this.pips[from].top !== "W") {
				return false;
			}
			if (this.pips[to].top === "B" && this.pips[to].size > 1) {
				return false;
			}
		}
		return true;
	},

	doMove(turn, from, to) {
		// From pip
		if (this.pips[from].size === 1) {
			this.pips[from].top = '-';
			this.pips[from].bot = '-';
		}
		else if (this.pips[from].size === 2 && this.pips[from].top !== this.pips[from].bot){
			this.pips[from].top = this.pips[from].bot;
		}
		this.pips[from].size --;

		// To pip
		if (this.pips[to].size === 0) {
			this.pips[to].bot = turn;
		}
		this.pips[to].top = turn;
		this.pips[to].size ++;
	}
};

var board1 = Object.create(Board);
board1.initPlakoto();
//board1.pips[13].top = "black";
board1.print();
let from;
let to;

while (true) {
	do {
		from = prompt('Black move from: ');
		  to = prompt('Black move to  : ');
	} 
	while (! board1.isValid("black", from, to));

	board1.doMove("B", from, to);
	board1.print();

	do {
		from = prompt('White move from: ');
		  to = prompt('White move to  : ');
	} 
	while (! board1.isValid("white", from, to));

	board1.doMove("W", from, to);
	board1.print();
}