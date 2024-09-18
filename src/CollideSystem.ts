import { app, GameWorld, NodeComp } from '@safe-engine/pixi'
import { EntityManager, System } from 'entityx-ts'
import { ComponentAddedEvent, ComponentRemovedEvent, EventManager, EventReceive } from 'entityx-ts'
import { Color, Graphics } from 'pixi.js'

import { BoxCollider, CircleCollider, Collider, CollisionType, Contract, PolygonCollider } from './CollideComponent'

export function enabledDebugDraw(enable = true) {
  const collideSystem = GameWorld.Instance.systems.get(CollideSystem)
  collideSystem.enabledDebugDraw = enable
}

export class CollideSystem implements System {
  listColliders: Collider[] = []
  _contracts: Contract[] = []
  removeColliders: Collider[] = []
  debugGraphics: Graphics
  enabledDebugDraw = true
  enabled = true

  configure(event_manager: EventManager) {
    event_manager.subscribe(ComponentAddedEvent(BoxCollider), this)
    event_manager.subscribe(ComponentAddedEvent(CircleCollider), this)
    event_manager.subscribe(ComponentAddedEvent(PolygonCollider), this)
    event_manager.subscribe(ComponentRemovedEvent(BoxCollider), this)
    event_manager.subscribe(ComponentRemovedEvent(CircleCollider), this)
    event_manager.subscribe(ComponentRemovedEvent(PolygonCollider), this)
    if (this.enabledDebugDraw) {
      this.debugGraphics = new Graphics()
      this.debugGraphics.lineStyle(4, new Color('white'))
      // this.debugGraphics.beginFill(new Color('white'))
      app.stage.addChild(this.debugGraphics)
    }
  }

  receive(type: string, event: EventReceive) {
    const ett = event.entity
    const comp = event.component as Collider

    switch (type) {
      case ComponentAddedEvent(BoxCollider):
      case ComponentAddedEvent(CircleCollider):
      case ComponentAddedEvent(PolygonCollider): {
        console.log('ComponentAddedEvent', comp)
        const collider = ett.assign(new Collider(comp))
        collider.node = ett.getComponent(NodeComp)
        comp.node = ett.getComponent(NodeComp)
        this.addCollider(collider)
        break
      }

      case ComponentRemovedEvent(BoxCollider):
      case ComponentRemovedEvent(CircleCollider):
      case ComponentRemovedEvent(PolygonCollider): {
        this.removeColliders.push(comp.getComponent(Collider))
        break
      }

      default:
        break
    }
  }
  update(entities: EntityManager, events: EventManager, dt: number) {
    if (!this.enabled) {
      return
    }
    this.listColliders.forEach((collider) => {
      if (!collider.node.active) {
        this.removeColliders.push(collider)
      }
    })
    // this.removeColliders.forEach((comp) => {
    //   this.listColliders = this.listColliders.filter((col) => !col.isEqual(comp) && col.node.active)
    //   this._contracts = this._contracts.filter((contract) => {
    //     const col1 = contract._collider1
    //     const col2 = contract._collider2
    //     if (col1.isEqual(comp) || !col1.node.active) {
    //       if (contract._touching) {
    //         // contract._touching = false
    //         if (col2.onCollisionExit) {
    //           col2.onCollisionExit(col1)
    //         }
    //       }
    //       return false
    //     }
    //     if (col2.isEqual(comp) || !col2.node.active) {
    //       if (contract._touching) {
    //         // contract._touching = false
    //         if (col1.onCollisionExit) col1.onCollisionExit(col2)
    //       }
    //       return false
    //     }
    //     return true
    //   })
    // })
    this.removeColliders = []
    let draw
    if (this.enabledDebugDraw) {
      draw = this.debugGraphics
      draw.clear()
      draw.removeFromParent()
      app.stage.addChild(draw)
      this.debugGraphics.lineStyle(4, new Color('white'))
    }
    for (const entt of entities.entities_with_components(BoxCollider)) {
      const comp = entt.getComponent(BoxCollider)
      comp.update(dt, draw)
    }
    for (const entt of entities.entities_with_components(CircleCollider)) {
      const comp = entt.getComponent(CircleCollider)
      comp.update(dt, draw)
    }
    for (const entt of entities.entities_with_components(PolygonCollider)) {
      const comp = entt.getComponent(PolygonCollider)
      comp.update(dt, draw)
    }
    // console.log(this._contracts.length)
    this._contracts.forEach((contract) => {
      const col1 = contract._collider1
      const col2 = contract._collider2
      if (!col1.node || !col2.node || !col1.node.active || !col2.node.active) {
        return
      }
      const type = contract.updateState()
      if (!col1 || !col2) {
        return
      }

      switch (type) {
        case CollisionType.ENTER: {
          if (col1.onCollisionEnter) {
            col1.onCollisionEnter(col2)
          }
          if (col2.onCollisionEnter) {
            col2.onCollisionEnter(col1)
          }
          break
        }
        case CollisionType.STAY:
          if (col1.onCollisionStay) {
            col1.onCollisionStay(col2)
          }
          if (col2.onCollisionStay) {
            col2.onCollisionStay(col1)
          }
          break
        case CollisionType.EXIT:
          if (col1.onCollisionExit) {
            col1.onCollisionExit(col2)
          }
          if (col2.onCollisionExit) {
            col2.onCollisionExit(col1)
          }
          break

        default:
          break
      }
    })
  }

  addCollider(colliderPhysics: Collider) {
    this.listColliders.forEach((col) => {
      // if (shouldCollider(col, colliderPhysics)) {
      this._contracts.push(new Contract(col, colliderPhysics))
      // }
    })
    this.listColliders.push(colliderPhysics)
  }

  removeCollider(colliderPhysics: Collider) {
    this.removeColliders.push(colliderPhysics)
  }
}
