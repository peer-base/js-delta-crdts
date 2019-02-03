'use strict'

const DotSet = require('./dot-set')

module.exports = {
  initial () { return new DotSet() },
  join (s1, s2) { return DotSet.join(s1, s2) },
  value (s) {
    let acc = 0
    for (let value of s.ds.values()) {
      acc += value
    }
    return acc
  },
  mutators: {
    inc (id, s, by = 1) {
      let [r, base] = mutateFor(id, s)
      return r.join(s.add(id, base + by))
    },
    dec (id, s, by = 1) {
      let [r, base] = mutateFor(id, s)
      return r.join(s.add(id, base - by))
    }
  }
}

function mutateFor (id, s) {
  let r = new DotSet()
  let base = 0
  for (let it of s.ds) {
    const [key, value] = it
    const dot = DotSet.dotForKey(key)
    const dotId = dot[0]
    if (id === dotId) {
      base = Math.max(base, value)
      r = r.join(s.removeDot(dot))
    }
  }

  return [r, base]
}
