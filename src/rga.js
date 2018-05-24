'use strict'

// Replicable Growable Array (RGA)
// State is represented by 3 sets:
//   * Added Vertices (VA)
//   * Removed Vertices (VR)
//   * Edges (E)
//
// As defined in http://hal.upmc.fr/inria-00555588/document

const cuid = require('cuid')

module.exports = (id) => ({
  initial: () => [
    new Map([[null, null]]), // VA
    new Set(), // VR
    new Map([[null, undefined]])], // E

  join (s1, s2) {
    const s1Edges = s1[2]
    const s2Edges = s2[2]
    console.log('s2Edges:', s2Edges)
    const resultEdges = new Map(s1Edges)

    sortEdges(s2Edges).forEach((edge) => {
      let [leftEdge, newKey] = edge
      let right = resultEdges.get(leftEdge)
      if (newKey === right) {
        return
      }
      while (right && newKey > right) {
        console.log('going right')
        leftEdge = right
        right = resultEdges.get(right)
      }

      if (newKey) {
        resultEdges.set(leftEdge, newKey)
        resultEdges.set(newKey, right)
      }
    })

    const newState = [new Map([...s1[0], ...s2[0]]), new Set([...s1[1], ...s2[1]]), resultEdges]
    return newState
  },

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
    addRight (s, beforeVertex, value) {
      const elemId = cuid()
      const [added, removed, edges] = s
      let l = beforeVertex
      let r = edges.get(beforeVertex)
      const newEdges = new Map()
      newEdges.set(l, elemId)
      newEdges.set(elemId, r)

      return [new Map([[elemId, value]]), new Set([]), newEdges]
    },

    push (state, value) {
      const edges = state[2]
      let last = null
      while (edges.has(last) && (edges.get(last) !== undefined)) {
        last = edges.get(last)
      }

      const elemId = cuid()

      return [new Map([[elemId, value]]), new Set([]), new Map([[last, elemId], [elemId, undefined]])]
    },

    remove,
    removeAt,

    set (pos, value) {
      const state = this
      const messages = []
      const edges = state[2]
      let i = -1
      let id = null
      while (i < pos) {
        let next
        if (edges.has(id)) {
          next = edges.get(id)
        }
        if (!next) {
          next = cuid()
          messages.push([[id, null, next]])
        }
        id = next
        i++
      }
      if (edges.has(id)) {
        messages.push(exports.mutators.remove.call(state, id)) // remove
      }
      messages.push([[id, value, cuid()]])
      return pull.values(messages)
    },

    insertAt (state, pos, value) {
      const messages = []
      const edges = state[2]
      const removed = state[1]
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
        i++
      }

      const newId = cuid()
      console.log('left is', left, state[0].get(left))
      return [new Map([[newId, value]]), new Set(), new Map([[left, newId]])]
    }
  }
})

function remove (state, vertex) {
  return [new Map(), new Set([vertex]), new Map()]
}

function removeAt (state, pos) {
  const removed = state[1]
  const edges = state[2]
  let i = -1
  let id = null
  while (i < pos) {
    if (edges.has(id)) {
      id = edges.get(id)
    } else {
      throw new Error('nothing at pos ' + pos)
    }
    if (!removed.has(id)) {
      i++
    }
  }

  return remove(state, id)
}

function sortEdges (_edges) {
  const edges = new Map(_edges)
  const hasKey = new Set()
  const sortedEdges = []
  const keys = Array.from(edges.keys())
  while (sortedEdges.length < keys.length) {
    for (let key of keys) {
      const value = edges.get(key)
      edges.delete(key)
      if (!edges.has(key)) {
        hasKey.add(key)
        sortedEdges.push([key, value])
      }
    }
  }
  return sortedEdges
}
