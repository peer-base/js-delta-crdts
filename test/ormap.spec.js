/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const transmit = require('./transmit')

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

    it('can remove', () => {
      ormap.remove('a')
    })

    it('can get value', () => {
      expect(ormap.value()).to.deep.equal({})
    })

    it('supports embedding a non-causal CRDT', () => {
      ormap.applySub('b', 'gset', 'add', 'B')
    })

    it('can get value', () => {
      expect(ormap.value()).to.deep.equal({b: new Set(['B'])})
    })

    it('can embed ormap', () => {
      const rreplica = ORMap('id1')
      rreplica.applySub('om', 'ormap', 'applySub', 'a', 'lwwreg', 'write', 1 ,'A1')
      rreplica.applySub('om', 'ormap', 'applySub', 'b', 'lwwreg', 'write', 2 ,'A1')
      rreplica.applySub('om2', 'ormap', 'applySub', 'a2', 'lwwreg', 'write', 2 ,'A2')
      expect(rreplica.value().om.a).to.deep.equal('A1')
      expect(rreplica.value().om.b).to.deep.equal('A1')
      expect(rreplica.value().om2.a2).to.deep.equal('A2')
      rreplica.applySub('om', 'ormap', 'remove', 'a')
      rreplica.remove('om2');
      expect(rreplica.value()).to.deep.equal({om:{b: 'A1'}})
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
      deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
      expect(replica1.value()).to.deep.equal({
        a: new Set(['a', 'A']),
        b: new Set(['b', 'B']),
        c: new Set(['c', 'C'])})
    })

    it('the second converges', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
      expect(replica2.value()).to.deep.equal({
        a: new Set(['a', 'A']),
        b: new Set(['b', 'B']),
        c: new Set(['c', 'C'])})
    })

    it('keeps causality', () => {
      const delta = replica1.applySub('a', 'mvreg', 'write', 'AA')
      expect(replica1.value().a).to.deep.equal(new Set(['AA']))

      replica2.apply(delta)
      expect(replica2.value().a).to.deep.equal(new Set(['AA']))
    })

    it('add wins', () => {
      const delta1 = replica1.remove('b')
      expect(replica1.value().b).to.not.exist()
      const delta2 = replica2.applySub('b', 'mvreg', 'write', 'BB')
      expect(replica2.value().b).to.deep.equal(new Set(['BB']))
      replica1.apply(transmit(delta2))
      replica2.apply(transmit(delta1))
      expect(replica2.value().b).to.deep.equal(new Set(['BB']))
      expect(replica1.value().b).to.deep.equal(new Set(['BB']))
    })
  })
})
