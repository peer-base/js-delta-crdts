# delta-crdts

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![](https://travis-ci.org/ipfs-shipyard/delta-crdts.svg?branch=master)](https://travis-ci.org/ipfs-shipyard/delta-crdts)
[![](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D8.0.0-orange.svg?style=flat-square)


Delta state-based CRDTs in Javascript.

## Install

```
$ npm install delta-crdts
```

## Import

```js
const CRDTs = require('delta-crdts')
```

## Create a replica

```js
const type = 'rga' // or any of the other supported CRDT types
const replica = CRDT(type)
```

## Mutate that replica

```js
const deltas = []
deltas.push(replica.push('some value'))
deltas.push(replica.insertAt(0, 'some other value'))
```

## Create a second replica

```js
const replica2 = CRDT(type)
```

## Apply the deltas

```js
deltas.forEach((delta) => replica2.apply(delta))
```

## Query the value

```js
replica2.value() // ['some value', 'some other value']
```

## Initialize a replica from the entire state

```js
const replica3 = CRDT(type)
replica3.apply(replica2.state())
```


## Conflict management

You can do concurrent edits on both replicas:

```js
// create 2 replicas
const replicas = [CRDT('rga'), CRDT('rga')]

// create concurrent deltas
const deltas = [[], []]

deltas[0].push(replicas[0].push('a'))
deltas[0].push(replicas[0].push('b'))

deltas[1].push(replicas[1].push('c'))
deltas[1].push(replicas[1].push('d'))

deltas[0].forEach((delta) => replicas[1].apply(delta))
deltas[1].forEach((delta) => replicas[0].apply(delta))

assert.deepEqual(replicas[0].value(), replicas[1].value())
```

## Types


The following types are built-in:

## Counters

| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Increment-only Counter | `gcounter` | `.inc()` | int |
| PN-Counter | `pncounter` |   `.inc()`,`.dec()` | int |
| Lex-Counter | `lexcounter` |   `.inc()`,`.dec()` | int |

## Flags
| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Enable-Wins Flag | `ewflag` | `.enable()`, `.disable()` | Boolean |
| Disable-Wins Flag | `dwflag` | `.enable()`, `.disable()` | Boolean |


## Sets

| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Grow-Only Set | `gset` | `.add(element)` | Set |
| Two-Phase Set | `2pset` |   `.add(element)`, `.remove(element)` | Set |
| Add-Wins-Observerd-Remove Set | `aworset` | `.add(element)`, `.remove(element)` | Set |
| Remove-Wins-Last-Write-Wins Set | `rwlwwset` | `.add(element)`, `.remove(element)` | Set |

## Arrays

| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Replicable Growable Array | `rga` | `.push(element)`, `.insertAt(pos, element)`, `.removeAt(pos)` | Array |

## Registers

| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Last-Write-Wins Register | `lwwreg` |  `.write(value)`  | Value |
| Multi-Value Register | `mvreg` |  `.write(value)`  | Array of concurrent values |


# License

MIT