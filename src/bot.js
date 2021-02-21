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

                // Todo:
                // - Get it to play a good turn instead of a random one
                // - Clean it up

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

                const turn = onlyValidTurns[Math.floor(Math.random() * onlyValidTurns.length)];

                turn.forEach(async (move, i) => {
                    await think(750 * (i + 1));
                    socket.emit("game/move", move.from, move.to);
                });
            }

            // Finish a turn
            if (roomLocal.board.turnValidity > 0) {
                console.log("Bot applying turn");
                socket.emit("game/apply-turn");
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
