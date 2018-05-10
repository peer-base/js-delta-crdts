'use strict'

const CustomSet = require('./custom-set')

module.exports = class DotContext {
  constructor (cc) {
    this.cc = new Map(cc) // compact causal context
    this.dc = new CustomSet() // dot cloud
  }

  dotIn (dot) {
    const [key, value] = dot
    const count = this.cc.get(key)
    return (value <=  count || this.dc.has(dot))
  }

  compact () {
    // compact DC to CC if possible
    for(let dot of this.dc.values()) {
      const [key, value] = dot
      const existing = this.cc.get(key)
      if (!existing) {
        this.cc.set(key, value)
      } else if (existing < value) {
        this.cc.set(key, value)
      }
      this.dc.delete(dot)
    }
  }

  makeDot (id) {
    const value = this.cc.get(id) || 0
    const newValue = value + 1
    this.cc.set(id, newValue)
    return [id, newValue]
  }

  insertDot (key, value, compactNow) {
    this.dc.add([key, value])
    if (compactNow) {
      this.compact()
    }
  }

  join (other) {
    const allKeys = new Set()
    other.compact()
    this.compact()
    for (let k of this.cc.keys()) { allKeys.add(k) }
    for (let k of other.cc.keys()) { allKeys.add(k) }

    const result = new Map()

    for (let key of allKeys) {
      result.set(key, Math.max(this.cc.get(key) || 0, other.cc.get(key) || 0))
    }

    return new DotContext(result)
  }
}
