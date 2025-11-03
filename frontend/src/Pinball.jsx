import { useEffect, useRef, useState } from 'react'
import Matter, { Engine, Render, Runner, Bodies, Body, Composite, Constraint, Events } from 'matter-js'

export default function Pinball() {
  const sceneRef = useRef(null)
  const engineRef = useRef(Engine.create())
  const [score, setScore] = useState(0)

  useEffect(() => {

    // Window size
    const width = 1600
    const height = width / 2

    // Physics engine
    const engine = engineRef.current
    const world = engine.world

    // Canvas renderer
    const render = Render.create({
      element: sceneRef.current,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#0b1020'
      }
    })
    Render.run(render)
    const runner = Runner.create()
    Runner.run(runner, engine)
    // 120 FPS
    runner.delta = 1000 / 120;

    // Border walls
    const borderOptions = { isStatic: true, render: { fillStyle: '#000000ff' } }
    const borderWidth = width * 1 / 40
    const borderOffsetFromEdge = width * 1 / 80
    const borders = [
      // Bottom - disabled for reset zone
      // Bodies.rectangle(width / 2, height + borderOffsetFromEdge, width, borderWidth, borderOptions),
      // Top
      Bodies.rectangle(width / 2, -borderOffsetFromEdge, width, borderWidth, borderOptions),
      // Left
      Bodies.rectangle(-borderOffsetFromEdge, height / 2, borderWidth, height, borderOptions),
      // Right
      Bodies.rectangle(width + borderOffsetFromEdge, height / 2, borderWidth, height, borderOptions)
    ]

    // Reset zone at the bottom
    const resetZone = Bodies.rectangle(width / 2, height + borderOffsetFromEdge, width, borderWidth, {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: '#ff0000ff' }
    })

    // Side slopes
    const slopeOptions = { isStatic: true, render: { fillStyle: '#24324f' } }
    const slopeLength = width * 1 / 4
    const slopeWidth = width * 1 / 80
    const slopes = [
      Bodies.rectangle(width * 1 / 4, height * 3 / 4, slopeLength, slopeWidth, { ...slopeOptions, angle: 0.4 }),
      Bodies.rectangle(width * 3 / 4, height * 3 / 4, slopeLength, slopeWidth, { ...slopeOptions, angle: -0.4 }),
      Bodies.rectangle(width * 0.8 / 8, height * 2.72 / 4, slopeLength, slopeWidth, { ...slopeOptions, angle: 0.4 }),
      Bodies.rectangle(width * 7.2 / 8, height * 2.72 / 4, slopeLength, slopeWidth, { ...slopeOptions, angle: -0.4 }),
      Bodies.rectangle(width * 1 / 4, height * 1.2 / 4, slopeWidth, slopeLength, { ...slopeOptions }),
      Bodies.rectangle(width * 3 / 4, height * 1.2 / 4, slopeWidth, slopeLength, { ...slopeOptions })
    ]

    // Bumpers
    const bumperOptions = { isStatic: true, restitution: 1.2, render: { fillStyle: '#ffff00' } }
    const bumperSize = width * 1 / 40
    const bumpers = [ 
      Bodies.circle(width * 2 / 5, height * 2 / 5, bumperSize, bumperOptions),
      Bodies.circle(width * 1 / 2, height * 1 / 5, bumperSize, bumperOptions),
      Bodies.circle(width * 3 / 5, height * 2 / 5, bumperSize, bumperOptions)
    ]
    // Score – add points when hitting a bumper
    const scoreOnCollision = (event) => {
      for (const pair of event.pairs) {
        const labels = [pair.bodyA, pair.bodyB].map(b => b.label)
        const isBumperHit =
          bumpers.some(b => b.id === pair.bodyA.id || b.id === pair.bodyB.id)
        if (isBumperHit) setScore(s => s + 10)
      }
    }
    Events.on(engine, 'collisionStart', scoreOnCollision)

    // Ball
    const ballRadius = width * 1 / 160
    const ballSpawn = { x: width * 5 / 6 + width * 1 / 80, y: height / 2 }
    const ball = Bodies.circle(ballSpawn.x, ballSpawn.y, ballRadius, {
      density: 1,
      friction: 0,
      frictionAir: 0.01,
      restitution: 0.618,
      render: { fillStyle: '#ffffff' }
    })
    // Reset the ball if it falls into the reset zone
    Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      if (
        (pair.bodyA === ball && pair.bodyB === resetZone) ||
        (pair.bodyB === ball && pair.bodyA === resetZone)
      ) {
        // Reset lopty
        Body.setPosition(ball, { x: ballSpawn.x, y: ballSpawn.y })
        Body.setVelocity(ball, { x: 0, y: 0 })
      }
      }
    })

    // Cannon (ball launcher)
    function makeCurvedExit({
      startX,
      startY,
      segments = 6,
      segmentLength = 25,
      radius = 100,
      startAngle = 0.65,
      angleStep = 0.15,
      color = '#24324f'
    }) {
      const parts = []
      for (let i = 0; i < segments; i++) {
        const angle = startAngle - i * angleStep
        const x = startX - Math.cos(angle) * radius
        const y = startY - Math.sin(angle) * radius

        parts.push(
          Bodies.rectangle(x, y, segmentLength, 20, {
            isStatic: true,
            angle: angle - Math.PI / 2,
            render: { fillStyle: color }
          })
        )
      }
      return parts
    }
    const curve_top = makeCurvedExit({
      startX: width * 4.7 / 6,
      startY: height * 0.6 / 4,
      segments: 11,
      segmentLength: 25,
      radius: 120,
      startAngle: 3.15,
      angleStep: 0.1,
      color: '#24324f'
    })
    const cannon = [
      Bodies.rectangle(width * 5 / 6, height / 2.5, height / 2, width * 1 / 80, { ...slopeOptions, angle: 1.571 }),   //  prava stena
      Bodies.rectangle(width * 5 / 6 + width * 1 / 40, height / 2.5, height / 2, width * 1 / 80, { ...slopeOptions, angle: 1.571 }),  //  lava stena
      ...curve_top
    ]

    // Flippers
    const flipperOptions = { density: 1, friction: 0, frictionAir: 0.1, render: { fillStyle: '#00ff00' } }
    const flipperLength = width * 1 / 10
    const flipperWidth = width * 1 / 80
    const leftFlipperX = width * 3.35 / 8
    const rightFlipperX = width * 4.65 / 8
    const flipperY = height * 6.82 / 8
    const leftFlipper = Bodies.rectangle(leftFlipperX, flipperY, flipperLength, flipperWidth, { ...flipperOptions })
    const rightFlipper = Bodies.rectangle(rightFlipperX, flipperY, flipperLength, flipperWidth, { ...flipperOptions })
    // Left flipper hinge
    const leftFlipperConstraint = Constraint.create({
      bodyA: leftFlipper,
      pointA: { x: -flipperLength / 2, y: 0 },
      pointB: { x: leftFlipperX - flipperLength / 2, y: flipperY },
      stiffness: 0.5,
      length: 0
    })
    // Right flipper hinge
    const rightFlipperConstraint = Constraint.create({
      bodyA: rightFlipper,
      pointA: { x: flipperLength / 2, y: 0 },
      pointB: { x: rightFlipperX + flipperLength / 2, y: flipperY },
      stiffness: 0.5,
      length: 0
    })

    // Flipper blockers
    const flipperBlockerOptions = { isStatic: true, render: { fillStyle: '#00ff00' } }
    const leftFlipperBlocker = Bodies.circle(leftFlipperX + flipperLength / 4, flipperY + 75, flipperWidth / 2, flipperBlockerOptions)
    const rightFlipperBlocker = Bodies.circle(rightFlipperX - flipperLength / 4, flipperY + 75, flipperWidth / 2, flipperBlockerOptions)

    // Keyboard controls
    const up = { left: false, right: false }
    const down = { left: false, right: false }
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    let leftLocked = false;
    let rightLocked = false;
    const onKeyDown = async (e) => {
      // Left flipper
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && !leftLocked) {
        leftLocked = true;       // 🔒 Block further press attempts
        up.left = true;        // activate flipper
        await sleep(100);        // wait 0.1 s while flipper goes up
        up.left = false;       // deactivate flipper
        down.left = true;     // activate flipper down
        await sleep(50);       // wait 0.05 s while flipper goes down
        down.left = false;    // deactivate flipper down
        await sleep(350);       // wait a bit before unlocking
        leftLocked = false;      // 🔓 Unblock
      }
      // Right flipper
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && !rightLocked) {
        rightLocked = true;
        up.right = true;
        await sleep(100);
        up.right = false;
        down.right = true;
        await sleep(50);
        down.right = false;
        await sleep(350);
        rightLocked = false;
      }
      // Launch the ball
      if (e.code === 'Space') {
        // Launch the ball
        Body.setVelocity(ball, { x: 0, y: -30 })
      }
    }
    window.addEventListener('keydown', onKeyDown)

    // Flipper control on each update
    Matter.Events.on(engine, 'beforeUpdate', () => {
      const flipperSpeed = 0.25
      if (up.left) {
        Body.setAngularVelocity(leftFlipper, -flipperSpeed)
      }
      if (down.left) {
        Body.setAngularVelocity(leftFlipper, flipperSpeed)
      }
      if (up.right) {
        Body.setAngularVelocity(rightFlipper, flipperSpeed)
      }
      if (down.right) {
        Body.setAngularVelocity(rightFlipper, -flipperSpeed)
      }
    })

    // Add all static bodies to the world
    Composite.add(world, [
      ...borders, resetZone,
      ...slopes,
      ...cannon,
      leftFlipper, rightFlipper,
      leftFlipperConstraint, rightFlipperConstraint,
      leftFlipperBlocker, rightFlipperBlocker,
      ball, ...bumpers
    ])

    // Cleanup on unmount
    return () => {
      Events.off(engine, 'collisionStart')
      Events.off(engine, 'beforeUpdate')
      window.removeEventListener('keydown', onKeyDown)
      Render.stop(render)
      Runner.stop(runner)
      Composite.clear(world, false)
      Engine.clear(engine)
      render.canvas.remove()
      render.textures = {}
      engineRef.current = Engine.create() // fresh engine for returning to the page
    }
  }, [])

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'white' }}>
      <div style={{ position: 'relative' }}>
        <div ref={sceneRef} />
        <div style={{ position: 'absolute', top: 8, left: 8, padding: '6px 10px', background: '#0008', borderRadius: 8 }}>
          <strong>Skóre:</strong> {score} &nbsp; | &nbsp;
          ⬅️/A &nbsp; ➡️/D — flippery, Space — vystřelit
        </div>
      </div>
    </div>
  )
}