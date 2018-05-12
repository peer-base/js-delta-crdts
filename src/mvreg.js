'use strict'

const DotKernel = require('./dot-kernel')

module.exports = (id) => ({
  initial () { return new DotKernel() },
  join (s1, s2) { return s1.join(s2) },
  valueOf (s) {
    const ret = new Set()
    for (let [dot, value] of s.ds) {
      ret.add(value)
    }
    return ret
  },
  mutators: {
    write (s, value) {
      return s.join(
        s.removeAll(),
        s.add(id, value))
    }
  }
})
