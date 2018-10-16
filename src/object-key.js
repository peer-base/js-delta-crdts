'use strict'

const hash = require('hash-it').default

module.exports = (object) => {
  const type = typeof object
  if (type !== 'object') {
    return object
  }
  let hashValue
  if (typeof (object) === 'object' && object.hasOwnProperty('hashCode')) {
    hashValue = object.hashCode
  } else {
    hashValue = hash(object)
  }

  return hashValue
}
