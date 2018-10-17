'use strict'

const Type = require('./type')

module.exports = (typeName) => {
  return Type(module.exports.type(typeName))
}

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
  dwflag: require('./dwflag'),
  rwlwwset: require('./rwlwwset'),
  lwwreg: require('./lwwreg'),
  rga: require('./rga'),
  ormap: require('./ormap')
}

module.exports.type = (typeName) => {
  const type = types[typeName]
  if (!type) { throw new Error(`unknown type named ${typeName}`) }
  return type
}

module.exports.define = (typeName, impl) => {
  if (types[typeName]) {
    throw new Error(`${typeName} is already defined as a type`)
  }
  types[typeName] = impl
}
