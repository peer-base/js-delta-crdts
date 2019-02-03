/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const transmit = require('./helpers/transmit')

describe('dwflag', () => {
  describe('local', () => {
    let DWFlag
    let dwflag
    it('type can be created', () => {
      DWFlag = CRDT('dwflag')
    })

    it('can be instantiated', () => {
      dwflag = DWFlag('id1')
    })

    it('starts true', () => {
      expect(dwflag.value()).to.equal(true)
    })

    it('can enable', () => {
      dwflag.enable()
    })

    it('and the value is true', () => {
      expect(dwflag.value()).to.equal(true)
    })
  })

  describe('together', () => {
    let DWFlag = CRDT('dwflag')

    let replica1, replica2
    let deltas = [[], []]
    before(() => {
      replica1 = DWFlag('id1')
      replica2 = DWFlag('id2')
    })

    it('values can be written concurrently', () => {
      deltas[0].push(replica1.enable())
      deltas[0].push(replica1.disable())
      deltas[1].push(replica2.disable())
      deltas[1].push(replica2.enable())
    })

    it('has local values', () => {
      expect(replica1.value()).to.equal(false)
      expect(replica2.value()).to.equal(true)
    })

    it('changes can be raw joined', () => {
      const state = DWFlag('joiner').join(transmit(replica1.state()), transmit(replica2.state()))
      const replica = DWFlag('replica')
      replica.apply(state)
      expect(replica.value()).to.equal(false)
    })

    it('changes from one can be joined to the other', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
    })

    it('and vice versa', () => {
      deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
    })

    it('the first converges', () => {
      expect(replica1.value()).to.equal(false)
    })

    it('and the second also converges', () => {
      expect(replica2.value()).to.equal(false)
    })
  })
})
