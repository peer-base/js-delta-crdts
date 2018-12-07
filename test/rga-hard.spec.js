/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const Network = require('./helpers/network')

const MAX_REPLICAS = 2
const MAX_OPS_PER_REPLICA = 10

describe('rga hard', function () {
  this.timeout(30000)

  let RGA
  let replicas = new Set()
  let network

  before(() => {
    RGA = CRDT('rga')
    network = Network()

    for (let i = 0; i < MAX_REPLICAS; i++) {
      const replica = RGA(String(i))
      replicas.add(replica)
      network.add(replica)
    }
  })

  describe('push', () => {
    let expectedSortedValue = []
    let expectedValue

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
    })

    it('all converges', () => {
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

  describe('insertAt and removeAt', () => {
    let removedValues = new Set()
    let insertedValues = []

    it('makes assorted changes', async () => {
      for (let replica of replicas) {
        for (let i = 0; i < MAX_OPS_PER_REPLICA; i ++) {
          const arr = replica.value()
          if (!arr.length) {
            break
          }
          let delta
          const remove = true // (Math.random() >= 0.5)
          if (remove) {
            // removeAt
            const index = Math.floor(Math.random() * arr.length)
            const value = arr[index]
            removedValues.add(value)
            delta = replica.removeAt(index)
            arr.splice(index, 1)
            expect(replica.value()).to.deep.equal(arr)
            network.pushDelta(replica, delta)
          } else {
            // insertAt
            const index = Math.floor(Math.random() * arr.length)
            const value = replica.id + '/' + arr.length
            insertedValues.push(value)
            delta = replica.insertAt(index, value)
            arr.splice(index, 0, value)
            expect(replica.value()).to.deep.equal(arr)
            network.pushDelta(replica, delta)
          }
        }
      }

      await network.deplete()

      console.log('REMOVEDS:', [...removedValues])
    })

    it('all converges', () => {
      let expectedValue
      for (let replica of replicas) {
        const value = replica.value()
        console.log('VALUE:', value)
        expect(value.length).to.equal(
          MAX_REPLICAS * MAX_OPS_PER_REPLICA + insertedValues.length - removedValues.size)
        if (!expectedValue) {
          expectedValue = value
        } else {
          expect(value).to.deep.equal(expectedValue)
        }
      }
    })
  })
})
