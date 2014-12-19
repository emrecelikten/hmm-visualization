/**
 * Computes forward probabilities for given parameters.
 * @param {Matrix} initialProbabilities          initial state probabilities for the HMM (1xN)
 * @param {Matrix} transitionProbabilities       state transition probabilities (NxN)
 * @param {HashTable} observationProbabilities   a hash table that contains a vector (1xN) that contains the observation probabilities
 *                                               per state for each observation symbol
 * @param {Array} observations                   an array of observations of which probability will be calculated according to the model
 * @returns {*[]}                                an array containing alpha values and their computations
 */
function forward(initialProbabilities, transitionProbabilities, observationProbabilities, observations) {
    var numStates = initialProbabilities.size()[1];
    var alpha = math.zeros(observations.length, numStates);

    // Contains computation strings
    var alphaComputations = math.matrix([observations.length, numStates]);
    var arrows = math.matrix([observations.length, numStates]);

    // Fill the initial conditions
    for (i = 0; i < numStates; i++) {
        alpha.set([0, i], initialProbabilities.get([0, i]) * observationProbabilities[observations[0]].get([0, i]));

        var tempStr = 'initial probability for state ' + i + ' * observation probability for \'' + observations[i] + '\' at state ' + i + '<br>';
        tempStr += initialProbabilities.get([0, i]) + '*' + observationProbabilities[observations[0]].get([0, i]);
        alphaComputations.set([0, i], tempStr);
    }

    // Recursion step
    // TODO: Cleanup, we iterate multiple times for the same thing
    for (t = 1; t < observations.length; t++) {
        for (j = 0; j < numStates; j++) {
            alpha.set([t, j], math.multiply(row(alpha, t - 1), col(transitionProbabilities, j)) * observationProbabilities[observations[t]].get([0, j]));

            var tempStr = '( alpha_' + t + ' . probabilities of going to state ' + j + ' ) * observation probability for \'' + observations[t] + '\' at alpha_' + (t + 1) + '<br>';
            tempStr += '( ' + math.string(row(alpha, t - 1)) + ' . ' + math.string(col(transitionProbabilities, j)) + ' ) * ' + observationProbabilities[observations[t]].get([0, j]);
            alphaComputations.set([t, j], tempStr);

            tempStr = '';
            for (k = 0; k < numStates; k++) {
                tempStr += alpha.get([t - 1, k]) + ' * ' + transitionProbabilities.get([k, j]) + ', ';
            }

            tempStr = tempStr.substr(0, tempStr.length - 2);

            arrows.set([t, j], tempStr);
        }
    }

    return [alpha, alphaComputations, arrows]
}

/**
 * Runs Viterbi algorithm and decodes most likely state sequence for a given set of observations.
 * @param {Matrix} initialProbabilities          initial state probabilities for the HMM (1xN)
 * @param {Matrix} transitionProbabilities       state transition probabilities (NxN)
 * @param {HashTable} observationProbabilities   a hash table that contains a vector (1xN) that contains the observation probabilities
 *                                               per state for each observation symbol
 * @param {Array} observations                   an array of observations of which probability will be calculated according to the model
 * @returns {*[]}                                an array containing best state sequence, its probability, delta and phi values.
 */
function viterbi(initialProbabilities, transitionProbabilities, observationProbabilities, observations) {
    var numStates = initialProbabilities.size()[1];

    var delta = math.zeros(observations.length, numStates);
    var phi = math.zeros(observations.length, numStates);

    var deltaComputations = math.matrix([observations.length, numStates]);
    var arrows = math.matrix([observations.length, numStates]);

    // Fill the initial conditions
    for (var i = 0; i < numStates; i++) {
        delta.set([0, i], initialProbabilities.get([0, i]) * observationProbabilities[observations[0]].get([0, i]));
        phi.set([0, i], 0);

        var tempStr = 'initial probability for state ' + i + ' * observation probability for \'' + observations[i] + '\' at state ' + i + '<br>';
        tempStr += initialProbabilities.get([0, i]) + '*' + observationProbabilities[observations[0]].get([0, i]);
        deltaComputations.set([0, i], tempStr);
    }

    /*
     Recursion step
     */
    // TODO: Cleanup, we iterate multiple times for the same thing
    for (var t = 1; t < observations.length; t++) {
        for (var j = 0; j < numStates; j++) {
            var multiplication = elementwiseMul(row(delta, t - 1), col(transitionProbabilities, j));

            // Find the argmax
            var argmax = vectorArgmax(multiplication);

            phi.set([t, j], argmax);
            delta.set([t, j], multiplication.get([0, argmax]) * observationProbabilities[observations[t]].get([0, j]));

            var tempStr = 'max ( elementwise multiplication of delta_' + (t - 1) + ' and probabilities of going to state ' + j + ' )<br>';
            var arrowStr = '';

            for (k = 0; k < numStates; k++) {
                arrowStr += delta.get([t - 1, k]) + ' * ' + transitionProbabilities.get([k, j]) + ', ';
            }
            arrowStr = arrowStr.substr(0, arrowStr.length - 2);

            tempStr += 'max( ' + arrowStr + ' )';

            deltaComputations.set([t, j], tempStr);
            arrows.set([t, j], arrowStr);
        }
    }

    /*
     Decoding step.
     */
    var stateSequence = math.zeros(observations.length, 1);

    // Set the last element to the most likely value
    var mostLikelyState = vectorArgmax(row(delta, observations.length - 1));
    stateSequence.set([observations.length - 1, 0], mostLikelyState);

    // Start decoding backwards
    for (t = observations.length - 2; t >= 0; t--) {
        var prevState = stateSequence.get([t + 1, 0]);
        stateSequence.set([t, 0], phi.get([t + 1, prevState]));
    }

    var bestStateSequenceProbability = delta.get([observations.length - 1, mostLikelyState]);

    return [stateSequence, bestStateSequenceProbability, delta, phi, deltaComputations, arrows]
}


/**
 * Creates flat-start probabilities for the UI.
 *
 * Sample usage: getFlatStartProbabilities(5, ['a', 'b', 'c', 'd', 'e']);
 * @param numStates             number of states in the HMM
 * @param observationAlphabet   an array containing the set of observations that can be encountered
 * @returns {*[]}               an array containing initial state probabilities, state transition probabilities and observation probabilities
 */
function getFlatStartProbabilities(numStates, observationAlphabet) {
    var initialProbabilities = math.zeros(1, numStates);
    var transitionProbabilities = math.zeros(numStates, numStates);
    var observationProbabilities = {};

    var stateFlatStart = 1.0 / numStates;

    for (i = 0; i < numStates; i++) {
        initialProbabilities.set([0, i], stateFlatStart);

        for (j = 0; j < numStates; j++) {
            transitionProbabilities.set([i, j], stateFlatStart);
        }
    }

    observationAlphabet.forEach(function (elem) {
        observationProbabilities[elem] = initialProbabilities.clone();
    });

    return [initialProbabilities, transitionProbabilities, observationProbabilities];
}


/**
 * Creates random probabilities for the UI.
 *
 * Sample usage: getFlatStartProbabilities(5, ['a', 'b', 'c', 'd', 'e']);
 * @param numStates             number of states in the HMM
 * @param observationAlphabet   an array containing the set of observations that can be encountered
 * @returns {*[]}               an array containing initial state probabilities, state transition probabilities and observation probabilities
 */
function getRandomStartProbabilities(numStates, observationAlphabet) {
    var initialProbabilities = math.zeros(1, numStates);
    var transitionProbabilities = math.zeros(numStates, numStates);
    var observationProbabilities = {};

    for (var i = 0; i < numStates; i++) {
        initialProbabilities.set([0, i], math.random(0, 1));

        for (var j = 0; j < numStates; j++) {
            transitionProbabilities.set([i, j], math.random(0, 1));
        }
    }

    observationAlphabet.forEach(function (elem) {
        var probabilities = math.zeros(1, numStates);

        for (i = 0; i < numStates; i++) {
            probabilities.set([0, i], math.random(0, 1));
        }

        observationProbabilities[elem] = probabilities;
    });

    /*
     Normalization
     */
    var initialProbNorm = math.sum(initialProbabilities);
    initialProbabilities = math.divide(initialProbabilities, initialProbNorm);

    // Maybe there is a better way of doing this.
    for (i = 0; i < numStates; i++) {
        var transProbNorm = math.sum(row(transitionProbabilities, i));
        for (j = 0; j < numStates; j++) {
            transitionProbabilities.set([i, j], transitionProbabilities.get([i, j]) / transProbNorm);
        }
    }

    observationAlphabet.forEach(function (elem) {
        var obsProbNorm = math.sum(observationProbabilities[elem]);
        observationProbabilities[elem] = math.divide(observationProbabilities[elem], obsProbNorm);
    });

    return [initialProbabilities, transitionProbabilities, observationProbabilities];
}