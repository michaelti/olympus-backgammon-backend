// Enum-like object
exports.Player = Object.freeze({
    neither: 0,
    white: 1,
    black: -1,
});

// Clamps "to" in range 0–25
exports.clamp = (to) => (to < 0 ? 0 : to > 25 ? 25 : to);

exports.Move = (from, to) => ({ from, to });
