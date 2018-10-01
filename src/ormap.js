'use strict'

const DotMap = require('./dot-map')
const CausalContext = require('./causal-context')

module.exports = {
  initial () { return new DotMap() },
  join (s1, s2) { return s1.join(s2) },
  value (s) {
    const result = {}
    for (const [key, subState] of s.state) {
      const typeName = subState.type
      const CRDT = require('./')
      const type = CRDT.type(typeName)
      result[key] = type.value(subState)
    }

    return result
  },
  mutators: {
    applySub (id, s, key, typeName, mutatorName, ...args) {
      const CRDT = require('./')
      const type = CRDT.type(typeName)
      if (!type) {
        throw new Error('unknown type name')
      }
      const mutator = type.mutators[mutatorName]
      if (typeof mutator !== 'function') {
        throw new Error(mutatorName + ' is not a mutator in ' + typeName)
      }
      let state = s.state.has(key) ? s.state.get(key) : type.initial()
      state.type = typeName
      state.cc = s.cc
      const delta = mutator.call(this, id, state, ...args)
      delta.type = typeName
      const newKeys = new Set([key])
      return new DotMap(delta.cc, newKeys, new Map([[key, delta]]))
    },
    remove (id, s, key) {
      const dotStore = s.state.get(key)
      const dots = new Map((dotStore && dotStore.dots()) || new Set())

      const newCC = new CausalContext(dots)
      const newKeys = new Set([key])
      return new DotMap(newCC, newKeys)
    }
  }
}