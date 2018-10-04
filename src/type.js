'use strict'

const EventEmitter = require('events')

module.exports = (Type) => {
  return (id) => {
    let state = Type.initial()
    const ret = new EventEmitter()
    const emitter = new ChangeEmitter(ret)

    Object.keys(Type.mutators || {}).forEach((mutatorName) => {
      const mutator = Type.mutators[mutatorName]
      ret[mutatorName] = (...args) => {
        const delta = mutator(id, state, ...args)
        state = Type.join.call(emitter, state, delta)
        emitter.emitAll()
        return delta
      }
    })

    ret.value = () => Type.value(state)

    ret.apply = (delta) => {
      state = Type.join.call(emitter, state, delta)
      emitter.emitAll()
      ret.emit('state changed', state)
      return state
    }

    ret.state = () => state

    ret.join = Type.join

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
