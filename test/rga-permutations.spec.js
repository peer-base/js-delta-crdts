/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const Combinations = require('allcombinations')
const shuffle = require('shuffle-array')
const delay = require('delay')
const transmit = require('./helpers/transmit')

const CRDT = require('../')
const RGA = CRDT('rga')

const MAX_ITERATIONS = 5
const OP_COUNT_PER_NODE = 10
const MAX_ANALYZED_PERMUTATIONS = 1000

describe('rga permutations', function () {
  this.timeout(200000)

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    describe(`iteration ${iteration}`, () => {
      let replicas
      let allDeltas = []
      let length = 0

      before(() => {
        replicas = [ RGA('id1'), RGA('id2'), RGA('id3') ]
      })

      describe(`push mutations (${iteration + 1})`, () => {
        let combinations
        let expectedResult
        let newDeltas

        before(() => {
          const { deltas, expectedResult: _expectedResult } = pushMutations(replicas)
          newDeltas = deltas
          expectedResult = _expectedResult
          expect(expectedResult.length).to.equal(length + OP_COUNT_PER_NODE * replicas.length)
          length = expectedResult.length
          combinations = Combinations(shuffle(deltas))
        })

        after(() => {
          allDeltas = allDeltas.concat(newDeltas)
        })

        it('all combinations lead to the same result', async () => {
          let iterations = 0
          for (let deltas of combinations) {
            const r = RGA('read')
            for (let delta of deltas) {
              r.apply(transmit(delta))
            }

            expect(r.value()).to.deep.equal(expectedResult)

            if (++iterations === MAX_ANALYZED_PERMUTATIONS) {
              break
            }

            await delay(0)
          }
        })
      })

      describe('random mutations', () => {
        let combinations
        let newDeltas
        let expectedResult

        before(() => {
          const { deltas, expectedResult: _expectedResult } = randomMutations(replicas, iteration)
          newDeltas = deltas
          expectedResult = _expectedResult
          const r = RGA('read')
          for (let delta of allDeltas) {
            r.apply(transmit(delta))
          }
          for (let delta of deltas) {
            r.apply(transmit(delta))
          }
          expect(r.value()).to.deep.equal(expectedResult)
          length = expectedResult.length

          combinations = Combinations(shuffle(deltas))
        })

        after(() => {
          allDeltas = allDeltas.concat(newDeltas)
        })

        it('all mutation combinations lead to the same result', async () => {
          let iterations = 0
          for (let deltas of combinations) {
            const r = RGA('read')
            for (let delta of allDeltas) {
              r.apply(transmit(delta))
            }

            for (let delta of deltas) {
              r.apply(transmit(delta))
            }

            expect(r.value()).to.deep.equal(expectedResult)

            if (++iterations === MAX_ANALYZED_PERMUTATIONS) {
              break
            }

            await delay(0)
          }
        })
      })
    })
  }
})

function pushMutations (replicas) {
  const deltas = []
  replicas.forEach((replica, replicaIndex) => {
    for (let i = 0; i < OP_COUNT_PER_NODE; i++) {
      deltas.push(replica.push(`${replicaIndex}-${i}`))
    }
  })
  for (let delta of deltas) {
    replicas.forEach((replica) => {
      replica.apply(transmit(delta))
    })
  }

  let expectedResult

  for (let replica of replicas) {
    if (!expectedResult) {
      expectedResult = replica.value()
    } else {
      expect(replica.value()).to.deep.equal(expectedResult)
    }
  }

  return { deltas, expectedResult }
}

function randomMutations (replicas, iteration) {
  const deltas = []
  for (let i = 0; i < OP_COUNT_PER_NODE; i++) {
    replicas.forEach((replica, replicaIndex) => {
      let len = replica.value().length
      let index = Math.floor(Math.random() * len)
      deltas.push(replica.removeAt(index))

      len = replica.value().length
      index = Math.floor(Math.random() * len)
      deltas.push(replica.insertAt(index, `${replicaIndex}-${iteration}-${i}`))
    })
  }

  for (let delta of deltas) {
    for (let replica of replicas) {
      replica.apply(transmit(delta))
    }
  }

  let expectedResult
  for (let replica of replicas) {
    const value = replica.value()
    if (!expectedResult) {
      expectedResult = value
    } else {
      expect(value).to.deep.equal(expectedResult)
    }
  }

  return { deltas, expectedResult }
}
