'use strict'

const EventEmitter = require('events')
const { isCollection } = require('immutable')

module.exports = (Type) => {
  return (id) => {
    let state = Type.initial()
    const ret = new EventEmitter()
    const emitter = new ChangeEmitter(ret)
    let valueCache

    Object.keys(Type.mutators || {}).forEach((mutatorName) => {
      const mutator = Type.mutators[mutatorName]
      ret[mutatorName] = (...args) => {
        const delta = mutator(id, state, ...args)
        const newState = Type.join.call(emitter, state, delta)
        if (Type.incrementalValue) {
          valueCache = Type.incrementalValue(state, newState, delta, valueCache)
        }
        state = newState
        emitter.emitAll()
        ret.emit('state changed', state)
        return delta
      }
    })

    ret.id = id

    ret.value = () => {
      if (Type.incrementalValue && (valueCache !== undefined)) {
        let returnValue = valueCache.value
        if (isCollection(returnValue)) {
          returnValue = returnValue.toJS()
        }
        return returnValue
      } else {
        return Type.value(state)
      }
    }

    ret.apply = (delta) => {
      const newState = Type.join.call(emitter, state, delta, { strict: true })
      if (Type.incrementalValue) {
        valueCache = Type.incrementalValue(state, newState, delta, valueCache)
      }
      state = newState
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
