'use strict'

const Type = require('./type')

const types = {
  gcounter: require('./gcounter'),
  pncounter: require('./pncounter'),
  lexcounter: require('./lexcounter')
}

module.exports = (typeName) => {
  const type = types[typeName]
  if (!type) { throw new Error(`unknown type named ${typeName}`) }
  return Type(type)
}
