__author__ = 'Emre Celikten'

import numpy as np


class HMM:
    """A data structure that contains the necessary information for an HMM, such as transition probabilities,
    initial state probabilities, and so on."""

    def __init__(self, initial_probabilities, transition_probabilities, observation_probabilities):
        if transition_probabilities.shape[0] != transition_probabilities.shape[1]:
            raise Exception('Transition probability matrix must be square!')

        if initial_probabilities.shape[0] != transition_probabilities.shape[0]:
            raise Exception(
                'Number of states in initial probability matrix and transition probability matrix do not match!')

        self.num_states = initial_probabilities.shape[0]
        self.transition_probabilities = transition_probabilities
        self.initial_probabilities = initial_probabilities
        self.observation_probabilities = observation_probabilities

    def evaluate(self, observations):
        """Runs forward algorithm on given observations."""
        observation_length = len(observations)

        # rows: time, columns: states
        alpha = np.zeros([observation_length, self.num_states])

        for i in xrange(0, self.num_states):
            alpha[0, i] = self.initial_probabilities[0, i] * self.observation_probabilities[i, observations[0]]

        for t in xrange(1, observation_length):
            for j in xrange(0, self.num_states):
                alpha[t, j] = alpha[t - 1] * self.transition_probabilities[:, j] * observation_probabilities[
                    j, observations[t]]

        return alpha

    def decode(self, observations):
        """Runs Viterbi algorithm on given observations to find the optimum state sequence."""
        observation_length = len(observations)

        # rows: time, columns: states
        delta = np.zeros([observation_length, self.num_states])
        phi = np.zeros([observation_length, self.num_states])

        for i in xrange(0, self.num_states):
            delta[0, i] = self.initial_probabilities[i] * self.observation_probabilities[i, observations[0]]
            phi[0, i] = 0

        for t in xrange(1, observation_length):
            for j in xrange(0, self.num_states):
                multiplication = np.multiply(delta[t - 1], self.transition_probabilities[:, j])
                phi[t, j] = np.argmax(multiplication)
                delta[t, j] = multiplication[phi[t, j]] * self.observation_probabilities[j, observations[t]]

        state_sequence = np.zeros(observation_length).astype(int)
        state_sequence[observation_length - 1] = np.argmax(delta[observation_length - 1])
        sequence_probability = delta[observation_length - 1, state_sequence[observation_length - 1]]

        for t in reversed(xrange(0, observation_length - 1)):
            state_sequence[t] = phi[t+1, state_sequence[t + 1]]
        return state_sequence, sequence_probability, delta, phi


if __name__ == '__main__':
    initial_probabilities = np.matrix('0.25 0.25 0.5')
    transition_probabilities = np.matrix('0.33 0.33 0.33; 0.33 0.33 0.33; 0.33 0.33 0.33')
    observation_probabilities = np.matrix('0.9 0.1 0.1; 0.1 0.9 0.1; 0.1 0.1 0.9')

    hmm = HMM(initial_probabilities, transition_probabilities, observation_probabilities)

    observations = np.array([0, 0, 0, 1])

    alpha = hmm.evaluate(observations)
    states, prob, delta, phi = hmm.decode(observations)

    print(alpha)
    print(states)
    print(delta)
    print(phi)

