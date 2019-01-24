/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')
const Network = require('./helpers/network')

const MAX_REPLICAS = 10
const MAX_OPS_PER_REPLICA = 100

describe('rga hard', function () {
  this.timeout(120000)

  let RGA
  let replicas = new Set()
  let network

  before(() => {
    RGA = CRDT('rga')
    network = Network({ maxDelay: 50 })

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
        let monotonic = MAX_OPS_PER_REPLICA
        for (let i = 0; i < MAX_OPS_PER_REPLICA; i++) {
          const arr = replica.value()
          let delta
          const remove = arr.length && (Math.random() >= 0.5)
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
            const value = replica.id + '/' + (++monotonic)
            insertedValues.push(value)
            delta = replica.insertAt(index, value)
            arr.splice(index, 0, value)
            const newArray = replica.value()
            try {
              expect(newArray).to.deep.equal(arr)
            } catch (err) {
              console.error(`expected ${value} to be at pos ${index} and it was at pos ${newArray.indexOf(value)}`)
              throw err
            }
            network.pushDelta(replica, delta)
          }
        }
      }

      await network.deplete()
    })

    it('all converges', () => {
      let expectedValue
      for (let replica of replicas) {
        const value = replica.value()
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
