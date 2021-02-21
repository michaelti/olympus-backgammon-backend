const io = require("socket.io-client");
const { portes, plakoto, fevga, Variant } = require("olympus-bg");
const clone = require("ramda.clone");
const { Step } = require("./roomObj");

const think = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

// Copied from frontend:
const cloneBoard = {
    [Variant.portes]: (boardState) => ({ ...portes.Board(), ...clone(boardState) }),
    [Variant.plakoto]: (boardState) => ({ ...plakoto.Board(), ...clone(boardState) }),
    [Variant.fevga]: (boardState) => ({ ...fevga.Board(), ...clone(boardState) }),
};

function pickTurn(turns, board) {
    const { turn } = turns.reduce(
        (bestTurn, currentTurn) => {
            const clonedBoard = clone(board);

            currentTurn.forEach((move) => {
                clonedBoard.doMove(move.from, move.to);
            });

            const rank = rankBoard(clonedBoard);

            if (rank > bestTurn.rank) return { turn: currentTurn, rank };
            return bestTurn;
        },
        { turn: [], rank: -Infinity }
    );

    return turn;
}

function rankBoard(board) {
    let rank = 0;

    // -10 = very bad
    // -5 = kinda bad
    // 0 = neutral
    // +5 = kinda good
    // +10 = very good

    let isEndGame = true;
    let sawBlack = false;

    for (let i = 25; i >= 0; i--) {
        if (board.pips[i].top === -1) sawBlack = true;
        if (board.pips[i].top === 1 && sawBlack) {
            isEndGame = false;
            break;
        }
    }

    board.pips.forEach((pip, i) => {
        // An open checker
        if (pip.top === board.turn && pip.size === 1) {
            for (let j = i - 1; j >= 0; j--) {
                // If a white checker exists ahead
                if (board.pips[j].top === 1 && board.pips[j].size > 0) {
                    rank -= 24 - i;
                    break;
                }
            }
        }

        // A closed door while not in the endgame
        if (pip.top === board.turn && pip.size > 1 && !isEndGame) rank += 5;
    });

    // If we send the opponent to the bar
    rank += board.pips[0].size * 20;

    // If we bear off
    rank += board.off[-1] * 20;

    return rank;
}

const bot = () => {
    const socket = io(`http://localhost:3001`);
    let roomLocal = {};
    let player;
    let doingMove = false;

    socket.on("room/update-room", async (room) => {
        roomLocal = { ...roomLocal, ...room };

        // Do a starting roll
        if (roomLocal.step === Step.startingRoll && !roomLocal.dice[player]) {
            console.log("Bot doing a starting roll");
            await think(750);
            socket.emit("room/starting-roll");
        }

        // Game stuff
        if (roomLocal.step === Step.game && roomLocal.board.turn === player) {
            // Do a move
            if (roomLocal.board.turnValidity <= 0 && !doingMove) {
                console.log("Bot moving");
                doingMove = true;

                const logicBoard = cloneBoard[roomLocal.variant](roomLocal.board);

                logicBoard.maxTurnLength = 0;
                logicBoard.possibleTurns = logicBoard.allPossibleTurns(true);
                for (const turn of logicBoard.possibleTurns) {
                    if (turn.length > logicBoard.maxTurnLength) {
                        logicBoard.maxTurnLength = turn.length;
                    }
                }

                const onlyValidTurns = logicBoard.possibleTurns.filter((turn) => {
                    return logicBoard.turnValidator(turn) > 0;
                });

                const turn = pickTurn(onlyValidTurns, logicBoard);

                // IDEA 1: dedupe the unique turns
                // const strings = onlyValidTurns.map((turn) => {
                //     const clonedBoard = clone(logicBoard);

                //     turn.forEach((move) => {
                //         clonedBoard.doMove(move.from, move.to);
                //     });

                //     return JSON.stringify(clonedBoard.pips);
                // });

                // const uniqueTurns = new Set(strings);
                // console.log(uniqueTurns.size);

                turn.forEach(async (move, i) => {
                    await think(750 * (i + 1));
                    socket.emit("game/move", move.from, move.to);
                });
            }

            // Finish a turn
            if (roomLocal.board.turnValidity > 0) {
                console.log("Bot applying turn");
                // socket.emit("game/apply-turn");
                doingMove = false;
            }
        }
    });

    return {
        join: (roomName) => {
            // Join the room
            socket.emit("event/join-room", roomName, (acknowledgement) => {
                if (acknowledgement.ok) {
                    console.log(`Bot ${socket.id} joined room ${roomName}`);
                    player = acknowledgement.player;
                } else {
                    console.log(`Bot ${socket.id} failed to join room ${roomName}`);
                }
            });
        },
    };
};

module.exports = bot;
