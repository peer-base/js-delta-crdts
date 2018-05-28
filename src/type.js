'use strict'

module.exports = (Type) => {
  return (id) => {
    const replica = Type(id)
    let state = replica.initial()
    const ret = {}

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
    }

    ret.state = () => state

    return ret
  }
}
