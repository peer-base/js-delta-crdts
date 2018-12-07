'use strict'

const codec = require('delta-crdts-msgpack-codec')

module.exports = (delta) => {
  return codec.decode(codec.encode(delta))
}
