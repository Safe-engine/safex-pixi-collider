import { GameWorld } from '@safex/pixi'

import { Collider } from '../CollideComponent'
import { CollideSystem } from '../CollideSystem'

export function shouldCollider(colA: Collider, colB: Collider) {
  const groupA = colA.node.group
  const groupB = colB.node.group
  if (groupA === undefined || groupB === undefined) {
    return true
  }
  const { colliderMatrix } = GameWorld.Instance.systems.get(CollideSystem) as CollideSystem
  return colliderMatrix[groupA][groupB]
}

export class Size {
  constructor(width, height) {
    this.width = width
    this.height = height
  }
  width: number
  height: number
}

export function size(width: number, height: number) {
  return new Size(width, height)
}
