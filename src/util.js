// Return a random numeric string of length n
exports.randomNumeric = (length) => {
    const chars = "0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
};

exports.range = (start, end, length = end - start + 1) =>
    Array.from({ length }, (_, i) => start + i);
