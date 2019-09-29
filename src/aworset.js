'use strict'

const DotSet = require('./dot-set')

module.exports = {
  initial () { return new DotSet() },
  join (s1, s2) { return DotSet.join(s1, s2) },
  value (s) { return new Set(s.ds.values()) },
  mutators: {
    add (id, s, value) {
      s = s instanceof DotSet ? s : new DotSet(s.ds, s.cc)
      return s.join(s.removeValue(value), s.add(id, value))
    },
    remove (id, s, value) {
      s = s instanceof DotSet ? s : new DotSet(s.ds, s.cc)
      return s.removeValue(value)
    }
  }
}
