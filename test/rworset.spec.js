/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const transmit = require('./helpers/transmit')

describe('rworset', () => {
  describe('local', () => {
    let RWORSet
    let rworset
    it('type can be created', () => {
      RWORSet = CRDT('rworset')
    })

    it('can be instantiated', () => {
      rworset = RWORSet('id1')
    })

    it('starts empty', () => {
      expect(rworset.value().size).to.equal(0)
    })

    it('can add element', () => {
      rworset.add('a')
    })

    it('and the value is inserted', () => {
      expect(Array.from(rworset.value())).to.deep.equal(['a'])
    })

    it('can remove element', () => {
      rworset.remove('a')
    })

    it('is now empty', () => {
      expect(rworset.value().size).to.equal(0)
    })
  })

  describe('together', () => {
    let RWORSet = CRDT('rworset')

    let replica1, replica2
    let deltas = [[], []]
    before(() => {
      replica1 = RWORSet('id1')
      replica2 = RWORSet('id2')
    })

    it('elements can be added', () => {
      deltas[0].push(replica1.add('a'))
      deltas[0].push(replica1.add('b'))
      deltas[0].push(replica1.remove('b'))
      deltas[0].push(replica1.add('c'))
      deltas[1].push(replica2.add('a'))
      deltas[1].push(replica2.remove('a'))
      deltas[1].push(replica2.add('b'))
      deltas[1].push(replica2.add('d'))
      deltas[1].push(replica2.add('e'))
    })

    it('has local values', () => {
      expect(Array.from(replica1.value()).sort()).to.deep.equal(['a', 'c'])
      expect(Array.from(replica2.value()).sort()).to.deep.equal(['b', 'd', 'e'])
    })

    it('changes can be raw joined', () => {
      const state = RWORSet('joiner').join(transmit(replica1.state()), transmit(replica2.state()))
      const replica = RWORSet('replica')
      replica.apply(state)
      expect(Array.from(replica.value()).sort()).to.deep.equal(['c', 'd', 'e'])
    })

    it('changes from one can be joined to the other', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
    })

    it('and vice versa', () => {
      deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
    })

    it('the first converges', () => {
      expect(Array.from(replica1.value()).sort()).to.deep.equal(['c', 'd', 'e'])
    })
    it('and the second also converges', () => {
      expect(Array.from(replica2.value()).sort()).to.deep.equal(['c', 'd', 'e'])
    })
  })
})
