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

     for(i = 0; i < numStates; i++) {
        alpha.set([0, i], initialProbabilities.get([0, i]) * observationProbabilities[observations[0]].get([0, i]));
     }

     for (t = 1; t < observations.length; t++) {
        for (j = 0; j < numStates; j++) {
            alpha.set([t, j], math.multiply(row(alpha, t - 1), col(transitionProbabilities, j)) * 
                observationProbabilities[observations[t]].get([0, j]))
        }
     }

    return alpha
}