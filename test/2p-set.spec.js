/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const transmit = require('./helpers/transmit')

describe('2pset', () => {
  describe('local', () => {
    let TwoPSet
    let twopset
    it('type can be created', () => {
      TwoPSet = CRDT('2pset')
    })

    it('can be instantiated', () => {
      twopset = TwoPSet('id1')
    })

    it('starts empty', () => {
      expect(twopset.value().size).to.equal(0)
    })

    it('can add element', () => {
      twopset.add('a')
    })

    it('and the value is inserted', () => {
      expect(Array.from(twopset.value())).to.deep.equal(['a'])
    })

    it('can remove element', () => {
      twopset.remove('a')
    })

    it('is now empty', () => {
      expect(twopset.value().size).to.equal(0)
    })
  })

  describe('together', () => {
    let TwoPSet = CRDT('2pset')

    let replica1, replica2
    let deltas = [[], []]
    before(() => {
      replica1 = TwoPSet('id1')
      replica2 = TwoPSet('id2')
    })

    it('elements can be added', () => {
      deltas[0].push(replica1.add('a'))
      deltas[0].push(replica1.add('b'))
      deltas[0].push(replica1.add('c'))
      deltas[1].push(replica2.remove('a'))
      deltas[1].push(replica2.add('b'))
      deltas[1].push(replica2.add('d'))
      deltas[1].push(replica2.add('e'))
    })

    it('changes from one can be joined to the other', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
    })

    it('and vice versa', () => {
      deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
    })

    it('the first converges', () => {
      expect(Array.from(replica1.value()).sort()).to.deep.equal(['b', 'c', 'd', 'e'])
    })
    it('and the second also converges', () => {
      expect(Array.from(replica2.value()).sort()).to.deep.equal(['b', 'c', 'd', 'e'])
    })
  })
})
