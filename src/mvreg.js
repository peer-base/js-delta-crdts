'use strict'

const DotSet = require('./dot-set')
const { encode } = require('delta-crdts-msgpack-codec')

module.exports = {
  initial () { return new DotSet() },
  join (s1, s2) { return DotSet.join(s1, s2) },
  value (s) {
    const ret = new Set()
    for (let [, value] of s.ds) {
      ret.add(value)
    }
    return ret
  },
  mutators: {
    write (id, s, value) {
      const encodedId = encode(id).toString('base64')
      return s.join(
        s.removeAll(),
        s.add(encodedId, value))
    }
  }
}
