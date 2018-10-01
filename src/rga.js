'use strict'

// Replicable Growable Array (RGA)
// State is represented by 3 sets:
//   * Added Vertices (VA)
//   * Removed Vertices (VR)
//   * Edges (E)
//
// As defined in http://hal.upmc.fr/inria-00555588/document

const cuid = require('cuid')

module.exports = {
  initial: () => [
    new Map([[null, null]]), // VA
    new Set(), // VR
    new Map([[null, undefined]])], // E

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
      const elemId = cuid()
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

      const elemId = cuid()

      const newAdded = new Map([[elemId, value]])
      if (added.has(last)) {
        newAdded.set(last, added.get(last))
      }
      const newRemoved = new Set([])
      if (removed.has(last)) {
        newRemoved.add(last)
      }
      const newEdges = new Map([[null, last], [last, elemId], [elemId, undefined]])

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
    resultEdges.set(null, undefined)
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

    while (right && newKey < right) {
      leftEdge = right
      right = resultEdges.get(right)
    }

    resultEdges.delete(leftEdge)
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
  while (i < pos) {
    if (removed.has(left)) {
      left = edges.get(left)
      continue
    }
    if (edges.has(left)) {
      left = edges.get(left)
    }
    while (removed.has(left)) {
      left = edges.get(left)
    }
    i++
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
    const newId = cuid()
    newAdded.set(newId, value)
    newEdges.set(left, newId)
    left = newId
  })
  newEdges.set(left, undefined)

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
