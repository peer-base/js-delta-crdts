/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const transmit = require('./helpers/transmit')

describe('lwwreg', () => {
  describe('local', () => {
    let LWWReg
    let lwwreg
    it('type can be created', () => {
      LWWReg = CRDT('lwwreg')
    })

    it('can be instantiated', () => {
      lwwreg = LWWReg('id1')
    })

    it('starts empty', () => {
      expect(lwwreg.value()).to.not.exist()
    })

    it('can write value', () => {
      lwwreg.write(1, 'a')
      lwwreg.write(2, 'b')
    })

    it('and the value is inserted', () => {
      expect(lwwreg.value()).to.deep.equal('b')
    })
  })

  describe('together', () => {
    let LWWReg = CRDT('lwwreg')

    let replica1, replica2
    let deltas = [[], []]
    before(() => {
      replica1 = LWWReg('id1')
      replica2 = LWWReg('id2')
    })

    it('values can be written concurrently', () => {
      deltas[0].push(replica1.write(0, 'a'))
      deltas[0].push(replica1.write(1, 'b'))
      deltas[1].push(replica2.write(0, 'c'))
      deltas[1].push(replica2.write(1, 'd'))
    })

    it('has local values', () => {
      expect(replica1.value()).to.deep.equal('b')
      expect(replica2.value()).to.deep.equal('d')
    })

    it('changes from one can be joined to the other', () => {
      deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
    })

    it('and vice versa', () => {
      deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
    })

    it('the first converges', () => {
      expect(replica1.value()).to.deep.equal('d')
    })

    it('and the second also converges', () => {
      expect(replica2.value()).to.deep.equal('d')
    })
  })
})
