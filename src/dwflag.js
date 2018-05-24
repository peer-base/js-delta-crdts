'use strict'

const DotKernel = require('./dot-kernel')

module.exports = (id) => ({
  initial () { return new DotKernel() },
  join (s1, s2) { return s1.join(s2) },
  value (s) { return s.ds.size === 0 },
  mutators: {
    enable (s) {
      return s.removeValue(false)
    },
    disable (s) {
      return s.join(
        s.removeValue(false),
        s.add(id, false))
    }
  }
})
