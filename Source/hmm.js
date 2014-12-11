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
 * @param {Matrix} 1xN vector, of which index with the greatest element will be returned
 */
function vectorArgmax(vector) {
    max = 0;
    argmax = -1;

    arr = math.squeeze(vector);

    for (k = 0; k < arr.size()[0]; k++) {
        curr = arr.get([k])
        if (curr > max) {
            max = curr;
            argmax = k;
        }
    }

    return argmax;
}

// Needs cleanup
function elementwiseMul(vector1, vector2) {
    arr1 = math.squeeze(vector1);
    arr2 = math.squeeze(vector2);

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


/**
 * Computes forward probabilities for given parameters.
 * @param {Matrix} initialProbabilities          Initial state probabilities for the HMM (1xN)
 * @param {Matrix} transitionProbabilities       State transition probabilities (NxN)
 * @param {HashTable} observationProbabilities   A hash table that contains a vector (1xN) that contains the observation probabilities
 *                                               per state for each observation symbol
 * @param {Array} observations                   An array of observations of which probability will be calculated according to the model
 */
function forward(initialProbabilities, transitionProbabilities, observationProbabilities, observations) {
    var numStates = initialProbabilities.size()[1];
    var alpha = math.zeros(observations.length, numStates);

    // Fill the initial conditions
    for (i = 0; i < numStates; i++) {
        alpha.set([0, i], initialProbabilities.get([0, i]) * observationProbabilities[observations[0]].get([0, i]));
    }

    // Recursion step
    for (t = 1; t < observations.length; t++) {
        for (j = 0; j < numStates; j++) {
            alpha.set([t, j], math.multiply(row(alpha, t - 1), col(transitionProbabilities, j)) *
            observationProbabilities[observations[t]].get([0, j]))
        }
    }

    return alpha
}

/**
 * Runs Viterbi algorithm and decodes most likely state sequence for a given set of observations.
 * @param {Matrix} initialProbabilities          Initial state probabilities for the HMM (1xN)
 * @param {Matrix} transitionProbabilities       State transition probabilities (NxN)
 * @param {HashTable} observationProbabilities   A hash table that contains a vector (1xN) that contains the observation probabilities
 *                                               per state for each observation symbol
 * @param {Array} observations                   An array of observations of which probability will be calculated according to the model
 * @returns {*[]} an array containing best state sequence, its probability, delta and phi values.
 */
function viterbi(initialProbabilities, transitionProbabilities, observationProbabilities, observations) {
    var numStates = initialProbabilities.size()[1];

    var delta = math.zeros(observations.length, numStates);
    var phi = math.zeros(observations.length, numStates);

    // Fill the initial conditions
    for (i = 0; i < numStates; i++) {
        delta.set([0, i], initialProbabilities.get([0, i]) * observationProbabilities[observations[0]].get([0, i]));
        phi.set([0, i], 0)
    }

    /*
     Recursion step
     */
    for (t = 1; t < observations.length; t++) {
        for (j = 0; j < numStates; j++) {
            multiplication = elementwiseMul(row(delta, t - 1), col(transitionProbabilities, j));

            // Find the argmax
            argmax = vectorArgmax(multiplication);

            phi.set([t, j], argmax);
            delta.set([t, j], multiplication.get([0, argmax]) * observationProbabilities[observations[t]].get([0, j]))
        }
    }

    /*
     Decoding step.
     */
    stateSequence = math.zeros(observations.length, 1);

    // Set the last element to the most likely value
    mostLikelyState = vectorArgmax(row(delta, observations.length - 1));
    stateSequence.set([observations.length - 1, 0], mostLikelyState);

    // Start decoding backwards
    for (t = observations.length - 2; t >= 0; t--) {
        prevState = stateSequence.get([t + 1, 0]);
        stateSequence.set([t, 0], phi.get([t + 1, prevState]));
    }

    bestStateSequenceProbability = delta.get([observations.length - 1, mostLikelyState]);

    return [stateSequence, bestStateSequenceProbability, delta, phi]
}


/**
 * Creates flat-start probabilities for the UI.
 * @param numStates number of states in the HMM
 * @param observationAlphabet the set of observations that can be encountered
 * @returns {*[]} an array containing initial state probabilities, state transition probabilities and observation probabilities
 */
function getFlatStartProbabilities(numStates, observationAlphabet) {
    initialProbabilities = math.zeros(1, numStates);
    transitionProbabilities = math.zeros(numStates, numStates);
    observationProbabilities = new Object();

    stateFlatStart = 1.0 / numStates;

    for (i = 0; i < numStates; i++) {
        initialProbabilities.set([0, i], stateFlatStart);

        for (j = 0; j < numStates; j++) {
            transitionProbabilities.set([i, j], stateFlatStart);
        }
    }

    observationAlphabet.forEach(function (elem) {
        observationProbabilities[elem] = stateFlatStart;
    });

    return [initialProbabilities, transitionProbabilities, observationProbabilities];
}