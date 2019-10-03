'use strict'

module.exports = (l, r, join, greaterThan) => {
  if (!l) { return r }
  if (!r) { return l }

  if (!greaterThan) { greaterThan = defaultGreaterThan }

  const [lh, ...lt] = l
  const [rh, ...rt] = r

  if (greaterThan(lh, rh)) { return l }
  if (greaterThan(rh, lh)) { return r }

  // First is equal, so join second
  return [lh, ...join(lt, rt)]
}

function defaultGreaterThan (a, b) {
  return a > b
}
