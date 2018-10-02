'use strict'

const CustomSet = require('./custom-set')

module.exports = class CausalContext {
  constructor (cc) {
    this.cc = new Map(cc) // compact causal context
    this.dc = new CustomSet() // dot cloud
  }

  dotIn (dot) {
    const [key, value] = dot
    const count = this.cc.get(key)
    return (value <= count || this.dc.has(dot))
  }

  compare (cc) {
    const keys = new Set(this.cc.keys())
    for (let key of cc.cc.keys()) {
      keys.add(key)
    }

    for (let key of keys) {
      const myValue = this.cc.get(key) || 0
      const otherValue = cc.cc.get(key) || 0
      const diff = myValue - otherValue
      if (diff < 0) {
        return -1
      } else if (diff > 0) {
        return 1
      }
    }

    return 0
  }

  compact () {
    // compact DC to CC if possible
    for (let dot of this.dc.values()) {
      const [key, value] = dot
      const existing = this.cc.get(key)
      if (!existing) {
        this.cc.set(key, value)
      } else if (existing < value) {
        this.cc.set(key, value)
      }
      this.dc.delete(dot)
    }
    return this
  }

  next (id) {
    const value = this.cc.get(id) || 0
    const newValue = value + 1
    return [id, newValue]
  }

  makeDot (id) {
    const n = this.next(id)
    this.cc.set(n[0], n[1])
    return n
  }

  insertDot (key, value, compactNow) {
    this.dc.add([key, value])
    if (compactNow) {
      this.compact()
    }
  }

  join (other) {
    if (!(other instanceof CausalContext)) {
      const newOther = new CausalContext(other.cc)
      newOther.dc = new CustomSet()
      if (other.dc._refs) {
        other.dc._refs = newOther.dc._refs
      }
      other = newOther
    }
    const allKeys = new Set()
    other.compact()
    this.compact()
    for (let k of this.cc.keys()) { allKeys.add(k) }
    for (let k of other.cc.keys()) { allKeys.add(k) }

    const result = new Map()

    for (let key of allKeys) {
      result.set(key, Math.max(this.cc.get(key) || 0, other.cc.get(key) || 0))
    }

    return new CausalContext(result)
  }
}
