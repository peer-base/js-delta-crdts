'use strict'

const GCounter = require('./gcounter')

module.exports = {
  initial () {
    return [GCounter.initial(), GCounter.initial()]
  },

  value (s) {
    return GCounter.value(s[0]) - GCounter.value(s[1])
  },

  join (s1, s2) {
    return [GCounter.join(s1[0], s2[0]), GCounter.join(s1[1], s2[1])]
  },

  mutators: {
    inc (id, s) {
      return [GCounter.mutators.inc(id, s[0]), s[1]]
    },
    dec (id, s) {
      return [s[0], GCounter.mutators.inc(id, s[1])]
    }
  }
}
