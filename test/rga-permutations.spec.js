/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const Combinations = require('allcombinations')
const transmit = require('./helpers/transmit')

const CRDT = require('../')

const OP_COUNT_PER_NODE = 10
const MAX_ANALYZED = 10000

describe('rga permutations', function () {
  this.timeout(200000)
  let RGA
  let combinations
  let expectedResult

  before(() => {
    RGA = CRDT('rga')
    const deltas = []
    const r1 = RGA('id1')
    const r2 = RGA('id2')
    for (let i = 0; i < OP_COUNT_PER_NODE; i++) {
      deltas.push(r1.push('1-' + i))
      deltas.push(r1.push('2-' + i))
    }
    for (let delta of deltas) {
      r2.apply(delta)
    }

    expectedResult = r2.value()
    expect(r2.value().length).to.equal(OP_COUNT_PER_NODE * 2)
    combinations = Combinations(deltas)
  })

  it('all combinations lead to the same result', () => {
    let iterations = 0
    for (let deltas of combinations) {
      const r = RGA('id3')
      for (let delta of deltas) {
        r.apply(transmit(delta))
      }

      expect(r.value()).to.deep.equal(expectedResult)

      if (++iterations === MAX_ANALYZED) {
        break
      }
    }
  })
})
