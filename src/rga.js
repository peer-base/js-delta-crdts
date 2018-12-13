/* eslint max-depth: "off" */
'use strict'

// Replicable Growable Array (RGA)
// State is represented by 3 sets:
//   * Added Vertices (VA)
//   * Removed Vertices (VR)
//   * Edges (E)
//
// As defined in http://hal.upmc.fr/inria-00555588/document

const { List } = require('immutable')
const { encode, decode } = require('delta-crdts-msgpack-codec')

module.exports = {
  initial: () => [
    new Map([[null, null]]), // VA
    new Set(), // VR
    new Map([[null, null]])], // E

  join,

  value (state) {
    const [addedVertices, removedVertices, edges] = state
    const result = []
    let id = edges.get(null)
    while (id) {
      if (!removedVertices.has(id)) {
        result.push(addedVertices.get(id))
      }
      id = edges.get(id)
    }

    return result
  },

  // TODO: test and re-enable this:
  incrementalValue (beforeState, newState, delta, cache = { value: List(), indices: new Map() }) {
    let { value, indices } = cache
    const [ , beforeRemoved ] = beforeState
    const [ , deltaRemoved, deltaEdges ] = delta
    const [ newAdded, newRemoved, newEdges ] = newState

    for (let removedId of deltaRemoved) {
      if ((!beforeRemoved.has(removedId)) && indices.has(removedId)) {
        const pos = indices.get(removedId)
        value = value.delete(pos - 1)
        incrementIndexAfter(removedId, -1)
      }
    }

    let left = null
    let right = deltaEdges.get(left)
    let pos = 0

    while (right) {
      if (indices.has(left)) {
        pos = indices.get(left)
      }
      if (!indices.has(right)) {
        // new element
        if (!newRemoved.has(right)) {
          // not removed
          let beforeRight = newEdges.get(left)
          while (beforeRight && (compareIds(beforeRight, right) > 0)) {
            if (!newRemoved.has(beforeRight)) {
              pos += 1
            }
            beforeRight = newEdges.get(beforeRight)
          }

          value = value.insert(pos, newAdded.get(right))
          incrementIndexAfter(right)
          pos += 1
        }
        indices.set(right, pos)
      }

      // continue iteration
      left = right
      right = deltaEdges.get(right)
    }

    // printIndices()

    return { value, indices }

    function incrementIndexAfter (_id, incBy = 1) {
      let id = _id
      // id = newEdges.get(id)
      while (id) {
        if (indices.has(id)) {
          let newValue = indices.get(id) + incBy
          indices.set(id, newValue)
        }
        id = newEdges.get(id)
      }
    }

    // function printIndices () {
    //   console.log('------ >')
    //   for (let [key, pos] of indices) {
    //     console.log(newAdded.get(key) + ' => ' + pos)
    //   }
    //   console.log('< ------')
    // }
  },

  mutators: {
    addRight (id, s, beforeVertex, value) {
      const elemId = createUniqueId(s, id)
      const edges = s[2]
      let l = beforeVertex
      let r = edges.get(beforeVertex)
      const newEdges = new Map()
      newEdges.set(l, elemId)
      newEdges.set(elemId, r)

      return [new Map([[elemId, value]]), new Set([]), newEdges]
    },

    push (id, state, value) {
      const [added, removed, edges] = state
      let last = null
      while (edges.has(last) && edges.get(last)) {
        last = edges.get(last)
      }

      const elemId = createUniqueId(state, id)

      const newAdded = new Map([[elemId, value]])
      if (added.has(last)) {
        newAdded.set(last, added.get(last))
      }
      const newRemoved = new Set([])
      if (removed.has(last)) {
        newRemoved.add(last)
      }
      const newEdges = new Map([[null, last], [last, elemId], [elemId, null]])

      return [newAdded, newRemoved, newEdges]
    },

    remove,
    removeAt,

    insertAt,
    insertAllAt,

    updateAt (id, state, pos, value) {
      return join(removeAt(id, state, pos), insertAt(id, state, pos, value))
    }
  }
}

function join (s1, s2) {
  const added = new Map([...s1[0], ...s2[0]])
  const removed = new Set([...s1[1], ...s2[1]])

  const s1Edges = s1[2]
  const s2Edges = s2[2]
  const resultEdges = new Map(s1Edges)

  const edgesToAdd = new Map(s2Edges)

  if (!resultEdges.size) {
    resultEdges.set(null, null)
  }

  while (edgesToAdd.size > 0) {
    const startSize = edgesToAdd.size
    for (const edge of edgesToAdd) {
      const [key, newValue] = edge

      if (resultEdges.has(newValue)) {
        // bypass this edge, already inserted
        edgesToAdd.delete(key)
      } else if (resultEdges.has(key)) {
        insertEdge(edge)
        edgesToAdd.delete(key)
      }
    }
    if (startSize === edgesToAdd.size) {
      throw new Error('could not reduce size of edges to add')
    }
  }

  const newState = [added, removed, resultEdges]
  return newState

  function insertEdge (edge) {
    let [leftEdge, newKey] = edge

    let right = resultEdges.get(leftEdge)

    if (!newKey || right === newKey) {
      return
    }

    while (right && (compareIds(right, newKey) > 0)) {
      leftEdge = right
      right = resultEdges.get(right)
    }

    resultEdges.set(leftEdge, newKey)
    resultEdges.set(newKey, right)
  }
}

function insertAt (id, state, pos, value) {
  return insertAllAt(id, state, pos, [value])
}

function insertAllAt (id, state, pos, values) {
  const [added, removed, edges] = state
  let i = 0
  let left = null
  while (i < pos && edges.has(left)) {
    if (!removed.has(left)) {
      i++
    }
    if (edges.has(left)) {
      left = edges.get(left)
    }
    while (removed.has(left)) {
      left = edges.get(left)
    }
  }

  const newAdded = new Map()
  if (added.has(left)) {
    newAdded.set(left, added.get(left))
  }
  const newRemoved = new Set()
  if (removed.has(left)) {
    newRemoved.add(left)
  }

  const newEdges = new Map()
  newEdges.set(null, left)

  values.forEach((value) => {
    const newId = createUniqueId(state, id)
    newAdded.set(newId, value)
    newEdges.set(left, newId)
    left = newId
  })
  newEdges.set(left, null)

  return [newAdded, newRemoved, newEdges]
}

function remove (id, state, vertex) {
  return [new Map(), new Set([vertex]), new Map()]
}

function removeAt (id, state, pos) {
  const removed = state[1]
  const edges = state[2]
  let i = -1
  let elementId = null
  while (i < pos) {
    if (edges.has(elementId)) {
      elementId = edges.get(elementId)
    } else {
      throw new Error('nothing at pos ' + pos)
    }
    if (!removed.has(elementId)) {
      i++
    }
  }

  return remove(id, state, elementId)
}

function createUniqueId (state, nodeId) {
  const [, , edges] = state
  const pos = edges.size
  return encode([pos, nodeId]).toString('base64')
}

function compareIds (_id1, _id2) {
  const id1 = decode(Buffer.from(_id1, 'base64'))
  const id2 = decode(Buffer.from(_id2, 'base64'))
  const [pos1] = id1
  const [pos2] = id2
  let comparison = 0

  if (pos1 < pos2) {
    comparison = -1
  } else if (pos1 > pos2) {
    comparison = 1
  } else {
    const [, nodeId1] = id1
    const [, nodeId2] = id2
    if (nodeId1 < nodeId2) {
      comparison = -1
    } else if (nodeId1 > nodeId2) {
      comparison = 1
    }
  }

  return comparison
}
