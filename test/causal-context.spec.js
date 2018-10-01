/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CausalContext = require('../src/causal-context')

describe('causal-context', () => {
  let cc

  it('can create', () => {
    cc = new CausalContext()
  })

  it('dot is not in', () => {
    expect(cc.dotIn(['a', 1])).to.be.false()
  })

  it('can make dot', () => {
    cc.makeDot('a')
  })

  it('dot is in', () => {
    expect(cc.dotIn(['a', 1])).to.be.true()
  })

  it('higher dot is not in', () => {
    expect(cc.dotIn(['a', 2])).to.be.false()
  })

  it('can insert higher dot', () => {
    cc.insertDot('a', 2)
  })

  it('dot is in', () => {
    expect(cc.dotIn(['a', 1])).to.be.true()
  })

  it('current dot is in', () => {
    expect(cc.dotIn(['a', 2])).to.be.true()
  })

  it('higher dot is not in', () => {
    expect(cc.dotIn(['a', 3])).to.be.false()
  })

  it('can compact', () => {
    cc.compact()
  })

  it('keeps properties after compaction', () => {
    expect(cc.dotIn(['a', 1])).to.be.true()
    expect(cc.dotIn(['a', 2])).to.be.true()
    expect(cc.dotIn(['a', 3])).to.be.false()
  })

  describe('join', () => {
    let other
    let result

    before(() => {
      other = new CausalContext()
      other.insertDot('a', 1)
      other.insertDot('b', 2)
    })

    it('can join', () => {
      result = cc.join(other)
    })

    it('joined correctly', () => {
      expect(result.dotIn(['a', 1])).to.be.true()
      expect(result.dotIn(['a', 2])).to.be.true()
      expect(result.dotIn(['a', 3])).to.be.false()

      expect(result.dotIn(['b', 1])).to.be.true()
      expect(result.dotIn(['b', 2])).to.be.true()
      expect(result.dotIn(['b', 3])).to.be.false()
    })
  })
})
