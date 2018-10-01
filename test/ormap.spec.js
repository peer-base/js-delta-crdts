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

  describe('together', () => {
    let ORMap = CRDT('ormap')

    let replica1, replica2
    let deltas = [[], []]
    before(() => {
      replica1 = ORMap('id1')
      replica2 = ORMap('id2')
    })

    it('values can be written concurrently', () => {
      deltas[0].push(replica1.applySub('a', 'mvreg', 'write', 'A'))
      deltas[0].push(replica1.applySub('b', 'mvreg', 'write', 'B'))
      deltas[0].push(replica1.applySub('c', 'mvreg', 'write', 'C'))
      deltas[1].push(replica2.applySub('a', 'mvreg', 'write', 'a'))
      deltas[1].push(replica2.applySub('b', 'mvreg', 'write', 'b'))
      deltas[1].push(replica2.applySub('c', 'mvreg', 'write', 'c'))
    })

    it('each replica has its own values', () => {
      expect(replica1.value()).to.deep.equal({a: new Set(['A']), b: new Set(['B']), c: new Set(['C'])})
    })

    it('the first converges', () => {
      deltas[1].forEach((delta) => replica1.apply(delta))
      expect(replica1.value()).to.deep.equal({
        a: new Set(['a', 'A']),
        b: new Set(['b', 'B']),
        c: new Set(['c', 'C'])})
    })

    it('the second converges', () => {
      deltas[0].forEach((delta) => replica2.apply(delta))
      expect(replica2.value()).to.deep.equal({
        a: new Set(['a', 'A']),
        b: new Set(['b', 'B']),
        c: new Set(['c', 'C'])})
    })
  })
})
