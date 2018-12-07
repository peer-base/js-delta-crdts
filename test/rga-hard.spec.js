/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const Network = require('./helpers/network')

const MAX_REPLICAS = 10
const MAX_OPS_PER_REPLICA = 10

describe('rga hard', function () {
  this.timeout(30000)

  let RGA
  let replicas = new Set()
  let network
  let expectedSortedValue = []

  before(() => {
    RGA = CRDT('rga')
    network = Network()

    for (let i = 0; i < MAX_REPLICAS; i++) {
      const replica = RGA(String(i))
      replicas.add(replica)
      network.add(replica)
    }
  })

  it('creates a bunch of push operations', async () => {
    [...replicas].forEach((replica) => {
      for (let i = 0; i < MAX_OPS_PER_REPLICA; i++) {
        const newValue = replica.id + '/' + i
        expectedSortedValue.push(newValue)
        const delta = replica.push(newValue)
        network.pushDelta(replica, delta)
      }
    })

    await network.deplete()

    expectedSortedValue = expectedSortedValue.sort()
    console.log('expectedSortedValue:', expectedSortedValue)
  })

  it('all converges', () => {
    let expectedValue
    for (let replica of replicas) {
      const value = replica.value()
      expect(value.length).to.equal(MAX_REPLICAS * MAX_OPS_PER_REPLICA)
      if (!expectedValue) {
        expectedValue = value
      } else {
        expect(value).to.deep.equal(expectedValue)
      }

      expect([...value].sort()).to.deep.equal(expectedSortedValue)
    }
  })
})
