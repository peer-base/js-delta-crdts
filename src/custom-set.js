'use strict'

module.exports = class CustomSet {
  constructor () {
    this._refs = new Map()
  }

  add (o) {
    const key = keyFor(o)
    if (!this._refs.has(key)) {
      this._refs.set(key, o)
    }
  }

  delete (o) {
    const key = keyFor(o)
    this._refs.delete(key)
  }

  has (o) {
    const key = keyFor(o)
    return this._refs.has(key)
  }

  values () {
    return this._refs.values()
  }
}

function keyFor (o) {
  return JSON.stringify(o)
}
