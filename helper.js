/**
 * Retrieve a column from a matrix
 * @param {Matrix | Array} matrix
 * @param {number} index    Zero based column index
 * @return {Matrix | Array} Returns the column as a vector
 *
 * Taken from: https://github.com/josdejong/mathjs/issues/230
 */
function col(matrix, index) {
    var rows = math.size(matrix).valueOf()[0];
    return math.flatten(math.subset(matrix, math.index([0, rows], index)));
}

/**
 * Retrieve a row from a matrix
 * @param {Matrix | Array} matrix
 * @param {number} index    Zero based row index
 * @return {Matrix | Array} Returns the row as a vector
 *
 * Taken from: https://github.com/josdejong/mathjs/issues/230
 */
function row(matrix, index) {
    var rows = math.size(matrix).valueOf()[1];
    return math.flatten(math.subset(matrix, math.index(index, [0, rows])));
}

/**
 * A helper function for returning the largest index of a 1xN vector.
 *
 * @param {Matrix} vector   1xN vector, of which index with the greatest element will be returned
 */
function vectorArgmax(vector) {
    var max = 0;
    var argmax = -1;

    var arr = math.squeeze(vector);

    for (k = 0; k < arr.size()[0]; k++) {
        var curr = arr.get([k])
        if (curr > max) {
            max = curr;
            argmax = k;
        }
    }

    return argmax;
}

/**
 * A helper function for element-wise multiplication of two vectors.
 *
 * @returns {*} a vector that contains element-wise multiplication of vector1 and vector2
 */
function elementwiseMul(vector1, vector2) {
    var arr1 = math.squeeze(vector1);
    var arr2 = math.squeeze(vector2);

    var result;
    if (arr1.size()[0] != arr2.size()[0]) {
        throw "Vectors are not of the same shape!";
    } else {
        result = math.zeros(1, arr1.size()[0]);

        for (i = 0; i < arr1.size()[0]; i++) {
            result.set([0, i], vector1.get([i]) * vector2.get([i]));
        }

        return result
    }
}

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}