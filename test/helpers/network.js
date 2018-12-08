'use strict'

const delay = require('delay')
const Queue = require('p-queue')

const transmit = require('./transmit')

const MAX_DELAY = 100

module.exports = () => {
  const replicas = new Set()
  const deliverQueues = new Map()

  function add (replica) {
    replicas.add(replica)
  }

  function pushDelta (sourceReplica, delta) {
    for (let replica of replicas) {
      if (replica !== sourceReplica) {
        pushDeltaToReplica(sourceReplica, replica, delta)
      }
    }
  }

  function deplete () {
    return Promise.all([...replicas].map((replica) => queueFor(replica).onIdle()))
  }

  return {
    add,
    pushDelta,
    deplete
  }

  function pushDeltaToReplica (sourceReplica, targetReplica, _delta) {
    const delta = transmit(_delta)
    return queueFor(sourceReplica).add(async () => {
      await delay(randomDelay())
      return targetReplica.apply(delta)
    })
  }

  function randomDelay () {
    return Math.floor(Math.random() * MAX_DELAY)
  }

  function queueFor (replica) {
    let queue = deliverQueues.get(replica.id)
    if (!queue) {
      queue = new Queue({ concurrency: 1 })
      deliverQueues.set(replica.id, queue)
    }

    return queue
  }
}
