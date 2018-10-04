'use strict'

module.exports = {
  initial () { return [0, null] },
  join (s1, s2) {
    const t1 = s1[0]
    const t2 = s2[0]
    if (t1 === t2) {
      if (s2[1] > s1[1]) return s2
    }
    return s2[0] > s1[0] ? s2 : s1
  },
  value (s) { return s[1] },
  mutators: {
    write (id, s, ts, value) {
      return [ts, value]
    }
  }
}
