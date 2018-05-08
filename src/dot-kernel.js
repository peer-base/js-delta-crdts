'use strict'

module.exports = () => {
  return new DotKernel()
}

class DotKernel () {
  constructor () {
    this.dots = new Map()
    this.cbase = DotContext()
    this.c = DotContext()
  }

  join () {

  }
}
