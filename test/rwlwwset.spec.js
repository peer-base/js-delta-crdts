/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const transmit = require('./helpers/transmit')

describe('rwlwwset', () => {
  describe('local', () => {
    let RWLWWSet
    let rwlwwset
    it('type can be created', () => {
      RWLWWSet = CRDT('rwlwwset')
    })

    it('can be instantiated', () => {
      rwlwwset = RWLWWSet('id1')
    })

    it('starts empty', () => {
      expect(rwlwwset.value().size).to.equal(0)
    })

    it('can add element', () => {
      rwlwwset.add(1, 'a')
    })

    it('and the value is inserted', () => {
      expect(Array.from(rwlwwset.value())).to.deep.equal(['a'])
    })

    it('can remove element', () => {
      rwlwwset.remove(2, 'a')
    })

    it('is now empty', () => {
      expect(rwlwwset.value().size).to.equal(0)
    })
  })

  describe('together', () => {
    let RWLWWSet = CRDT('rwlwwset')

    let replica1, replica2
    let deltas = [[], []]
    before(() => {
      replica1 = RWLWWSet('id1')
      replica2 = RWLWWSet('id2')
    })

    it('elements can be added', () => {
      deltas[0].push(replica1.add(1, 'a'))
      deltas[0].push(replica1.add(2, 'b'))
      deltas[0].push(replica1.remove(3, 'b'))
      deltas[0].push(replica1.add(4, 'c'))
      deltas[1].push(replica2.add(1, 'a'))
      deltas[1].push(replica2.remove(2, 'a'))
      deltas[1].push(replica2.add(3, 'b'))
      deltas[1].push(replica2.add(5, 'd'))
      deltas[1].push(replica2.add(6, 'e'))
    })

    it('has local values', () => {
      expect(Array.from(replica1.value()).sort()).to.deep.equal(['a', 'c'])
      expect(Array.from(replica2.value()).sort()).to.deep.equal(['b', 'd', 'e'])
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
