'use strict'

const EventEmitter = require('events')

module.exports = (Type) => {
  return (id) => {
    const replica = Type(id)
    let state = replica.initial()
    const ret = new EventEmitter()

    Object.keys(replica.mutators || {}).forEach((mutatorName) => {
      const mutator = replica.mutators[mutatorName]
      ret[mutatorName] = (...args) => {
        const delta = mutator(state, ...args)
        state = replica.join(state, delta)
        return delta
      }
    })

    ret.value = () => replica.value(state)

    ret.apply = (delta) => {
      state = replica.join(state, delta)
      ret.emit('state changed', state)
      return state
    }

    ret.state = () => state

    ret.join = replica.join

    return ret
  }
}
