/* eslint no-continue: "off" */
'use strict'

const DotMap = require('./dot-map')
const CausalContext = require('./causal-context')
const CRDT = require('./')

module.exports = {
  initial () { return new DotMap() },
  join (s1, s2) { return DotMap.join(s1, s2) },
  value (s) {
    const result = {}
    for (const [key, subState] of s.state) {
      if (subState.isBottom && subState.isBottom()) continue
      const typeName = subState.type
      const type = CRDT.type(typeName)
      result[key] = type.value(subState)
    }

    return result
  },
  mutators: {
    applySub (id, s, key, typeName, mutatorName, ...args) {
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
      return new DotMap(delta.cc, new Map([[key, delta]]))
    },
    remove (id, s, key) {
      const dotStore = s.state.get(key)

      const dots = new Map((dotStore && dotStore.dots && dotStore.dots()) || new Set())
      const newCC = new CausalContext(dots)

      const type = CRDT.type(dotStore.type)
      if (!type) {
        throw new Error('unknown type name')
      }
      const newSubState = type.initial()
      newSubState.type = dotStore.type

      return new DotMap(newCC, new Map([[key, newSubState]]))
    }
  }
}
