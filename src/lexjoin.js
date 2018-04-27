'use strict'

module.exports = (l, r, join, greaterThan) => {
  if (!l) { return r}
  if (!r) { return l}

  if (!greaterThan) { greaterThan = defaultGreaterThan }

  if (greaterThan(l[0], r[0])) { return l }
  if (greaterThan(r[0], l[0])) { return r }

  // First is equal, so join second
  const res = [l[0], join(l[1], r[1])]

}

function defaultGreaterThan (a, b) {
  return a > b
}
