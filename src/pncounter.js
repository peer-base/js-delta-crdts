'use strict'

const GCounter = require('./gcounter')

module.exports = (id) => {
  const gcounter = GCounter(id)
  return {
    initial () {
      return [gcounter.initial(), gcounter.initial()]
    },

    valueOf (s) {
      return gcounter.valueOf(s[0]) - gcounter.valueOf(s[1])
    },

    join (s1, s2) {
      return [gcounter.join(s1[0], s2[0]), gcounter.join(s1[1], s2[1])]
    },

    mutators: {
      inc (s) {
        return [gcounter.mutators.inc(s[0]), s[1]]
      },
      dec (s) {
        return [s[0], gcounter.mutators.inc(s[1])]
      }
    }
  }
}
