'use strict'

const lexjoin = require('./lexjoin')

module.exports = {
  initial () { return new Map() },
  join (s1, s2) {
    const keys = new Set()
    for (let k of s1.keys()) { keys.add(k) }
    for (let k of s2.keys()) { keys.add(k) }

    const res = new Map()
    for (let k of keys) {
      res.set(k, lexjoin(s1.get(k), s2.get(k)), joinValues)
    }

    return res
  },
  value (s) {
    return Array.from(s.values()).reduce((acc, current) => acc + current[1], 0)
  },
  mutators: {
    inc (id, s) {
      const existing = s.get(id) || [0, 0]
      const ret = new Map()
      ret.set(id, [existing[0], existing[1] + 1])
      return ret
    },
    dec (id, s) {
      const existing = s.get(id) || [0, 0]
      const ret = new Map()
      ret.set(id, [existing[0] + 1, existing[1] - 1])
      return ret
    }
  }
}

function joinValues (v1, v2) {
  return Math.max(v1, v2)
}
