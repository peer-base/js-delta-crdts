'use strict'

const delay = require('delay')
const Queue = require('p-queue')

const transmit = require('./transmit')

const defaultOptions = {
  maxDelay: 100
}

module.exports = (_options) => {
  const options = Object.assign({}, defaultOptions, _options)
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
    return Promise.all([...replicas].map((sourceReplica) => {
      return Promise.all([...replicas].map((targetReplica) => queueFor(sourceReplica, targetReplica).onIdle()))
    }))
  }

  return {
    add,
    pushDelta,
    deplete
  }

  function pushDeltaToReplica (sourceReplica, targetReplica, _delta) {
    const delta = transmit(_delta)
    return queueFor(sourceReplica, targetReplica).add(async () => {
      await delay(randomDelay())
      return targetReplica.apply(delta)
    })
  }

  function randomDelay () {
    return Math.floor(Math.random() * options.maxDelay)
  }

  function queueFor (sourceReplica, targetReplica) {
    const queueName = sourceReplica.id + '/' + targetReplica.id
    let queue = deliverQueues.get(queueName)
    if (!queue) {
      queue = new Queue({ concurrency: 1 })
      deliverQueues.set(queueName, queue)
    }

    return queue
  }
}
