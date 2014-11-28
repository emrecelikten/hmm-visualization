__author__ = 'emre'

import unittest
from hmm import *
import sklearn.hmm
import random


def generate_observations(num_classes):
    size = random.randint(5, 30)

    observations = np.empty(size).astype(int)
    for t in xrange(size):
        observations[t] = random.randint(0, num_classes - 1)

    return observations


class MyTest(unittest.TestCase):
    def test(self):
        states = [0, 1, 2]

        initial_probabilities = np.array([0.5, 0.3, 0.2])

        transition_probabilities = np.array([
            [0.7, 0.2, 0.1],
            [0.2, 0.6, 0.2],
            [0.1, 0.4, 0.5]
        ])

        observation_probabilities = np.array([
            [0.6, 0.2, 0.1, 0.05, 0.05, 0.0],
            [0.05, 0.1, 0.2, 0.6, 0.05, 0.0],
            [0.0, 0.0, 0.1, 0.1, 0.2, 0.6],
        ])

        model = sklearn.hmm.MultinomialHMM(n_components=len(states))

        model._set_startprob(initial_probabilities)
        model._set_transmat(transition_probabilities)
        model._set_emissionprob(observation_probabilities)

        hmm = HMM(initial_probabilities, transition_probabilities, observation_probabilities)

        # Run 10000 test cases with random observations
        for test_num in xrange(10000):
            observations = generate_observations(6)

            sklearn_probability, sklearn_states = model.decode(observations, algorithm='viterbi')
            sklearn_probability = np.exp(sklearn_probability)
            own_states, probability, delta, phi = hmm.decode(observations)

            # print(own_states)

            self.assertEqual(sklearn_states.all(), own_states.all(),
                             'States do not match:\n%s\n%s\nDelta:\n%s\nPhi:\n%s' % (
                             sklearn_states, own_states, delta, phi))

            self.assertAlmostEqual(sklearn_probability, probability,
                                   msg='Probability does not match: %g != %g' % (sklearn_probability, probability),
                                   delta=1e-6)