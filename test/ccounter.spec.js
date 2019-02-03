/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const transmit = require('./helpers/transmit')

describe('ccounter', () => {
  describe('local', () => {
    let CCounter
    let ccounter
    it('type can be created', () => {
      CCounter = CRDT('ccounter')
    })

    it('can be instantiated', () => {
      ccounter = CCounter('id1')
    })

    it('starts with a value of 0', () => {
      expect(ccounter.value()).to.equal(0)
    })

    it('can be incremented', () => {
      ccounter.inc()
    })

    it('and the value is incremented', () => {
      expect(ccounter.value()).to.equal(1)
    })

    it('can be decremented', () => {
      ccounter.dec()
    })

    it('and the value is decremented', () => {
      expect(ccounter.value()).to.equal(0)
    })
  })

  describe('together', () => {
    let CCounter = CRDT('ccounter')

    let replica1, replica2
    let deltas = [[], []]
    before(() => {
      replica1 = CCounter('id1')
      replica2 = CCounter('id2')
    })

    it('can be incremented', () => {
      deltas[0].push(replica1.inc(2))
      deltas[0].push(replica1.dec())
      deltas[0].push(replica1.inc(2))
      deltas[1].push(replica2.inc())
      deltas[1].push(replica2.dec())
      deltas[1].push(replica2.inc())
    })

    it('changes can be raw joined', () => {
      const state = CCounter('joiner').join(transmit(replica1.state()), transmit(replica2.state()))
      const replica = CCounter('replica')
      replica.apply(state)
      expect(replica.value()).to.equal(4)
    })

    it('changes from one can be joined to the other', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
    })

    it('and vice versa', () => {
      deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
    })

    it('the first converges', () => {
      expect(replica1.value()).to.equal(4)
    })
    it('and the second also converges', () => {
      expect(replica2.value()).to.equal(4)
    })
  })
})
