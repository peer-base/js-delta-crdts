'use strict'

module.exports = (id) => ({
  initial () { return new Set() },
  join (s1, s2) {
    return new Set([...s1, ...s2])
  },
  value (s) { return s },
  mutators: {
    add (s, value) {
      return new Set([value])
    }
  }
})