'use strict'

const DotKernel = require('./dot-kernel')

module.exports = (id) => ({
  initial () { return new DotKernel() },
  join (s1, s2) { return s1.join(s2) },
  value (s) { return new Set(s.ds.values()) },
  mutators: {
    add (s, value) {
      return s.join(s.removeValue(value), s.add(id, value))
    },
    remove (s, value) {
      return s.removeValue(value)
    }
  }
})