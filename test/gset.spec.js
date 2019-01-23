/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const transmit = require('./helpers/transmit')

describe('gset', () => {
  describe('local', () => {
    let GSet
    let gset
    it('type can be created', () => {
      GSet = CRDT('gset')
    })

    it('can be instantiated', () => {
      gset = GSet('id1')
    })

    it('starts empty', () => {
      expect(gset.value().size).to.equal(0)
    })

    it('can add element', (done) => {
      gset.once('change', (change) => {
        expect(change.add).to.equal('a')
        done()
      })
      gset.add('a')
    })

    it('and the value is inserted', () => {
      expect(Array.from(gset.value())).to.deep.equal(['a'])
    })
  })

  describe('together', () => {
    let GSet = CRDT('gset')

    let replica1, replica2
    let deltas = [[], []]
    const expectedChanges = {
      id1: [{ add: 'a' }, { add: 'b' }, { add: 'c' }, { add: 'd' }, { add: 'e' }],
      id2: [{ add: 'a' }, { add: 'd' }, { add: 'e' }, { add: 'b' }, { add: 'c' }]
    }
    before(() => {
      replica1 = GSet('id1')
      replica2 = GSet('id2')

      replica1.on('change', (change) => {
        expect(change).to.deep.equal(expectedChanges.id1.shift())
      })

      replica2.on('change', (change) => {
        expect(change).to.deep.equal(expectedChanges.id2.shift())
      })
    })

    it('elements can be added', () => {
      deltas[0].push(replica1.add('a'))
      deltas[0].push(replica1.add('b'))
      deltas[0].push(replica1.add('c'))
      deltas[1].push(replica2.add('a'))
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
      expect(Array.from(replica1.value()).sort()).to.deep.equal(['a', 'b', 'c', 'd', 'e'])
    })
    it('and the second also converges', () => {
      expect(Array.from(replica2.value()).sort()).to.deep.equal(['a', 'b', 'c', 'd', 'e'])
    })
    it('changes were as expected', () => {
      expect(expectedChanges.id1.length).to.equal(0)
      expect(expectedChanges.id2.length).to.equal(0)
    })
  })
})
