import { useEffect, useRef, useState } from 'react';
import Matter, { Engine, Render, Runner, Bodies, Body, Composite, Events, Constraint, Vector } from 'matter-js';
import { useNavigate } from 'react-router-dom';
import Header from "./meta_components/Header";
import { createPinballController } from "./controllers/pinballController";
import './styles/Pinball.css';

// --- KONFIGURACE ---
const W = 1200;
const H = 800;
const WALL_THICKNESS = 40;
const FLIPPER_COLOR = '#e74c3c';
const BUMPER_COLOR = '#f1c40f';
const BALL_COLOR = '#ecf0f1';

// Konfigurace obchodu
const SHOP_ITEMS = [
    { id: 'bumper', name: 'Extra Bumper', price: 100, icon: 'O' },
    { id: 'flipper_s', name: 'Mini Flipper', price: 250, icon: '/' },
    { id: 'catcher', name: 'Magnet', price: 500, icon: 'U' },
];

export default function Pinball() {
    const navigate = useNavigate();
    const sceneRef = useRef(null);
    const engineRef = useRef(Engine.create());
    
    // Reference na objekty
    const leftFlipperRef = useRef(null);
    const rightFlipperRef = useRef(null);
    const plungerRef = useRef(null);
    const ballRef = useRef(null);

    // State
    const [score, setScore] = useState(0);
    const [record, setRecord] = useState(0);
    const [money, setMoney] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const controller = useRef(
        createPinballController(setScore, setRecord, setMoney, setIsPlaying, setIsPaused)
    ).current;

    useEffect(() => { controller.init(); }, []);

    useEffect(() => {
        const engine = engineRef.current;
        const world = engine.world;
        engine.gravity.y = 0.8;

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: { width: W, height: H, wireframes: false, background: 'transparent' }
        });

        // --- 1. ZDI a OHRANIČENÍ ---
        
        // Vytáhneme si šikmé zdi do proměnných, abychom jim mohli nastavit collisionFilter
        // GROUP: -1 (Levá strana), -2 (Pravá strana). 
        // Objekty se stejným záporným číslem se NIKDY nesrazí.
        const leftSlingshot = Bodies.rectangle(200, H - 150, 400, 20, { 
            isStatic: true, 
            angle: 0.55, // Trochu strmější úhel
            render: { fillStyle: '#444' },
            collisionFilter: { group: -1 } // <--- ZMĚNA: Skupina -1
        });

        const rightSlingshot = Bodies.rectangle(W - 300, H - 150, 400, 20, { 
            isStatic: true, 
            angle: -0.55, 
            render: { fillStyle: '#444' },
            collisionFilter: { group: -2 } // <--- ZMĚNA: Skupina -2
        });

        const walls = [
            Bodies.rectangle(W/2, -WALL_THICKNESS, W, WALL_THICKNESS*2, { isStatic: true, render: { fillStyle: '#333' } }),
            Bodies.rectangle(0, H/2, WALL_THICKNESS, H, { isStatic: true, render: { fillStyle: '#333' } }),
            Bodies.rectangle(W, H/2, WALL_THICKNESS, H, { isStatic: true, render: { fillStyle: '#333' } }),
            Bodies.rectangle(W - 80, H - 200, 20, 600, { isStatic: true, render: { fillStyle: '#444' } }),
            Bodies.rectangle(W - 40, 40, 150, 20, { isStatic: true, angle: 0.7, render: { fillStyle: '#444' } }),
            leftSlingshot, // Přidáme naše upravené slingshoty
            rightSlingshot
        ];

        // --- 2. BUMPERY ---
        const bumperOptions = { isStatic: true, label: 'bumper', restitution: 1.5, render: { fillStyle: BUMPER_COLOR } };
        const bumpers = [
            Bodies.circle(W / 2, 250, 30, bumperOptions),
            Bodies.circle(W / 2 - 150, 350, 30, bumperOptions),
            Bodies.circle(W / 2 + 150, 350, 30, bumperOptions)
        ];

        // --- 3. FLIPPERY (Páčky) ---
        // Nyní jim nastavíme collisionFilter, aby ignorovaly své sousední zdi
        
        // Levý flipper
        const leftFlipper = Bodies.rectangle(380, H - 80, 180, 20, { 
            render: { fillStyle: FLIPPER_COLOR },
            chamfer: { radius: 10 },
            collisionFilter: { group: -1 } // <--- ZMĚNA: Ignoruje leftSlingshot (-1)
        });
        const leftPivot = Constraint.create({
            pointA: { x: 320, y: H - 80 },
            bodyB: leftFlipper,
            pointB: { x: -60, y: 0 },
            stiffness: 1, length: 0
        });

        // Pravý flipper
        const rightFlipper = Bodies.rectangle(W - 480, H - 80, 180, 20, { 
            render: { fillStyle: FLIPPER_COLOR },
            chamfer: { radius: 10 },
            collisionFilter: { group: -2 } // <--- ZMĚNA: Ignoruje rightSlingshot (-2)
        });
        const rightPivot = Constraint.create({
            pointA: { x: W - 420, y: H - 80 },
            bodyB: rightFlipper,
            pointB: { x: 60, y: 0 },
            stiffness: 1, length: 0
        });

        leftFlipperRef.current = leftFlipper;
        rightFlipperRef.current = rightFlipper;

        // 4. ODPALOVAČ a RESET
        const plunger = Bodies.rectangle(W - 40, H - 20, 60, 40, { isStatic: true, render: { fillStyle: '#888' } });
        plungerRef.current = plunger;
        const resetZone = Bodies.rectangle(W/2, H + 50, W, 50, { isStatic: true, isSensor: true, label: 'reset' });

        Composite.add(world, [
            ...walls, ...bumpers, 
            leftFlipper, leftPivot, 
            rightFlipper, rightPivot, 
            plunger, resetZone
        ]);

        // 5. OVLÁDÁNÍ
        const keyState = { a: false, d: false, space: false };
        const handleKeyDown = (e) => {
            if (e.code === 'KeyA') keyState.a = true;
            if (e.code === 'KeyD') keyState.d = true;
            if (e.code === 'Space') keyState.space = true;
        };
        const handleKeyUp = (e) => {
            if (e.code === 'KeyA') keyState.a = false;
            if (e.code === 'KeyD') keyState.d = false;
            if (e.code === 'Space') keyState.space = false;
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // --- 6. LOGIKA UPDATE (Oprava padání flipperů) ---
        const onBeforeUpdate = () => {
            // Konstanty pro limity úhlů (v radiánech)
            // 0 je vodorovně, záporné je nahoru, kladné dolů
            const MAX_UP = -0.5;   // Jak moc nahoru může jít
            const MAX_DOWN = 0.5;  // Jak moc dolů (klidová poloha)

            // Levý Flipper
            if (keyState.a) {
                // Jdeme nahoru
                if (leftFlipper.angle > MAX_UP) {
                    Body.setAngularVelocity(leftFlipper, -0.45); // Rychlost nahoru
                } else {
                    // Tvrdý limit nahoře (zastaví se)
                    Body.setAngle(leftFlipper, MAX_UP);
                    Body.setAngularVelocity(leftFlipper, 0);
                }
            } else {
                // Padáme dolů (Gravity + pomoc)
                if (leftFlipper.angle < MAX_DOWN) {
                    Body.setAngularVelocity(leftFlipper, 0.15); // Rychlost návratu
                } else {
                    // Tvrdý limit dole (ZARÁŽKA)
                    Body.setAngle(leftFlipper, MAX_DOWN);
                    Body.setAngularVelocity(leftFlipper, 0);
                }
            }

            // Pravý Flipper (zrcadlově obrácené úhly)
            if (keyState.d) {
                if (rightFlipper.angle < -MAX_UP) { // 0.5 (nahoru je pro pravý kladné číslo, pokud je otočený... moment, Matter úhly jsou globální)
                    // Pozor: Pravý flipper má 0 vodorovně.
                    // Aby šel špičkou nahoru, musí rotovat DOPRAVA (kladná velocity) -> úhel se zvětšuje?
                    // Ne, počkat. Pravý flipper má pant vlevo (z jeho pohledu).
                    // Zkusme logiku: Pravý flipper pivot je W-420. Špička směřuje doprava.
                    // Aby šel nahoru, musí se točit PROTI směru hodinových ručiček (záporné) pokud je špička vlevo od pivotu.
                    // Ale my máme pivot W-420 a těleso W-480. Těleso je VLEVO od pivotu. Špička směřuje doleva.
                    // Takže nahoru = po směru hodinových ručiček = KLADNÁ velocity.
                    
                    // Zkusíme empiricky podle tvého původního kódu:
                    // Původně jsi měl: Body.setAngularVelocity(rightFlipper, 0.25); -> Jde nahoru.
                    // Takže MAX_UP pro pravý bude cca 0.5 a MAX_DOWN bude -0.5
                    
                    if (rightFlipper.angle < 0.5) {
                        Body.setAngularVelocity(rightFlipper, 0.45);
                    } else {
                        Body.setAngle(rightFlipper, 0.5);
                        Body.setAngularVelocity(rightFlipper, 0);
                    }
                } else {
                    // Dolů
                    if (rightFlipper.angle > -0.5) {
                        Body.setAngularVelocity(rightFlipper, -0.15);
                    } else {
                        Body.setAngle(rightFlipper, -0.5);
                        Body.setAngularVelocity(rightFlipper, 0);
                    }
                }
            }

            // Odpalovač
            if (keyState.space) {
                if (ballRef.current && ballRef.current.position.x > W - 80 && ballRef.current.position.y > H - 150) {
                    Body.setVelocity(ballRef.current, { x: 0, y: -35 });
                }
            }
        };
        Events.on(engine, 'beforeUpdate', onBeforeUpdate);

        // 7. KOLIZE
        const onCollision = (event) => {
            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;
                if (bodyA.label === 'bumper' || bodyB.label === 'bumper') {
                    setScore(p => p + 10); setMoney(p => p + 10);
                }
                if (bodyA.label === 'reset' || bodyB.label === 'reset') {
                    respawnBall();
                }
            });
        };
        Events.on(engine, 'collisionStart', onCollision);

        const respawnBall = () => {
            if (ballRef.current) Composite.remove(world, ballRef.current);
            const ball = Bodies.circle(W - 40, H - 100, 15, { restitution: 0.5, render: { fillStyle: BALL_COLOR }, label: 'ball' });
            ballRef.current = ball;
            Composite.add(world, ball);
        };

        respawnBall();
        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            Events.off(engine, 'beforeUpdate', onBeforeUpdate);
            Events.off(engine, 'collisionStart', onCollision);
            Render.stop(render);
            Runner.stop(runner);
            if (render.canvas) render.canvas.remove();
            Composite.clear(world);
            Engine.clear(engine);
        };
    }, []);

    // ... (Zbytek komponenty - handleStart, return JSX - zůstává stejný) ...
    
    // Pro úplnost, zbytek kódu tlačítek a layoutu:
    const handleStart = () => { controller.startGame(); };
    const handlePause = () => { controller.togglePause(isPaused); };
    const handleClose = () => { navigate("/"); };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header title="Pinball Builder" onClose={handleClose} />
            <div className="pinball-container">
                <div className="pb-left-panel">
                    <div className="pb-money-display">$ {money}</div>
                    <h3>Obchod</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {SHOP_ITEMS.map((item) => (
                            <div key={item.id} className="pb-shop-item">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', background: '#555', display: 'grid', placeItems: 'center', borderRadius: '50%' }}>{item.icon}</div>
                                    <span>{item.name}</span>
                                </div>
                                <span className="pb-item-price">${item.price}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="pb-middle-panel">
                    <div className="pb-game-wrapper">
                        <div ref={sceneRef} className="pb-canvas-overlay" />
                    </div>
                </div>
                <div className="pb-right-panel">
                    <div className="pb-info-box"><div className="pb-score-label">Skóre</div><div className="pb-score-value">{score}</div></div>
                    <div className="pb-info-box"><div className="pb-score-label">Rekord</div><div className="pb-score-value" style={{ color: '#f1c40f' }}>{record}</div></div>
                    <div style={{ flex: 1 }}></div>
                    <p style={{textAlign: 'center', color: '#666'}}>Ovládání: A / D / Space</p>
                    {!isPlaying ? ( <button className="pb-btn pb-btn-start" onClick={handleStart}>START HRY</button> ) : ( <><button className="pb-btn pb-btn-pause" onClick={handlePause}>{isPaused ? "POKRAČOVAT" : "PAUZA ⏸"}</button><button className="pb-btn pb-btn-stop" onClick={() => controller.gameOver(score, money)}>UKONČIT</button></> )}
                </div>
            </div>
        </div>
    );
}