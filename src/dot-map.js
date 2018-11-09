'use strict'

const CausalContext = require('./causal-context')
const CustomSet = require('./custom-set')
const flatMap = require('array.prototype.flatmap')
const CRDT = require('./')

class DotMap {
  constructor (cc, state) {
    this.cc = cc || new CausalContext()
    this.state = state || new Map()
  }

  dots () {
    return new Set(flatMap(Array.from(this.state.values()), (dotStore) => dotStore.dots()))
  }

  isBottom () {
    return this.state.size === 0
  }

  compact () {
    return new DotMap(this.cc.compact(), this.state)
  }

  join (other) {
    return DotMap.join(this, other)
  }

  static join (self, other) {
    if (!(self instanceof DotMap)) {
      self = dotMapFromRaw(self)
    }

    if (!(other instanceof DotMap)) {
      other = dotMapFromRaw(other)
    }

    const allKeys = new Set(self.state.keys())
    for (let key of other.state.keys()) {
      allKeys.add(key)
    }

    const newCausalContext = self.cc.join(other.cc)
    const newMap = new Map()
    const result = new DotMap(newCausalContext, newMap)
    result.type = self.type || (other && other.type)

    for (let key of allKeys) {
      const sub1 = self.state.has(key) && self.state.get(key)
      if (sub1) {
        sub1.cc = self.cc
      }

      const sub2 = other.state.has(key) && other.state.get(key)
      if (sub2) {
        sub2.cc = other.cc
      }

      let newSub

      if (!sub1) {
        newSub = sub2
      } else if (!sub2) {
        newSub = sub1
      } else {
        newSub = join(sub1, sub2)
      }

      newSub.type = sub1.type || sub2.type

      newSub.cc = null
      newMap.set(key, newSub)
    }

    return result
  }
}

module.exports = DotMap

function join (s1, s2) {
  if (typeof s1 === 'function') {
    return s1.join(s2)
  } else {
    const type = CRDT.type(s1.type || s2.type)
    return type.join(s1, s2)
  }
}

function dotMapFromRaw (base) {
  const cc = new CausalContext(base.cc && base.cc.cc)
  if (base.cc && base.cc.dc) {
    const dc = new CustomSet()
    if (base.cc.dc._refs) {
      dc._refs = base.cc.dc._refs
    }
    cc.dc = dc
  }
  const stateFromRaw = new Map()
  for (const key of base.state.keys()) {
    const value = base.state.get(key)
    const type = CRDT.type(value.type)
    stateFromRaw.set(key, type.join(value, type.initial()))
  }
  const dotMap = new DotMap(cc, stateFromRaw)
  dotMap.type = base.type
  return dotMap
}
