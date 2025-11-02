import { useEffect, useRef, useState } from 'react'
import Matter, { Engine, Render, Runner, Bodies, Body, Composite, Constraint, Events } from 'matter-js'

export default function Pinball() {
  const sceneRef = useRef(null)
  const engineRef = useRef(Engine.create())
  const [score, setScore] = useState(0)

  useEffect(() => {
    const width = 600
    const height = 800
    const engine = engineRef.current
    const world = engine.world
    engine.gravity.y = 1.2

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

    // Hrací plocha – stěny
    const wallOptions = { isStatic: true, render: { fillStyle: '#1f2a44' } }
    const walls = [
      Bodies.rectangle(width / 2, height + 30, width, 60, wallOptions),         // spodek (out)
      Bodies.rectangle(width / 2, -30, width, 60, wallOptions),                  // vršek
      Bodies.rectangle(-30, height / 2, 60, height, wallOptions),                // levá
      Bodies.rectangle(width + 30, height / 2, 60, height, wallOptions)          // pravá
    ]

    // Mírně šikmé boční hrany dole, aby míček padal na flippery
    const slopeOpts = { isStatic: true, angle: 0.3, render: { fillStyle: '#24324f' } }
    const leftSlope  = Bodies.rectangle(75, 690, 160, 20, { ...slopeOpts, angle: 0.25 })
    const rightSlope = Bodies.rectangle(525, 690, 160, 20, { ...slopeOpts, angle: -0.25 })

    // Bumpery (body za náraz)
    const bumpOpts = { isStatic: true, restitution: 1.2, render: { fillStyle: '#ffda2a' } }
    const bumpers = [
      Bodies.circle(200, 200, 22, bumpOpts),
      Bodies.circle(300, 260, 22, bumpOpts),
      Bodies.circle(400, 200, 22, bumpOpts)
    ]

    // Flippery
    const flipperLen = 120, flipperThick = 20, flipperY = 720
    const flipperOpts = {
        chamfer: 10,
        density: 0.002,
        friction: 0,
        frictionAir: 0.01,
        render: { fillStyle: '#28e1fa' }
    }

    const leftFlipper  = Bodies.rectangle(0, flipperY, flipperLen, flipperThick, { ...flipperOpts, angle: -0.25 })
    const rightFlipper = Bodies.rectangle(0, flipperY, flipperLen, flipperThick, { ...flipperOpts, angle: 0.25 })

    // Klouby (otočné čepy)
    const leftPivot  = Constraint.create({ 
        bodyA: leftFlipper,
        pointA: { x: -50, y: 0 },
        pointB: { x: 160, y: flipperY },
        length: 0,
        stiffness: 1
    });
    const rightPivot = Constraint.create({
        bodyA: rightFlipper,
        pointA: { x: -flipperLen / 2 + 10, y: 0 },
        pointB: { x: 480 - flipperLen / 2 + 10, y: flipperY },
        length: 0,
        stiffness: 1
    });

    // Míček
    const ball = Bodies.circle(520, 120, 12, {
      restitution: 0.9, friction: 0.002, density: 0.003,
      render: { fillStyle: '#fff' }
    })

    Composite.add(world, [
      ...walls, leftSlope, rightSlope, ...bumpers,
      leftFlipper, rightFlipper, leftPivot, rightPivot,
      ball
    ])

    // Skóre – přičti body při nárazu do bumperu
    const scoreOnCollision = (event) => {
      for (const pair of event.pairs) {
        const labels = [pair.bodyA, pair.bodyB].map(b => b.label)
        const isBumperHit =
          bumpers.some(b => b.id === pair.bodyA.id || b.id === pair.bodyB.id)
        if (isBumperHit) setScore(s => s + 10)
      }
    }
    Events.on(engine, 'collisionStart', scoreOnCollision)

    // Ovládání – švih flipperů
    const maxLeftUp  = -1.2
    const maxLeftDown = -0.25
    const maxRightUp = 1.2
    const maxRightDown = 0.25

    const keyDown = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        Body.setAngularVelocity(leftFlipper, -15)
        Body.setAngle(leftFlipper, maxLeftUp)
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        Body.setAngularVelocity(rightFlipper, 15)
        Body.setAngle(rightFlipper, maxRightUp)
      }
      if (e.code === 'Space') {
        // jednoduchý "plunger": vystřel míček nahoru
        Body.setVelocity(ball, { x: 0, y: -25 })
      }
    }
    const keyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        Body.setAngularVelocity(leftFlipper, 5)
        Body.setAngle(leftFlipper, maxLeftDown)
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        Body.setAngularVelocity(rightFlipper, -5)
        Body.setAngle(rightFlipper, maxRightDown)
      }
    }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)

    // Reset míčku, když spadne dolů
    Events.on(engine, 'afterUpdate', () => {
      if (ball.position.y > height + 40) {
        Body.setPosition(ball, { x: 520, y: 120 })
        Body.setVelocity(ball, { x: 0, y: 0 })
      }
    })

    // Úklid
    return () => {
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      Events.off(engine, 'collisionStart', scoreOnCollision)
      Render.stop(render)
      Runner.stop(runner)
      Composite.clear(world, false)
      Engine.clear(engine)
      render.canvas.remove()
      render.textures = {}
      engineRef.current = Engine.create() // fresh engine pro návrat na stránku
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