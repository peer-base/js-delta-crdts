'use strict'

const lexjoin = require('./lexjoin')

module.exports = (id) => {
  return {
    initial () { return new Map() },
    join (s1, s2) {
      const keys = new Set([...s1.keys(), ...s2.keys()])

      const ret = new Map()
      for (let key of keys) {
        if (s1.has(key) && s2.has(key)) {
          const joined = lexjoin(s1.get(key), s2.get(key), join)
          ret.set(key, joined)
        } else {
          const value = s1.has(key) ? s1.get(key) : s2.get(key)
          ret.set(key, value)
        }
      }

      return ret
    },
    value (s) {
      const res = new Set()
      for (let [value, [ts, b]] of s) {
        if (!b) {
          res.add(value)
        }
      }
      return res
    },
    mutators: {
      add (s, ts, value) { return addRemove(s, ts, value, false)},
      remove (s, ts, value) { return addRemove(s, ts, value, true)}
    }
  }

  function addRemove (s, ts, val, b) {
    const res = new Map()
    res.set(val, [ts, b])

    return res
  }
}

function join (a, b) {
  return [a, b].sort()[0]
}
