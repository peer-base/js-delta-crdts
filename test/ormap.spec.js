/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const DotSet = require('../src/dot-set')
const transmit = require('./helpers/transmit')

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
      expect(ormap.value()).to.deep.equal({ a: 2 })
    })

    it('can apply a causal CRDT again', () => {
      ormap.applySub('a', 'ccounter', 'inc')
    })

    it('can get value', () => {
      expect(ormap.value()).to.deep.equal({ a: 3 })
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
      expect(ormap.value()).to.deep.equal({ b: new Set(['B']) })
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
      expect(replica1.value()).to.deep.equal({ a: new Set(['A']), b: new Set(['B']), c: new Set(['C']) })
    })

    it('changes can be raw joined', () => {
      const state = ORMap('joiner').join(transmit(replica1.state()), transmit(replica2.state()))
      const replica = ORMap('replica')
      replica.apply(state)
      expect(replica.value()).to.deep.equal({
        a: new Set(['a', 'A']),
        b: new Set(['b', 'B']),
        c: new Set(['c', 'C']) })
    })

    it('the first converges', () => {
      deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
      expect(replica1.value()).to.deep.equal({
        a: new Set(['a', 'A']),
        b: new Set(['b', 'B']),
        c: new Set(['c', 'C']) })
    })

    it('the second converges', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
      expect(replica2.value()).to.deep.equal({
        a: new Set(['a', 'A']),
        b: new Set(['b', 'B']),
        c: new Set(['c', 'C']) })
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
      expect(replica1.state().state.get('b')).instanceof(DotSet)
    })

    it('removals are stored in state', () => {
      replica1.remove('b')
      expect(replica1.value().b).to.not.exist()
      replica2.apply(replica1.state())
      expect(replica2.value().b).to.not.exist()
    })
  })
})
