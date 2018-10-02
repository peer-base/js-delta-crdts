'use strict'

const CausalContext = require('./causal-context')
const flatMap = require('array.prototype.flatmap')

module.exports = class DotMap {
  constructor (cc, keys, state) {
    this.cc = cc || new CausalContext()
    this.keys = keys || new Set()
    this.state = state || new Map()
  }

  dots () {
    return new Set(flatMap(Array.from(this.state.values()), (dotStore) => dotStore.dots()))
  }

  compact () {
    return new DotMap(this.cc.compact(), new Set(this.state.keys()))
  }

  join (other) {
    const allKeys = new Set(this.keys)
    for (let key of other.keys) {
      allKeys.add(key)
    }

    const newCausalContext = this.cc.join(other.cc)
    const newMap = new Map()
    const result = new DotMap(newCausalContext, allKeys, newMap)
    result.type = this.type

    for (let key of allKeys) {
      let remove = false

      const comparison = this.cc.compare(other.cc)
      if (other.keys.has(key) && !other.state.has(key) && comparison >= 0) {
        remove = true
      } else if (this.keys.has(key) && !this.state.has(key) && comparison < 0) {
        remove = true
      }

      const sub1 = this.state.has(key) && this.state.get(key)
      const sub2 = other.state.has(key) && other.state.get(key)
      let newSub

      if (!remove && (sub1 || sub2)) {
        if (sub1 && sub2) {
          newSub = sub1.join(sub2)
        } else {
          newSub = sub1 || sub2
        }
        result.state.set(key, newSub)
      }
    }

    return result
  }
}
