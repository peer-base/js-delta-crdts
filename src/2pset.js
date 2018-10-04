'use strict'

module.exports = {
  initial () { return [new Set(), new Set()] },
  join (s1, s2) {
    const ret = [
      new Set([...s1[0], ...s2[0]]),
      new Set([...s1[1], ...s2[1]])
    ]

    const [added, removed] = ret
    for (let r of removed) {
      if (added.has(r)) {
        added.delete(r)
      }
    }

    return ret
  },
  value (s) { return s[0] },
  mutators: {
    add (id, s, value) {
      const ret = [new Set(), new Set()]
      if (!s[1].has(value)) {
        ret[0].add(value)
      }
      return ret
    },
    remove (id, s, value) {
      return [new Set(), new Set([value])]
    }
  }
}
