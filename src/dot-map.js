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

    const interceptingKeys = new Set()

    for (let key of allKeys) {
      if (this.keys.has(key) && other.keys.has(key)) {
        interceptingKeys.add(key)
      }
    }

    const newCausalContext = this.cc.join(other.cc)
    const newMap = new Map()
    const result = new DotMap(newCausalContext, allKeys, newMap)

    for (let commonKey of interceptingKeys) {
      const sub1 = this.state.get(commonKey)
      const sub2 = other.state.get(commonKey)

      sub1.cc = this.cc
      sub2.cc = other.cc

      const newSub = sub1.join(sub2)
      newSub.cc = null

      if (newSub) {
        result.state.set(commonKey, newSub)
      }
    }

    for (let key of allKeys) {
      if (!interceptingKeys.has(key)) {
        const value = this.state.has(key) ? this.state.get(key) : other.state.get(key)
        result.state.set(key, value)
      }
    }

    result.type = this.type

    return result
  }
}
