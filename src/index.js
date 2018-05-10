'use strict'

const Type = require('./type')

const types = {
  gcounter: require('./gcounter'),
  pncounter: require('./pncounter'),
  lexcounter: require('./lexcounter'),
  ccounter: require('./ccounter'),
  gset: require('./gset'),
  '2pset': require('./2pset')
}

module.exports = (typeName) => {
  const type = types[typeName]
  if (!type) { throw new Error(`unknown type named ${typeName}`) }
  return Type(type)
}
