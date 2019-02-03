'use strict'

const DotSet = require('./dot-set')

module.exports = {
  initial () { return new DotSet() },
  join (s1, s2) { return DotSet.join(s1, s2) },
  value (s) { return s.ds.size > 0 },
  mutators: {
    enable (id, s) {
      return s.join(
        s.removeValue(true),
        s.add(id, true))
    },
    disable (id, s) {
      return s.removeValue(true)
    }
  }
}
