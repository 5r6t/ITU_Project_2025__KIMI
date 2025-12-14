import { useEffect, useRef, useState } from 'react';
import Matter, { Engine, Render, Runner, Bodies, Body, Composite, Events, Constraint } from 'matter-js';
import { useNavigate } from 'react-router-dom';
import Header from "./meta_components/Header";
import { createPinballController } from "./controllers/pinballController";
import './styles/Pinball.css';
import { useAchievements } from "./meta_components/AchievementContext";

const W = 1200;
const H = 800;
const WALL_THICKNESS = 40;
const FLIPPER_COLOR = '#e74c3c';
const BUMPER_COLOR = '#f1c40f';
const TRIANGLE_COLOR = '#00b7ff';
const SPINNER_COLOR = '#2ecc71';
const BALL_COLOR = '#ecf0f1';

const SHOP_ITEMS = [
    { id: 'bumper', name: 'Extra Bumper', price: 10, icon: 'O' },
    { id: 'triangle', name: 'Extra Triangle', price: 20, icon: 'Δ' },
    { id: 'spinner', name: 'Spinner', price: 30, icon: '■' }
];

export default function Pinball() {
    const navigate = useNavigate();

    const { completeAchievement } = useAchievements();

    const sceneRef = useRef(null);
    const engineRef = useRef(Engine.create());
    
    const userItemsComposite = useRef(Composite.create()).current;

    const leftFlipperRef = useRef(null);
    const rightFlipperRef = useRef(null);
    const plungerRef = useRef(null);
    const ballRef = useRef(null);

    const [score, setScore] = useState(0);
    const [record, setRecord] = useState(0);
    const [money, setMoney] = useState(0);
    const [placedItems, setPlacedItems] = useState([]);
    const [debugLog, setDebugLog] = useState([]);

    const controller = useRef(
        createPinballController(setScore, setRecord, setMoney, setPlacedItems, setDebugLog, completeAchievement)
    ).current;

    useEffect(() => { controller.init(); }, []);

    // --- INITIALIZACE SVĚTA ---
    useEffect(() => {
        const engine = engineRef.current;
        const world = engine.world;
        engine.gravity.y = 0.8;
        engine.positionIterations = 40;
        engine.velocityIterations = 40;

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: { width: W, height: H, wireframes: false, background: 'transparent' }
        });

        // Vykreslování textu "EXTRA"
        Events.on(render, 'afterRender', () => {
            const ctx = render.context;
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            Composite.allBodies(world).forEach(body => {
                if (body.isExtra) {
                    // Uložíme aktuální transformaci kontextu
                    ctx.save();
                    // Přesuneme se na pozici tělesa
                    ctx.translate(body.position.x, body.position.y);
                    // Otočíme kontext podle úhlu tělesa (aby text rotoval s kostkou)
                    ctx.rotate(body.angle);
                    // Obnovíme kontext
                    ctx.restore();
                }
            });
        });

        Composite.add(world, userItemsComposite);

        // ZDI
        const walls = [
            Bodies.rectangle(W/2, -WALL_THICKNESS, W, WALL_THICKNESS*2, { isStatic: true, render: { fillStyle: '#333' } }),
            Bodies.rectangle(0, H/2, WALL_THICKNESS, H, { isStatic: true, render: { fillStyle: '#333' } }),
            Bodies.rectangle(W, H/2, WALL_THICKNESS, H, { isStatic: true, render: { fillStyle: '#333' } }),
            Bodies.rectangle(W - 70, H - 200, 20, 600, { isStatic: true, render: { fillStyle: '#444' } }),
            Bodies.rectangle(W - 40, 40, 150, 20, { isStatic: true, angle: 0.8, render: { fillStyle: '#333' } }),
            Bodies.rectangle(240, H - 190, 400, 20, { isStatic: true, angle: 0.55, render: { fillStyle: '#444' }, collisionFilter: { group: -1 } }),
            Bodies.rectangle(W - 240, H - 190, 400, 20, { isStatic: true, angle: -0.55, render: { fillStyle: '#444' }, collisionFilter: { group: -2 } }),
            Bodies.rectangle(70, H / 2, 20, H, { isStatic: true, render: { fillStyle: '#444' } })
        ];

        // ZÁKLADNÍ BUMPERY
        const bumperOptions = { isStatic: true, label: 'bumper', restitution: 3, render: { fillStyle: BUMPER_COLOR } };
        const basicBumpers = [
            Bodies.circle(W / 2, 100, 30, bumperOptions),
            Bodies.circle(W / 2 - 100, 200, 30, bumperOptions),
            Bodies.circle(W / 2 + 100, 200, 30, bumperOptions)
        ];

        // TRIANGLE BUMPERY
        const triangleOptions = { isStatic: true, label: 'triangle', restitution: 3, render: { fillStyle: TRIANGLE_COLOR } };
        const triangleBumpers = [
            Bodies.polygon(W / 2 - 250, H - 300, 3, 100, {angle: -0.52, ...triangleOptions}),
            Bodies.polygon(W / 2 + 250, H - 300, 3, 100, {angle: -0.52, ...triangleOptions})
        ];

        // SPINNER BUMPERY (Statické v levém rohu)
        const spinnerOptions = { isStatic: true, label: 'spinner', restitution: 3, render: { fillStyle: SPINNER_COLOR } };
        const staticSpinners = [
            Bodies.rectangle(150, 150, 80, 80, spinnerOptions),
            Bodies.rectangle(250, 250, 80, 80, spinnerOptions)
        ];

        // FLIPPERY
        const flipperOptions = { render: { fillStyle: FLIPPER_COLOR }, chamfer: { radius: 10 }, density: 100, frictionAir: 0.05 };
        const leftFlipper = Bodies.rectangle(480, H - 75, 180, 30, { ...flipperOptions, collisionFilter: { group: -1 } });
        const leftPivot = Constraint.create({ pointA: { x: 420, y: H - 75 }, bodyB: leftFlipper, pointB: { x: -60, y: 0 }, stiffness: 1, length: 0 });
        const rightFlipper = Bodies.rectangle(W - 480, H - 75, 180, 30, { ...flipperOptions, collisionFilter: { group: -2 } });
        const rightPivot = Constraint.create({ pointA: { x: W - 420, y: H - 75 }, bodyB: rightFlipper, pointB: { x: 60, y: 0 }, stiffness: 1, length: 0 });
        
        leftFlipperRef.current = leftFlipper;
        rightFlipperRef.current = rightFlipper;

        // OSTATNÍ
        const plunger = Bodies.rectangle(W - 40, H - 20, 40, 40, { isStatic: true, render: { fillStyle: '#888' } });
        plungerRef.current = plunger;
        const resetZone = Bodies.rectangle(W/2, H + 50, W, 50, { isStatic: true, isSensor: true, label: 'reset' });

        Composite.add(world, [
            ...walls, 
            ...basicBumpers, 
            ...triangleBumpers, 
            ...staticSpinners,
            leftFlipper, leftPivot, rightFlipper, rightPivot, plunger, resetZone
        ]);

        // KLÁVESY
        const keyState = { a: false, d: false, space: false };
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyA') keyState.a = true;
            if (e.code === 'KeyD') keyState.d = true;
            if (e.code === 'Space') keyState.space = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyA') keyState.a = false;
            if (e.code === 'KeyD') keyState.d = false;
            if (e.code === 'Space') keyState.space = false;
        });

        // UPDATE LOOP
        const onBeforeUpdate = () => {
             // 1. ROTACE SPINNERŮ
             // Najdeme všechna tělesa ve světě, která mají label 'spinner'
             Composite.allBodies(world).forEach(body => {
                 if (body.label === 'spinner') {
                     // Každý snímek pootočíme o 0.1 radiánu
                     Body.setAngle(body, body.angle + 0.1);
                 }
             });

             // 2. FLIPPERY (Servo logika)
             const ANGLE_UP_LEFT = -0.55; const ANGLE_DOWN_LEFT = 0.55;
             const ANGLE_UP_RIGHT = 0.55; const ANGLE_DOWN_RIGHT = -0.55;
             const SPEED = 0.35; const TOLERANCE = 0.1;

             const lockFlipper = (body, targetAngle, pivotX, pivotY, pivotOffsetX) => {
                 Body.setAngularVelocity(body, 0); Body.setVelocity(body, { x: 0, y: 0 });
                 Body.setAngle(body, targetAngle);
                 const newX = pivotX + Math.cos(targetAngle) * pivotOffsetX;
                 const newY = pivotY + Math.sin(targetAngle) * pivotOffsetX;
                 Body.setPosition(body, { x: newX, y: newY });
             };

             // Levý
             const targetL = keyState.a ? ANGLE_UP_LEFT : ANGLE_DOWN_LEFT;
             const diffL = targetL - leftFlipper.angle;
             if (Math.abs(diffL) < TOLERANCE) lockFlipper(leftFlipper, targetL, 420, H - 80, 60);
             else Body.setAngularVelocity(leftFlipper, Math.max(Math.min(diffL * SPEED, 0.5), -0.5));

             // Pravý
             const targetR = keyState.d ? ANGLE_UP_RIGHT : ANGLE_DOWN_RIGHT;
             const diffR = targetR - rightFlipper.angle;
             if (Math.abs(diffR) < TOLERANCE) lockFlipper(rightFlipper, targetR, W - 420, H - 80, -60);
             else Body.setAngularVelocity(rightFlipper, Math.max(Math.min(diffR * SPEED, 0.5), -0.5));

             // Odpal
             if (keyState.space) {
                 if (ballRef.current && ballRef.current.position.x > W - 80 && ballRef.current.position.y > H - 150) {
                     Body.setVelocity(ballRef.current, { x: 0, y: -30 });
                 }
             }
        };
        Events.on(engine, 'beforeUpdate', onBeforeUpdate);

        // KOLIZE
        const onCollision = (event) => {
            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;
                if (bodyA.label === 'bumper' || bodyB.label === 'bumper') {
                    controller.handleHit(20); 
                }
                if (bodyA.label === 'triangle' || bodyB.label === 'triangle') {
                    controller.handleHit(10); 
                }
                // Nový hit pro Spinner (víc bodů, protože je to těžší)
                if (bodyA.label === 'spinner' || bodyB.label === 'spinner') {
                    controller.handleHit(30);
                }
                if (bodyA.label === 'reset' || bodyB.label === 'reset') {
                    controller.handleBallLost();
                    respawnBall();
                }
            });
        };
        Events.on(engine, 'collisionStart', onCollision);

        const respawnBall = () => {
            if (ballRef.current) Composite.remove(world, ballRef.current);
            const ball = Bodies.circle(W - 40, H - 100, 15, { restitution: 0.5, render: { fillStyle: BALL_COLOR }, label: 'ball', density: 0.001 });
            ballRef.current = ball;
            Composite.add(world, ball);
        };

        respawnBall();
        Render.run(render);
        const runner = Runner.create({ isFixed: true, delta: 1000 / 60 });
        Runner.run(runner, engine);

        return () => {
            Events.off(engine, 'beforeUpdate', onBeforeUpdate);
            Events.off(engine, 'collisionStart', onCollision);
            Render.stop(render);
            Runner.stop(runner);
            if (render.canvas) render.canvas.remove();
            Composite.clear(world);
            Engine.clear(engine);
        };
    }, []);

    // SYNCHRONIZACE ITEMS (Aktualizováno o Spinner)
    useEffect(() => {
        Composite.clear(userItemsComposite, false, true);
        const newBodies = placedItems.map(item => {
            const commonProps = { isStatic: true, isExtra: true };
            
            if (item.type === 'bumper') {
                return Bodies.circle(item.x, item.y, 30, {
                    ...commonProps, label: 'bumper', restitution: 3, render: { fillStyle: BUMPER_COLOR }
                });
            }
            if (item.type === 'triangle') {
                return Bodies.polygon(item.x, item.y, 3, 50, {
                    ...commonProps, angle: -0.52, label: 'triangle', restitution: 3, render: { fillStyle: TRIANGLE_COLOR }
                });
            }
            if (item.type === 'spinner') {
                return Bodies.rectangle(item.x, item.y, 80, 80, {
                    ...commonProps, label: 'spinner', restitution: 3, render: { fillStyle: SPINNER_COLOR }
                });
            }
            return null;
        }).filter(b => b !== null);
        Composite.add(userItemsComposite, newBodies);
    }, [placedItems]);

    // ... (Zbytek kódu - Drag&Drop, Render - zůstává stejný) ...

    const handleDragStart = (e, source, data) => {
        e.dataTransfer.setData("source", source);
        e.dataTransfer.setData("data", JSON.stringify(data));
    };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const source = e.dataTransfer.getData("source");
        const data = JSON.parse(e.dataTransfer.getData("data"));

        if (source === "shop") {
            controller.buyItem(data.id, Math.round(x), Math.round(y), data.price);
        } else if (source === "board") {
            controller.moveItem(data.id, Math.round(x), Math.round(y));
        }
    };
    const handleRightClick = (e, itemId) => {
        e.preventDefault();
        const refund = 100; controller.sellItem(itemId, refund);
    };

    const handleClose = () => { navigate("/"); };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header title="Pinball Builder" onClose={handleClose} />
            
            <div className="pinball-container">
                <div className="pb-middle-panel">
                    <div className="pb-game-wrapper" onDragOver={handleDragOver} onDrop={handleDrop}>
                        <div ref={sceneRef} className="pb-canvas-overlay" />
                        
                        {placedItems.map(item => (
                            <div key={item.id} draggable={true} onDragStart={(e) => handleDragStart(e, "board", item)} onContextMenu={(e) => handleRightClick(e, item.id)} style={{ position: 'absolute', left: item.x - 30, top: item.y - 30, width: 60, height: 60, borderRadius: '50%', cursor: 'grab', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'black', fontWeight: 'bold', fontSize: '10px', userSelect: 'none' }} title="Levý klik: Přesun, Pravý klik: Prodat">EXTRA</div>
                        ))}
                        
                        <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: '#0f0', padding: '10px', fontSize: '12px', pointerEvents: 'none', borderRadius: '5px', width: '200px' }}>
                            <strong>DEBUG LOG:</strong>
                            {debugLog.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                    </div>
                </div>

                <div className="pb-right-panel">
                    <div className="pb-info-box">
                        <div className="pb-score-label">Skóre</div>
                        <div className="pb-score-value">{score}</div>
                    </div>
                    <div className="pb-info-box">
                        <div className="pb-score-label">Rekord</div>
                        <div className="pb-score-value" style={{ color: '#f1c40f' }}>{Math.max(score, record)}</div>
                    </div>

                    <div className="pb-shop-section">
                        <div className="pb-money-display">$ {money}</div>
                        <button onClick={() => controller.cheatMoney()} style={{ width: '100%', background: '#f39c12', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px', color: '#111' }}>+1000g (Cheat)</button>
                        <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '15px' }}>Obchod</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {SHOP_ITEMS.map((item) => (
                                <div key={item.id} className="pb-shop-item" draggable={money >= item.price} onDragStart={(e) => handleDragStart(e, "shop", item)} style={{ opacity: money >= item.price ? 1 : 0.5, cursor: money >= item.price ? 'grab' : 'not-allowed' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '30px', height: '30px', background: '#555', display: 'grid', placeItems: 'center', borderRadius: '50%' }}>{item.icon}</div>
                                        <span>{item.name}</span>
                                    </div>
                                    <span className="pb-item-price">${item.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}></div>
                    <p style={{textAlign: 'center', color: '#666'}}>Ovládání: A / D / Space</p>
                </div>
            </div>
        </div>
    );
}