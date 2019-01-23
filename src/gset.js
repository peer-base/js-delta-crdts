'use strict'

module.exports = {
  initial () { return new Set() },
  join (s1, s2) {
    const targetSet = new Set([...s1])
    for (let elem of s2) {
      if (!targetSet.has(elem)) {
        targetSet.add(elem)
        this.changed({ add: elem })
      }
    }
    return targetSet
  },
  value (s) { return new Set(s) },
  mutators: {
    add (id, s, value) {
      return new Set([value])
    }
  }
}
