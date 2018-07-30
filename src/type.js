'use strict'

const EventEmitter = require('events')

module.exports = (Type) => {
  return (id) => {
    const replica = Type(id)
    let state = replica.initial()
    const ret = new EventEmitter()

    const emitter = new ChangeEmitter(ret)

    Object.keys(replica.mutators || {}).forEach((mutatorName) => {
      const mutator = replica.mutators[mutatorName]
      ret[mutatorName] = (...args) => {
        const delta = mutator(state, ...args)
        state = replica.join.call(emitter, state, delta)
        emitter.emitAll()
        return delta
      }
    })

    ret.value = () => replica.value(state)

    ret.apply = (delta) => {
      state = replica.join.call(emitter, state, delta)
      emitter.emitAll()
      ret.emit('state changed', state)
      return state
    }

    ret.state = () => state

    ret.join = replica.join

    return ret
  }
}

class ChangeEmitter {
  constructor (client) {
    this._client = client
    this._events = []
  }

  changed (event) {
    this._events.push(event)
  }

  emitAll () {
    const events = this._events
    this._events = []
    events.forEach((event) => {
      this._client.emit('change', event)
    })
  }
}
