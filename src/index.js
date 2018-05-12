'use strict'

const Type = require('./type')

const types = {
  gcounter: require('./gcounter'),
  pncounter: require('./pncounter'),
  lexcounter: require('./lexcounter'),
  ccounter: require('./ccounter'),
  gset: require('./gset'),
  '2pset': require('./2pset'),
  aworset: require('./aworset'),
  rworset: require('./rworset'),
  mvreg: require('./mvreg'),
  ewflag: require('./ewflag'),
  dwflag: require('./dwflag')
}

module.exports = (typeName) => {
  const type = types[typeName]
  if (!type) { throw new Error(`unknown type named ${typeName}`) }
  return Type(type)
}
