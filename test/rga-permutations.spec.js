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
      deltas.push(r2.push('2-' + i))
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

  it('makes random mutations', () => {
    RGA = CRDT('rga')
    const deltas = []
    const r1 = RGA('id1')
    const r2 = RGA('id2')
    for (let i = 0; i < OP_COUNT_PER_NODE; i++) {
      const d1 = r1.push('1-' + i)
      deltas.push(d1)
      r2.apply(d1)

      const d2 = r2.push('2-' + i)
      deltas.push(d2)
      r1.apply(d2)
    }
    for (let i = 0; i < OP_COUNT_PER_NODE; i++) {
      let len = r1.value().length
      let index = Math.floor(Math.random() * len)
      deltas.push(r1.removeAt(index))

      len = r1.value().length
      index = Math.floor(Math.random() * len)
      deltas.push(r1.insertAt(index, '1x-' + index))

      len = r2.value().length
      index = Math.floor(Math.random() * len)
      deltas.push(r2.removeAt(index))

      len = r2.value().length
      index = Math.floor(Math.random() * len)
      deltas.push(r2.insertAt(index, '2x-' + index))
    }

    for (let delta of deltas) {
      r1.apply(delta)
      r2.apply(delta)
    }

    expectedResult = r2.value()
    expect(r1.value()).to.deep.equal(expectedResult)

    const r3 = RGA('id3')
    for (let delta of deltas) {
      r3.apply(transmit(delta))
    }
    expect(r3.value()).to.deep.equal(expectedResult)

    combinations = Combinations(deltas)
  })

  it('all mutation combinations lead to the same result', () => {
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
