import { v2 } from '@safe-engine/pixi'
import { Point } from 'pixi.js'

export function distance(point1: Point, point2: Point) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pointInPolygon(pos: Point, polygon: Point[]) {
  let inside = false
  const x = pos.x
  const y = pos.y

  // use some raycasting to test hits
  // https://github.com/substack/point-in-polygon/blob/master/index.js
  const length = polygon.length

  let intersect = false
  for (let i = 0, j = length - 1; i < length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y,
      xj = polygon[j].x,
      yj = polygon[j].y
    intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) {
      inside = !inside
    }
  }

  return inside
}

function lineLine(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  // jshint camel case:false

  const ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)
  const ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)
  const u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y)

  if (u_b !== 0) {
    const ua = ua_t / u_b
    const ub = ub_t / u_b

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return true
    }
  }

  return false
}

function linePolygon(A: Point, B: Point, polygon: Point[]) {
  const length = polygon.length
  for (let i = 0; i < length; ++i) {
    const C = polygon[i]
    const D = polygon[(i + 1) % length]

    if (lineLine(A, B, C, D)) {
      return true
    }
  }

  return false
}

export function pointLineDistance(point: Point, start: Point, end: Point, isSegment) {
  let dx = end.x - start.x
  let dy = end.y - start.y
  const d = dx * dx + dy * dy
  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / d
  let p

  if (!isSegment) {
    p = v2(start.x + t * dx, start.y + t * dy)
  } else if (d) {
    if (t < 0) {
      p = start
    } else if (t > 1) {
      p = end
    } else {
      p = v2(start.x + t * dx, start.y + t * dy)
    }
  } else {
    p = start
  }

  dx = point.x - p.x
  dy = point.y - p.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function polygonPolygon(pts1: Point[], pts2: Point[]) {
  let i = 0,
    l = 0

  // check if p1 pts1 intersects pts2
  for (l = pts1.length; i < l; ++i) {
    const a1 = pts1[i]
    const a2 = pts1[(i + 1) % l]

    if (linePolygon(a1, a2, pts2)) {
      return true
    }
  }

  // check if pts1 contains pts2
  for (i = 0, l = pts2.length; i < l; ++i) {
    if (pointInPolygon(pts2[i], pts1)) {
      return true
    }
  }

  // check if pts2 contains pts1
  for (i = 0, l = pts1.length; i < l; ++i) {
    if (pointInPolygon(pts1[i], pts2)) {
      return true
    }
  }

  return false
}

export function circleCircle(p1: Point, r1: number, p2: Point, r2: number) {
  const d = distance(p1, p2)
  return d < r1 + r2
}

export function polygonCircle(pts1: Point[], p2: Point, r2: number) {
  if (pointInPolygon(p2, pts1)) {
    return true
  }

  for (let i = 0, l = pts1.length; i < l; i++) {
    const start = i === 0 ? pts1[l - 1] : pts1[i - 1]
    const end = pts1[i]

    if (pointLineDistance(p2, start, end, true) < r2) {
      return true
    }
  }

  return false
}
