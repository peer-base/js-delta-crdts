/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')

describe('ormap', () => {
  describe('local', () => {
    let ORMap
    let ormap
    it('type can be created', () => {
      ORMap = CRDT('ormap')
    })

    it('can be instantiated', () => {
      ormap = ORMap('id1')
    })

    it('starts empty', () => {
      expect(ormap.value()).to.deep.equal({})
    })

    it('can apply a causal CRDT', () => {
      ormap.applySub('a', 'ccounter', 'inc', 2)
    })

    it('can get value', () => {
      expect(ormap.value()).to.deep.equal({a: 2})
    })

    it('can apply a causal CRDT', () => {
      ormap.applySub('a', 'ccounter', 'inc')
    })

    it('can get value', () => {
      expect(ormap.value()).to.deep.equal({a: 3})
    })
  })

  describe.skip('together', () => {
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
      deltas[1].push(replica2.push('c'))
      deltas[1].push(replica2.push('d'))
    })

    it('the first converges', () => {
      deltas[1].forEach((delta) => replica1.apply(delta))
      expect(replica1.value()).to.deep.equal(['c', 'd', 'a', 'b'])
    })

    it('and the second also converges', () => {
      deltas[0].forEach((delta) => replica2.apply(delta))
      expect(replica2.value()).to.deep.equal(['c', 'd', 'a', 'b'])
    })

    it('values can be deleted concurrently', () => {
      deltas = [[], []]
      deltas[0].push(replica1.removeAt(1))
      deltas[1].push(replica2.removeAt(2))
    })

    it('the first converges', () => {
      deltas[1].forEach((delta) => replica1.apply(delta))
      expect(replica1.value()).to.deep.equal(['c', 'b'])
    })

    it('and the second also converges', () => {
      deltas[0].forEach((delta) => replica2.apply(delta))
      expect(replica2.value()).to.deep.equal(['c', 'b'])
    })

    it('values can be further added concurrently', () => {
      deltas = [[], []]
      deltas[0].push(replica1.push('e'))
      deltas[0].push(replica1.push('f'))
      deltas[1].push(replica2.push('g'))
      deltas[1].push(replica2.push('h'))
    })

    it('the first converges', () => {
      deltas[1].forEach((delta) => replica1.apply(delta))
      expect(replica1.value()).to.deep.equal(['c', 'b', 'g', 'h', 'e', 'f'])
    })

    it('and the second also converges', () => {
      deltas[0].forEach((delta) => replica2.apply(delta))
      expect(replica2.value()).to.deep.equal(['c', 'b', 'g', 'h', 'e', 'f'])
    })

    it('values can be inserted concurrently', () => {
      deltas = [[], []]
      deltas[0].push(replica1.insertAllAt(3, ['g.1']))
      deltas[1].push(replica2.insertAt(3, 'g.2'))
    })

    it('the first converges', () => {
      deltas[1].forEach((delta) => replica1.apply(delta))
      expect(replica1.value()).to.deep.equal(['c', 'b', 'g', 'g.2', 'g.1', 'h', 'e', 'f'])
    })

    it('and the second also converges', () => {
      deltas[0].forEach((delta) => replica2.apply(delta))
      expect(replica2.value()).to.deep.equal(['c', 'b', 'g', 'g.2', 'g.1', 'h', 'e', 'f'])
    })

    it('can update at', () => {
      replica2.apply(replica1.updateAt(1, 'B'))
      expect(replica1.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f'])
      expect(replica2.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f'])
    })

    it('can join 2 deltas', () => {
      const deltaBuffer1 = [replica1.push('k'), replica1.push('l')]
      const deltaBuffer2 = [replica2.push('m'), replica2.push('n')]
      expect(replica1.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'k', 'l'])
      expect(replica2.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'm', 'n'])
      const deltas1 = replica1.join(deltaBuffer1[0], deltaBuffer1[1])
      const deltas2 = replica2.join(deltaBuffer2[0], deltaBuffer2[1])
      replica2.apply(deltas1)
      replica1.apply(deltas2)
      expect(replica1.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'm', 'n', 'k', 'l'])
      expect(replica2.value()).to.deep.equal(['c', 'B', 'g', 'g.2', 'g.1', 'h', 'e', 'f', 'm', 'n', 'k', 'l'])
    })
  })
})
