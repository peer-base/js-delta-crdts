/* eslint-env mocha */
'use strict'

const ZERO = {
  initial: () => 0,
  join: (s1, s2) => 0,
  value: (state) => state
}

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')

describe('extension', () => {
  let Type, replica

  it('allows user to register extension', () => {
    CRDT.define('zero', ZERO)
  })

  it('allows to create type', () => {
    Type = CRDT('zero')
  })

  it('allows to create a replica', () => {
    replica = Type('node id')
  })

  it('replica is working', () => {
    expect(replica.value()).to.equal(0)
    replica.apply('whatever')
    expect(replica.value()).to.equal(0)
  })
})
