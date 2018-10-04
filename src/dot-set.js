'use strict'

const CausalContext = require('./causal-context')
const CustomSet = require('./custom-set')

class DotSet {
  constructor (ds, cc) {
    this.ds = ds || new Map()
    this.cc = cc || new CausalContext()
  }

  dots () {
    return new Set(Array.from(this.ds.keys()).map(DotSet.dotForKey))
  }

  isBottom () {
    return this.ds.size === 0
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
    const dotKey = DotSet.keyForDot(dot)
    this.ds.set(dotKey, val)

    const resDS = new Map()
    resDS.set(dotKey, val)
    const resCC = new CausalContext()
    resCC.insertDot(dot[0], dot[1])
    return new DotSet(resDS, resCC)
  }

  /* changes self state, does not return delta */
  dotAdd (id, val) {
    const dot = this.cc.makeDot(id)
    const dotKey = DotSet.keyForDot(dot)
    this.ds.set(dotKey, val)
  }

  removeValue (val) {
    const res = new DotSet()
    for (let mapped of this.ds) {
      const currentValue = mapped[1]
      if (currentValue === val) {
        const key = mapped[0]
        res.cc.insertDot(DotSet.dotForKey(key))
        this.ds.delete(key)
      }
    }
    res.cc.compact()
    return res
  }

  removeDot (dot) {
    const key = DotSet.keyForDot(dot)
    const value = this.ds.get(key)
    const res = new DotSet()
    if (value) {
      res.cc.insertDot(dot[0], dot[1])
      this.ds.delete(key)
    }
    res.cc.compact()
    return res
  }

  removeAll () {
    const res = new DotSet()
    for (let mapped of this.ds) {
      const dot = DotSet.dotForKey(mapped[0])
      res.cc.insertDot(dot[0], dot[1])
    }
    this.ds = new Map() // clear payload, but retain context

    res.cc.compact()
    return res
  }

  join (other, joinValues) {
    if (!(other instanceof DotSet)) {
      other = dotSetFromRaw(other)
    }
    const keys = new Set(this.ds.keys())
    for (let key of other.ds.keys()) { keys.add(key) }

    // clone map so that we return something immutable
    const ds = new Map(this.ds)

    for (let key of keys) {
      const dot = DotSet.dotForKey(key)
      if (!other.ds.has(key)) {
        if (this.ds.has(key) && other.cc.dotIn(dot)) {
          ds.delete(key)
        }
      } else if (!this.ds.has(key)) {
        // we don't have it
        if (!this.cc.dotIn(dot)) {
          ds.set(key, other.ds.get(key))
        }
      } else {
        // in both
        if (joinValues) {
          ds.set(key, joinValues(ds.get(key), other.ds.get(key)))
        }
      }
    }

    const cc = this.cc.join(other.cc)
    const result = new DotSet(ds, cc)
    result.type = this.type || other.type

    return result
  }
}

module.exports = DotSet

function dotSetFromRaw (base) {
  const cc = new CausalContext(base.cc && base.cc.cc)
  if (base.cc && base.cc.dc) {
    const dc = new CustomSet()
    if (base.cc.dc._refs) {
      dc._refs = base.cc.dc._refs
    }
    cc.dc = dc
  }
  const dotSet = new DotSet(base.ds, cc)
  return dotSet
}
