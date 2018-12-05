# delta-crdts

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![](https://travis-ci.org/ipfs-shipyard/js-delta-crdts.svg?branch=master)](https://travis-ci.org/ipfs-shipyard/js-delta-crdts)
[![](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D8.0.0-orange.svg?style=flat-square)


Delta state-based CRDTs in Javascript.

* ([See original paper](https://arxiv.org/abs/1603.01529))
* [Demo video](https://www.youtube.com/watch?v=Cn9pIX8BWIU)

## Install

```
$ npm install delta-crdts
```

## Import

```js
const CRDTs = require('delta-crdts')
```

## Instantiate a type

```js
const type = 'rga' // or any of the other supported CRDT types
const Type = CRDT(type)
```

## Create a replica

To create a replica you need pass in a unique node id.

```js
const replica = Type('node id')
```

## Mutate that replica

```js
const deltas = []
deltas.push(replica.push('some value'))
deltas.push(replica.insertAt(0, 'some other value'))
```

## Create a second replica

```js
const replica2 = Type('node id 2')
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
const replica3 = Type('node id 3')
replica3.apply(replica2.state())
```


## Conflict management

You can do concurrent edits on both replicas:

```js
// create 2 replicas
const replicas = [Type('id1'), Type('id2')]

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

## Extend

You can extend the types, creating your own CRDT.

Example:

```js
const Zero = {
  initial: () => 0,
  join: (s1, s2) => 0,
  value: (state) => state,
  mutators: {
    doSomething (id, state, arg1) => {
      // example mutator, returning a delta
      return 0
    }
  }
}

CRDT.define('zero', Zero)

// now you can use it

const replica = CRDT('zero')('node id')
```

### Support for incremental value computation

It's possible to allow types to have incremental value computation. If a type supports that, the value is incrementally computed on each delta that is applied.

To add support for incremental value computation to a CRDT, the type definition should support the following function:

```js
Type.incrementalValue = function (beforeState, newState, delta, cache = { value: <some initial value>, ... }) {
  // ...
}
```

As an example you can get inspiration from [the RGA implementation](src/rga.js).

## Types


The following types are built-in:

(* means that the type is causal and can be embedded in an ORMap)

## Counters

| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Increment-only Counter| `gcounter` | `.inc()` | int |
| PN-Counter | `pncounter` |   `.inc()`,`.dec()` | int |
| Lex-Counter | `lexcounter` |   `.inc()`,`.dec()` | int |
| Causal Counter *| `ccounter` |   `.inc()`,`.dec()` | int |

## Flags
| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Enable-Wins Flag *| `ewflag` | `.enable()`, `.disable()` | Boolean |
| Disable-Wins Flag *| `dwflag` | `.enable()`, `.disable()` | Boolean |


## Sets

| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Grow-Only Set | `gset` | `.add(element)` | Set |
| Two-Phase Set | `2pset` |   `.add(element)`, `.remove(element)` | Set |
| Add-Wins-Observed-Remove Set *| `aworset` | `.add(element)`, `.remove(element)` | Set |
| Remove-Wins-Observed-Remove Set *| `rworset` | `.add(element)`, `.remove(element)` | Set |
| Remove-Wins-Last-Write-Wins Set | `rwlwwset` | `.add(element)`, `.remove(element)` | Set |

## Arrays

| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Replicable Growable Array | `rga` | `.push(element)`, `.insertAt(pos, element)`, `.removeAt(pos)`, `updateAt(pos, element)`, `insertAllAt(pos, elements)` | Array |

## Registers

| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Last-Write-Wins Register | `lwwreg` |  `.write(value)`  | Value |
| Multi-Value Register *| `mvreg` |  `.write(value)`  | Set of concurrent values |

## Maps

| Name | Identifier | Mutators | Value Type |
|------|------------|----------|------------|
| Observed-Remove Map *| `ormap` |  `.remove(key)`, `applySub(key, crdt_name, mutator_name, ...args)`  | Object |


### Embedding CRDTs in ORMaps

OR-Maps support embedding of other causal CRDTs. Example:

```js
const ORMap = CRDT('ormap')
const m = ORMap('id1')
const delta = m.applySub('a', 'mvreg', 'write', 'A')
console.log(m.value()) // => {a: new Set(['A'])}
```

Of this collection, causal CRDTs are:

* AWORSet
* CCounter
* DWFlag
* EWFlag
* MVReg
* ORMap
* RWORSet

### Sets, uniqueness and object id

For testing uniqueness in a way that is safe when replicas are distributed, for objects we calculate the hash using [the `hast-it` package](https://github.com/planttheidea/hash-it).

If you want, you can override it by providing a `hashCode` attribute in your object.

For all objects where `typeof object !== 'object'`, we use the value itself as comparison.

## Static methods

You may get the static definition of a type by doing

```js
const type = CRDT.type(typeName)
```

Each type has a series of static methods may need to use:

### `Type.initial()`

Returns the initial state for the type. Example:

```js
const GCounter = CRDT.type('gcounter')
const initial = GCounter.initial()
```

### `Type.value(state)`

Returns the view value of a given state.


### `Type.join(s1, s2)`

Joins two states (or deltas) and returns the result.

```js
const GCounter = CRDT.type('gcounter')

const state = GCounter.join(delta1, delta)

const value = GCounter.value(state)
```


### Example of using static methods:

```js
const GCounter = CRDT('gcounter')

deltas = []
deltas.push(replica1.inc())
deltas.push(replica1.inc())
deltas.push(replica1.inc())

const bigDelta = deltas.reduce(GCounter.join, GCounter.initial())

replica2.apply(bigDelta)
```

# License

MIT
