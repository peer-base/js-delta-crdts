'use strict'

const DotContext = require('./dot-context')

module.exports = class DotKernel {
  constructor (ds, cc) {
    this.ds = ds || new Map()
    this.cc = cc || new DotContext()
  }

  static keyForDot (dot) {
    return JSON.stringify(dot)
  }

  static dotForKey (key) {
    return JSON.parse(key)
  }

  /* changes self state, returns a delta */
  add (id, val) {
    const dot = this.cc.makeDot(id)
    const dotKey = DotKernel.keyForDot(dot)
    this.ds.set(dotKey, val)

    const resDS = new Map()
    resDS.set(dotKey, val)
    const resCC = new DotContext()
    resCC.insertDot(dot[0], dot[1])
    return new DotKernel(resDS, resCC)
  }

  /* changes self state, does not return delta */
  dotAdd (id, val) {
    const dot = this.cc.makeDot(id)
    const dotKey = DotKernel.keyForDot(dot)
    this.ds.set(dotKey, val)
  }

  removeValue (val) {
    const res = new DotKernel()
    for (let mapped of this.ds) {
      const currentValue = mapped[1]
      if (currentValue === val) {
        const key = mapped[0]
        res.cc.insertDot(DotKernel.dotForKey(key))
        this.ds.delete(key)
      }
    }
    res.cc.compact()
    return res
  }

  removeDot (dot) {
    const key = DotKernel.keyForDot(dot)
    const value = this.ds.get(key)
    const res = new DotKernel()
    if (value) {
      res.cc.insertDot(dot)
      this.ds.delete(key)
    }
    res.cc.compact()
    return res
  }

  removeAll () {
    const res = new DotKernel()
    for (let mapped of this.ds) {
      const dot = DotKernel.dotForKey(mapped[0])
      res.cc.insertDot(dot[0], dot[1])
    }
    this.ds = new Map() // clear payload, but retain context

    res.cc.compact()
    return res
  }

  join (other, joinValues) {
    const keys = new Set()
    for(let key of this.ds.keys()) { keys.add(key) }
    for(let key of other.ds.keys()) { keys.add(key) }

    // clone map so that we return something immutable
    const ds = new Map(this.ds)

    for(let key of keys) {
      const dot = DotKernel.dotForKey(key)
      if (!other.ds.has(key)) {
        if (ds.has(key) && other.cc.dotIn(dot)) {
          ds.delete(key)
        }
      } else if (!this.ds.has(key) && !this.cc.dotIn(dot)) {
        ds.set(key, other.ds.get(key))
      } else {
        // in both

        if (joinValues) {
          ds.set(key, joinValues(ds.get(key), other.ds.get(key)))
        }
      }
    }

    const cc = this.cc.join(other.cc)
    return new DotKernel(ds, cc)
  }
}
