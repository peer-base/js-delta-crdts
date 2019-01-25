/* eslint max-depth: "off" */
'use strict'

// Replicable Growable Array (RGA)
// State is represented by 4 sets:
//   * Added Vertices (VA)
//   * Removed Vertices (VR)
//   * Edges (E)
//   * Unmerged Edges (UE)
//
// As defined in http://hal.upmc.fr/inria-00555588/document

const assert = require('assert')
const { encode, decode } = require('delta-crdts-msgpack-codec')

module.exports = {
  initial: () => [
    new Map([[null, null]]), // VA
    new Set(), // VR
    new Map([[null, null]]), // E
    new Set() // UE
  ],

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

  mutators: {
    addRight (id, s, beforeVertex, value) {
      const elemId = createUniqueId(s, id)
      const edges = s[2]
      let l = beforeVertex
      let r = edges.get(beforeVertex)
      const newEdges = new Map()
      newEdges.set(l, elemId)
      newEdges.set(elemId, r)

      return [new Map([[elemId, value]]), new Set(), newEdges, new Set()]
    },

    push (id, state, value) {
      const [, , edges] = state
      let last = null
      while (edges.has(last) && edges.get(last)) {
        last = edges.get(last)
      }

      const elemId = createUniqueId(state, id)

      const newAdded = new Map([[elemId, value]])
      const newRemoved = new Set()
      const newEdges = new Map([[last, elemId]])

      return [newAdded, newRemoved, newEdges, new Set()]
    },

    remove,
    removeAt,

    insertAt,
    insertAllAt,

    updateAt (id, state, pos, value) {
      return join(insertAt(id, state, pos, value), removeAt(id, state, pos))
    }
  }
}

function join (s1, s2, options = {}) {
  const added = new Map([...s1[0], ...s2[0]])
  const removed = new Set([...s1[1], ...s2[1]])

  const s1Edges = s1[2]
  const s2Edges = s2[2]
  const resultEdges = new Map(s1Edges)

  const unmergedEdges = new Set([...(s1[3] || new Set()), ...(s2[3] || new Set())])

  const edgesToAdd = new Map(s2Edges)

  if (!resultEdges.size) {
    resultEdges.set(null, null)
  }

  while (edgesToAdd.size > 0) {
    for (const edge of edgesToAdd) {
      const [key, newValue] = edge

      if (resultEdges.has(newValue)) {
        // bypass this edge, already inserted
      } else if (resultEdges.has(key)) {
        if (!added.has(newValue)) {
          unmergedEdges.add(edge)
        } else {
          insertEdge(edge)
        }
      } else {
        unmergedEdges.add(edge)
      }
      edgesToAdd.delete(key)
    }
  }

  if (unmergedEdges.size) {
    let progress = false
    do {
      const countBefore = unmergedEdges.size
      for (const edge of unmergedEdges) {
        const [key, newValue] = edge
        if (resultEdges.has(newValue)) {
          // bypass this edge, already inserted
          unmergedEdges.delete(edge)
        } else if (resultEdges.has(key) && added.has(key)) {
          insertEdge(edge)
          unmergedEdges.delete(edge)
        }
      }

      progress = unmergedEdges.size < countBefore
    } while (progress)
  }

  return [added, removed, resultEdges, unmergedEdges]

  function insertEdge (edge) {
    let [leftEdge, newKey] = edge

    let right = resultEdges.get(leftEdge) || null

    if (!newKey || right === newKey) {
      return
    }

    while (right && (compareIds(right, newKey) > 0)) {
      leftEdge = right
      right = resultEdges.get(right) || null
    }

    resultEdges.set(leftEdge, newKey)
    resultEdges.set(newKey, right)
  }
}

function insertAt (id, state, pos, value) {
  return insertAllAt(id, state, pos, [value])
}

function insertAllAt (id, state, pos, values) {
  const [, removed, edges] = state
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
  const newRemoved = new Set()
  if (removed.has(left)) {
    newRemoved.add(left)
  }

  const newEdges = new Map()

  values.forEach((value, index) => {
    const newId = createUniqueId(state, id, index)
    newAdded.set(newId, value)
    newEdges.set(left, newId)
    left = newId
  })

  return [newAdded, newRemoved, newEdges, new Set()]
}

function remove (id, state, vertex) {
  return [new Map(), new Set([vertex]), new Map(), new Set()]
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

function createUniqueId (state, nodeId, index = 0) {
  const [, , edges] = state
  const pos = edges.size + index
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
    if (typeof nodeId1 === 'object' || typeof nodeId2 === 'object') {
      // Buffer has a .compare() method
      assert(nodeId1.compare, 'object comparison needs compare method')
      comparison = nodeId1.compare(nodeId2)
    } else {
      if (nodeId1 < nodeId2) {
        comparison = -1
      } else if (nodeId1 > nodeId2) {
        comparison = 1
      }
    }
  }

  return comparison
}
