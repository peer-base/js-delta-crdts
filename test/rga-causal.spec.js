/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDTs = require('../')
const RGA = CRDTs('rga')
const rgaType = CRDTs.type('rga')

describe('rga causal', () => {
  let deltaP, deltaE, deltaA, deltaR

  before(() => {
    // Let's create the word 'pear' using two replicas
    // 1. push 'p' to replicaPear
    // 2. push 'e' and 'a' to replicaVowels
    // 3. apply replicaVowels state to replicaPear
    // 3. push 'r' to replicaPear ... spelling 'pear'
    const replicaVowels = RGA('id1') // ID sort order matters
    const replicaPear = RGA('id2')
    deltaP = replicaPear.push('p')
    expect(replicaPear.value().join('')).to.equal('p')
    deltaE = replicaVowels.push('e')
    deltaA = replicaVowels.push('a')
    expect(replicaVowels.value().join('')).to.equal('ea')
    replicaPear.apply(replicaVowels.state())
    expect(replicaPear.value().join('')).to.equal('pea')
    deltaR = replicaPear.push('r')
    expect(replicaPear.value().join('')).to.deep.equal('pear')
  })

  it('behaves when applied in the original order', () => {
    const replica1 = RGA('replica1')
    replica1.apply(deltaP)
    replica1.apply(deltaE)
    replica1.apply(deltaA)
    replica1.apply(deltaR)

    expect(replica1.value().join('')).to.equal('pear')
  })

  it('can be applied in modified order (1)', () => {
    const replica2 = RGA('replica2')
    replica2.apply(deltaE)
    replica2.apply(deltaA)
    replica2.apply(deltaP)
    replica2.apply(deltaR)

    expect(replica2.value().join('')).to.equal('pear')
  })

  it('can be applied in different order (2)', () => {
    const replica3 = RGA('replica3')
    replica3.apply(deltaE)
    replica3.apply(deltaA)
    replica3.apply(deltaR)
    replica3.apply(deltaP)

    expect(replica3.value().join('')).to.equal('pear')
  })

  it('can be applied in different order (3)', () => {
    const replica4 = RGA('replica4')
    replica4.apply(deltaE)
    replica4.apply(deltaP)
    replica4.apply(deltaA)
    replica4.apply(deltaR)

    expect(replica4.value().join('')).to.equal('pear')
  })

  it('batching uncausally works', () => {
    const replica5 = RGA('replica5')
    replica5.apply(deltaE)
    replica5.apply(deltaA)
    const batchReplica5PR = rgaType.join(deltaP, deltaR)
    replica5.apply(batchReplica5PR)
    expect(replica5.value().join('')).to.equal('pear')
  })

  it('batching uncausally works (2)', () => {
    const replica6 = RGA('replica6')
    replica6.apply(deltaE)
    replica6.apply(deltaA)
    const batchReplica6RP = rgaType.join(deltaR, deltaP)
    replica6.apply(batchReplica6RP)
    expect(replica6.value().join('')).to.equal('pear')
  })
})
