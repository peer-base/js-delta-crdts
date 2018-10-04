'use strict'

module.exports = {
  initial () { return new Map() },

  value (s) {
    return Array.from(s.values()).reduce((acc, current) => acc + current, 0)
  },

  join (s1, s2) {
    const keys = new Set()
    for (let k of s1.keys()) { keys.add(k) }
    for (let k of s2.keys()) { keys.add(k) }

    const res = new Map()
    for (let k of keys) {
      res.set(k, Math.max(s1.get(k) || 0, s2.get(k) || 0))
    }

    return res
  },

  mutators: {
    inc (id, s) {
      const ret = new Map()
      ret.set(id, (s.get(id) || 0) + 1)
      return ret
    }
  }
}
