'use strict'

const CausalContext = require('./causal-context')
const CustomSet = require('./custom-set')
const flatMap = require('array.prototype.flatmap')

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
    if (!(other instanceof DotMap)) {
      other = dotMapFromRaw(other)
    }

    const allKeys = new Set(this.state.keys())
    for (let key of other.state.keys()) {
      allKeys.add(key)
    }

    const newCausalContext = this.cc.join(other.cc)
    const newMap = new Map()
    const result = new DotMap(newCausalContext, newMap)
    result.type = this.type || (other && other.type)

    for (let key of allKeys) {
      const sub1 = this.state.has(key) && this.state.get(key)
      if (sub1) {
        sub1.cc = this.cc
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

      if (!(newSub.isBottom && newSub.isBottom())) {
        newSub.cc = null
        newMap.set(key, newSub)
      }
    }

    return result
  }
}

module.exports = DotMap

function join (s1, s2) {
  if (typeof s1 === 'function') {
    return s1.join(s2)
  } else {
    const CRDT = require('./')
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
  const dotMap = new DotMap(cc, base.state)
  console.log('DOTMAP:', dotMap)
  return dotMap
}
