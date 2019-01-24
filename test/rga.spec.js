/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const transmit = require('./helpers/transmit')

const SMALL_BIT = 500

describe('rga', () => {
  describe('local', () => {
    let RGA
    let rga
    it('type can be created', () => {
      RGA = CRDT('rga')
    })

    it('can be instantiated', () => {
      rga = RGA('id1')
    })

    it('starts empty', () => {
      expect(rga.value()).to.be.empty()
    })

    it('adds to the right value', () => {
      rga.addRight(null, 'a')
    })

    it('and the value is inserted', () => {
      expect(rga.value()).to.deep.equal(['a'])
    })

    it('pushes', () => {
      rga.push('b')
    })

    it('and the second value is inserted', () => {
      expect(rga.value()).to.deep.equal(['a', 'b'])
    })

    it('can insert at correct spot after deleted sequence', () => {
      expect(rga.value()).to.deep.equal(['a', 'b'])
      rga.push('c')
      expect(rga.value()).to.deep.equal(['a', 'b', 'c'])
      rga.push('d')
      expect(rga.value()).to.deep.equal(['a', 'b', 'c', 'd'])
      rga.removeAt(1)
      expect(rga.value()).to.deep.equal(['a', 'c', 'd'])
      rga.removeAt(1)
      expect(rga.value()).to.deep.equal(['a', 'd'])
      rga.insertAt(2, 'e')
      expect(rga.value()).to.deep.equal(['a', 'd', 'e'])
    })
  })

  describe('together', () => {
    let RGA = CRDT('rga')

    let replica1, replica2
    let deltas = [[], []]
    before(() => {
      replica1 = RGA('id1')
      replica2 = RGA('id2')
    })

    it('values can be written concurrently', () => {
      deltas[0].push(replica1.push('a'))
      deltas[0].push(replica1.push('b'))
      expect(replica1.value()).to.deep.equal(['a', 'b'])
      deltas[1].push(replica2.push('c'))
      deltas[1].push(replica2.push('d'))
      expect(replica2.value()).to.deep.equal(['c', 'd'])
    })

    it('waits a small bit', (done) => setTimeout(done, SMALL_BIT))

    it('the first converges', () => {
      replica1.apply(transmit(deltas[1][0]))
      expect(replica1.value()).to.deep.equal(['c', 'a', 'b'])
      replica1.apply(transmit(deltas[1][1]))
      expect(replica1.value()).to.deep.equal(['c', 'd', 'a', 'b'])
    })

    it('the first can handle having the same deltas applied', () => {
      deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
      expect(replica1.value()).to.deep.equal(['c', 'd', 'a', 'b'])
    })

    it('the first can handle having its own deltas reapplied', () => {
      deltas[0].forEach((delta) => replica1.apply(transmit(delta)))
      expect(replica1.value()).to.deep.equal(['c', 'd', 'a', 'b'])
    })

    it('the first can handle having its own state reapplied', () => {
      deltas[0].forEach((delta) => replica1.apply(transmit(replica1.state())))
      expect(replica1.value()).to.deep.equal(['c', 'd', 'a', 'b'])
    })

    it('and the second also converges', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
      expect(replica2.value()).to.deep.equal(['c', 'd', 'a', 'b'])
    })

    it('values can be deleted concurrently', () => {
      deltas = [[], []]
      deltas[0].push(replica1.removeAt(1))
      expect(replica1.value()).to.deep.equal(['c', 'a', 'b'])
      deltas[1].push(replica2.removeAt(2))
      expect(replica2.value()).to.deep.equal(['c', 'd', 'b'])
    })

    it('the first converges (2)', () => {
      replica1.apply(transmit(deltas[1][0]))
      expect(replica1.value()).to.deep.equal(['c', 'b'])
    })

    it('and the second also converges (2)', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
      expect(replica2.value()).to.deep.equal(['c', 'b'])
    })

    it('values can be further added concurrently', () => {
      deltas = [[], []]
      deltas[0].push(replica1.push('e'))
      deltas[0].push(replica1.push('f'))
      deltas[1].push(replica2.push('g'))
      deltas[1].push(replica2.push('h'))
    })

    it('the first converges (3)', () => {
      deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
      expect(replica1.value()).to.deep.equal([ 'c', 'b', 'g', 'h', 'e', 'f' ])
    })

    it('and the second also converges (3)', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
      expect(replica2.value()).to.deep.equal([ 'c', 'b', 'g', 'h', 'e', 'f' ])
    })

    it('waits a small bit (2)', (done) => setTimeout(done, SMALL_BIT))

    it('values can be inserted concurrently', () => {
      deltas = [[], []]
      deltas[0].push(replica1.insertAllAt(3, ['g.1']))
      expect(replica1.value()).to.deep.equal([ 'c', 'b', 'g', 'g.1', 'h', 'e', 'f' ])
      deltas[1].push(replica2.insertAt(3, 'g.2'))
    })

    it('the first converges (4)', () => {
      deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
      expect(replica1.value()).to.deep.equal([ 'c', 'b', 'g', 'g.2', 'g.1', 'h', 'e', 'f' ])
    })

    it('and the second also converges (4)', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
      expect(replica2.value()).to.deep.equal([ 'c', 'b', 'g', 'g.2', 'g.1', 'h', 'e', 'f' ])
    })

    it('can update at', () => {
      replica2.apply(replica1.updateAt(1, 'B'))
      expect(replica1.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f'])
      expect(replica2.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f'])
    })

    it('waits a small bit (3)', (done) => setTimeout(done, SMALL_BIT))

    it('can join 2 deltas', async () => {
      const deltaBuffer1 = [replica1.push('k'), replica1.push('l')]
      const deltaBuffer2 = [replica2.push('m'), replica2.push('n')]
      expect(replica1.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'k', 'l'])
      expect(replica2.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'm', 'n'])
      const deltas1 = replica1.join(deltaBuffer1[0], deltaBuffer1[1])
      const deltas2 = replica2.join(deltaBuffer2[0], deltaBuffer2[1])
      replica2.apply(transmit(deltas1))
      replica1.apply(transmit(deltas2))
      expect(replica1.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'm', 'n', 'k', 'l'])
      expect(replica2.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'm', 'n', 'k', 'l'])
    })

    it('can handle having the state joined with itself', () => {
      replica1.apply(transmit(replica1.state()))
      expect(replica1.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'm', 'n', 'k', 'l'])
      replica1.apply(transmit(replica2.state()))
      expect(replica1.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'm', 'n', 'k', 'l'])
    })

    it('can insert multiple', () => {
      replica1.insertAllAt(1, ['X', 'Y', 'Z'])
      expect(replica1.value()).to.deep.equal(['c', 'X', 'Y', 'Z', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'm', 'n', 'k', 'l'])
    })
  })

  describe('crdt ids', () => {
    let RGA = CRDT('rga')

    it('using Buffer for CRDT ids gives consistent order', () => {
      const replica1 = RGA(Buffer.from('a'))
      const replica2 = RGA(Buffer.from('b'))
      const deltaA = replica1.push('a')
      replica2.push('b')
      replica2.apply(deltaA)
      expect(replica2.value()).to.deep.equal(['b', 'a'])
      const replica3 = RGA(Buffer.from('d'))
      const replica4 = RGA(Buffer.from('c'))
      replica3.push('d')
      const deltaD = replica4.push('c')
      replica3.apply(deltaD)
      expect(replica3.value()).to.deep.equal(['d', 'c'])
    })
  })

  describe('missing state', () => {
    let RGA = CRDT('rga')

    let replica1, replica2, replica3
    let state1, state2, delta3, delta4
    before(() => {
      replica1 = RGA('id1')
      replica1.push('a')
      replica1.push('b')
      replica1.push('c')
      state1 = replica1.state()
      replica2 = RGA('id2')
      replica2.push('d')
      replica2.push('e')
      replica2.push('f')
      state2 = replica2.state()
      replica3 = RGA('id3')
      replica3.apply(state1)
      replica3.apply(state2)
      delta3 = replica3.insertAt(3, 'X')
      delta4 = replica3.push('Y')
    })

    it('states and deltas apply in original order', () => {
      const replica = RGA('id')
      replica.apply(state1)
      replica.apply(state2)
      replica.apply(delta3)
      replica.apply(delta4)
      expect(replica.value().join('')).to.equal('defXabcY')
    })

    it('states and deltas apply in modified order', () => {
      const replica = RGA('id')
      replica.apply(state2)
      replica.apply(state1)
      replica.apply(delta4)
      replica.apply(delta3)
      expect(replica.value().join('')).to.equal('defXabcY')
    })

    it('states and deltas apply, delta early', () => {
      const replica = RGA('id')
      replica.apply(state2)
      replica.apply(delta3)
      replica.apply(state1)
      replica.apply(delta4)
      expect(replica.value().join('')).to.equal('defXabcY')
    })
  })
})
