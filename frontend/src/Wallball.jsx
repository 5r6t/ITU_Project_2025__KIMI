import { useEffect, useRef, useState } from 'react';
import Matter, { Engine, Render, Runner, Bodies, Body, Composite, Events, Sleeping } from 'matter-js';
import { useNavigate } from 'react-router-dom';
import Header from "./meta_components/Header";
import { createWallballController } from "./controllers/wallballController";
import './styles/Wallball.css';
import { LEVELS } from "./wallball_levels";
import confetti from 'canvas-confetti';

// ... (Konstanty a helpery zůstávají beze změny) ...
const CELL_SIZE = 120;
const WALL_COLOR = '#dddddd';
const START_COLOR = '#00ff00';
const GOAL_COLOR = '#111111';
const GOAL_OUTLINE_COLOR = '#888888';
const PLAYER_PIECE_COLOR = '#0088ff';

// ... (getPos, createPieceBody, renderGrid, PieceIcon, LevelMenu - VŠE STEJNÉ) ...
const getPos = (col, row) => {
    return { x: col * CELL_SIZE + (CELL_SIZE / 2), y: row * CELL_SIZE + (CELL_SIZE / 2) };
};

const createPieceBody = (x, y, type, size, color) => {
    const options = { isStatic: true, label: 'player_piece', render: { fillStyle: color } };
    switch (type) {
        case 'square': return Bodies.rectangle(x, y, size, size, options);
        case 'triangle_left': return Bodies.fromVertices(x-20, y+20, [{x:0,y:0},{x:size,y:size},{x:0,y:size}], options);
        case 'triangle_right': return Bodies.fromVertices(x+20, y+20, [{x:size,y:0},{x:size,y:size},{x:0,y:size}], options);
        default: return Bodies.rectangle(x, y, size, size, options);
    }
};

// Efekt konfet vystřelujících ze stran
const triggerWinConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
        // Vystřelíme dvě salvy - jednu zleva, jednu zprava
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 }, // Levá strana
            colors: ['#27ae60', '#2ecc71', '#f1c40f'] // Zelená a zlatá
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 }, // Pravá strana
            colors: ['#27ae60', '#2ecc71', '#f1c40f']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
};

const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 5; col++) {
            const isDark = (row + col) % 2 === 1;
            cells.push(<div key={`${row}-${col}`} className={`wb-grid-cell ${isDark ? 'wb-cell-dark' : 'wb-cell-light'}`} />);
        }
    }
    return cells;
};
const PieceIcon = ({ type, color }) => {
    const s = 34; 
    const svgProps = { width: s, height: s, viewBox: `0 0 ${s} ${s}`, style: { filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.5))' } };
    switch (type) {
        case 'square': return (<svg {...svgProps}><rect x="2" y="2" width={s-4} height={s-4} fill={color} stroke="white" strokeWidth="2" /></svg>);
        case 'triangle_left': return (<svg {...svgProps}><polygon points={`2,2 ${s-2},${s-2} 2,${s-2}`} fill={color} stroke="white" strokeWidth="2" /></svg>);
        case 'triangle_right': return (<svg {...svgProps}><polygon points={`${s-2},2 ${s-2},${s-2} 2,${s-2}`} fill={color} stroke="white" strokeWidth="2" /></svg>);
        default: return <div style={{width: s, height: s, background: color}}></div>;
    }
};
const LevelMenu = ({ isOpen, onClose, levels, maxUnlocked, currentLevel, onSelectLevel }) => {
    if (!isOpen) return null;
    return (
        <div className="wb-modal-overlay">
            <div className="wb-modal-content">
                <h2>Výběr Levelu</h2>
                <div className="wb-level-grid">
                    {levels.map((lvl) => {
                        const isLocked = lvl.id > maxUnlocked;
                        return (
                            <button key={lvl.id} className={`wb-level-btn ${lvl.id === currentLevel ? 'active' : ''}`} disabled={isLocked} onClick={() => { onSelectLevel(lvl.id); onClose(); }}>{lvl.id}</button>
                        );
                    })}
                </div>
                <button className="wb-close-btn" onClick={onClose}>Zavřít</button>
            </div>
        </div>
    );
};

export default function Wallball() {
    const navigate = useNavigate();
    const sceneRef = useRef(null);
    const engineRef = useRef(Engine.create());
    const ballBodyRef = useRef(null);

    const [level, setLevel] = useState(1);
    const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1);
    const [difficulty, setDifficulty] = useState("Lehká");
    const [description, setDescription] = useState("Úvodní level - dostaň míček dolů.");
    const [isPlaying, setIsPlaying] = useState(false);
    const [showLevelMenu, setShowLevelMenu] = useState(false);
    
    const controller = useRef(createWallballController(setLevel, setMaxUnlockedLevel, setDifficulty, setDescription)).current;
    const [currentLevelConfig, setCurrentLevelConfig] = useState(null);
    
    const [placedPieces, setPlacedPieces] = useState([]);
    const placedPiecesRef = useRef([]);

    // Načtení a Setup Fyziky (STEJNÉ)
    useEffect(() => {
        const loadGame = async () => {
             const unlocked = await controller.init();
             changeLevel(unlocked);
        };
        loadGame();
    }, []);

    const changeLevel = (levelId) => {
        const config = controller.loadLevel(levelId);
        if (config) setCurrentLevelConfig(config);
    };

    useEffect(() => {
        if (!currentLevelConfig) return;
        const width = 600; const height = 720;
        const engine = engineRef.current; const world = engine.world;
        engine.gravity.y = 1; 

        Composite.clear(world); 
        setIsPlaying(false); setPlacedPieces([]); placedPiecesRef.current = []; ballBodyRef.current = null;

        const render = Render.create({ element: sceneRef.current, engine: engine, options: { width, height, wireframes: false, background: 'transparent' } });
        const gameObjects = [];

        if (currentLevelConfig.walls) {
            currentLevelConfig.walls.forEach(w => {
                const pos = getPos(w.col, w.row);
                gameObjects.push(Bodies.rectangle(pos.x, pos.y, CELL_SIZE, CELL_SIZE, { isStatic: true, render: { fillStyle: WALL_COLOR } }));
            });
        }
        if (currentLevelConfig.start) {
            const pos = getPos(currentLevelConfig.start.col, currentLevelConfig.start.row);
            const ball = Bodies.circle(pos.x, pos.y, 20, { isStatic: false, isSleeping: true, restitution: 1, friction: 0.001, label: 'ball', render: { fillStyle: START_COLOR } });
            ballBodyRef.current = ball;
            gameObjects.push(ball);
        }
        if (currentLevelConfig.goal) {
            const pos = getPos(currentLevelConfig.goal.col, currentLevelConfig.goal.row);
            gameObjects.push(Bodies.circle(pos.x, pos.y, 35, { isStatic: true, isSensor: true, label: 'goal', render: { fillStyle: GOAL_COLOR, strokeStyle: GOAL_OUTLINE_COLOR, lineWidth: 4 } }));
        }
        gameObjects.push(Bodies.rectangle(-10, height/2, 20, height, { isStatic: true }), Bodies.rectangle(width+10, height/2, 20, height, { isStatic: true }), Bodies.rectangle(width/2, height+100, width, 100, { isStatic: true, isSensor: true, label: 'floor', render: {fillStyle: 'transparent'} }));
        Composite.add(world, gameObjects);

        const handleCollision = (event) => {
            event.pairs.forEach((pair) => {
                const { bodyA, bodyB } = pair;
                const ball = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;
                const other = bodyA === ball ? bodyB : bodyA;
                if (ball && other) {
                    if (other.label === 'floor') handleReset(false);
                    if (other.label === 'goal') handleWin();
                }
            });
        };
        Events.on(engine, 'collisionStart', handleCollision);

        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);

        return () => { Render.stop(render); Runner.stop(runner); Events.off(engine, 'collisionStart', handleCollision); if (render.canvas) render.canvas.remove(); };
    }, [currentLevelConfig]);

    // --- UPRAVENO: Funkce pro zpracování výhry ---
    const handleWin = async () => {
        // 1. Zastavit míček a uspat ho (Zamrznutí času)
        if (ballBodyRef.current) {
            Body.setVelocity(ballBodyRef.current, { x: 0, y: 0 });
            Body.setAngularVelocity(ballBodyRef.current, 0);
            Sleeping.set(ballBodyRef.current, true);
        }
        
        // 2. Oznámit backendu hotovo (asynchronně)
        const success = await controller.levelCompleted(level);
        
        if (success) {
            // 3. Spustíme vizuální efekt
            triggerWinConfetti();

            // 4. Počkáme 2 sekundy a pak přejdeme dál
            setTimeout(() => {
                const nextLevelId = level + 1;
                const nextLevelExists = LEVELS.find(l => l.id === nextLevelId);
                
                if (nextLevelExists) {
                    // Reset dílků a přechod na další level
                    handleReset(true); 
                    changeLevel(nextLevelId);
                } else {
                    // Konec hry (všechny levely hotové)
                    // Můžeme spustit velký ohňostroj nebo otevřít menu
                    confetti({ particleCount: 500, spread: 100, origin: { y: 0.6 } }); // Finální výbuch
                    handleReset(true);
                    setShowLevelMenu(true); // Otevřeme menu, ať vidí, že má vše hotovo
                }
            }, 2000); // 2000 ms = 2 sekundy delay
        }
    };

    const handleStart = () => { if (!ballBodyRef.current) return; Sleeping.set(ballBodyRef.current, false); Body.setVelocity(ballBodyRef.current, { x: 0, y: 0.1 }); setIsPlaying(true); };
    const handleReset = (fullReset = false) => {
        if (ballBodyRef.current && currentLevelConfig) {
            Body.setVelocity(ballBodyRef.current, { x: 0, y: 0 }); Body.setAngularVelocity(ballBodyRef.current, 0);
            const startPos = getPos(currentLevelConfig.start.col, currentLevelConfig.start.row);
            Body.setPosition(ballBodyRef.current, startPos); Sleeping.set(ballBodyRef.current, true);
        }
        setIsPlaying(false);
        if (fullReset) {
            placedPiecesRef.current.forEach(p => { const body = Composite.get(engineRef.current.world, p.bodyId, 'body'); if (body) Composite.remove(engineRef.current.world, body); });
            setPlacedPieces([]); placedPiecesRef.current = [];
        }
    };

    // --- DRAG & DROP LOGIKA (UPRAVENO) ---

    // A) Začátek tažení z INVENTÁŘE (type) NEBO z GRIDU (existingId)
    const handleDragStart = (e, type, existingId = null) => {
        if (isPlaying) { e.preventDefault(); return; }
        
        e.dataTransfer.setData("pieceType", type);
        
        // Pokud táhneme existující dílek, uložíme si jeho ID
        if (existingId) {
            e.dataTransfer.setData("existingId", existingId);
            // Vizuální efekt - při tažení zprůhledníme
            e.target.style.opacity = '0.5';
        }
    };

    // B) Drop nad GRIDEM (Umístění / Přesun)
    const handleDrop = (e) => {
        e.preventDefault();
        if (isPlaying) return;

        const type = e.dataTransfer.getData("pieceType");
        const existingId = e.dataTransfer.getData("existingId"); // Může být null

        if (!type || !currentLevelConfig) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const col = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const row = Math.floor((e.clientY - rect.top) / CELL_SIZE);

        // 1. Validace pozice
        if (col < 0 || col >= 5 || row < 0 || row >= 6) return;
        if (currentLevelConfig.walls?.some(w => w.col === col && w.row === row)) return;
        if ((currentLevelConfig.start.col === col && currentLevelConfig.start.row === row) || 
            (currentLevelConfig.goal.col === col && currentLevelConfig.goal.row === row)) return;
        
        // Pokud tam už něco je (kromě toho, co zrovna přesouváme)
        const isOccupied = placedPieces.some(p => p.col === col && p.row === row && p.bodyId !== Number(existingId));
        if (isOccupied) return;

        // 2. Logika PŘESUNU (Existing)
        if (existingId) {
            const id = Number(existingId);
            // Najdeme starý dílek
            const oldPiece = placedPiecesRef.current.find(p => p.bodyId === id);
            
            if (oldPiece) {
                // Odstraníme staré fyzické těleso
                const oldBody = Composite.get(engineRef.current.world, oldPiece.bodyId, 'body');
                if (oldBody) Composite.remove(engineRef.current.world, oldBody);

                // Odstraníme starý záznam ze stavu
                setPlacedPieces(prev => prev.filter(p => p.bodyId !== id));
                placedPiecesRef.current = placedPiecesRef.current.filter(p => p.bodyId !== id);
                
                // Vytvoříme nový na novém místě (jako by to byl nový drop)
                placePiece(col, row, type);
            }
        } 
        // 3. Logika NOVÉHO kusu (Inventory)
        else {
            const inventoryItem = currentLevelConfig.inventory.find(i => i.type === type);
            const placedCount = placedPieces.filter(p => p.type === type).length;
            if (placedCount >= inventoryItem.count) { alert("Nemáš dílky!"); return; }
            
            placePiece(col, row, type);
        }
    };

    // C) Drop MIMO GRID (Vrácení do inventáře)
    const handleGlobalDrop = (e) => {
        e.preventDefault();
        if (isPlaying) return;

        const existingId = e.dataTransfer.getData("existingId");
        
        // Pokud jsme pustili existující dílek mimo herní plochu (wb-game-wrapper)
        // Poznáme to tak, že target není uvnitř wb-game-wrapper
        if (existingId && !e.target.closest('.wb-game-wrapper')) {
            const id = Number(existingId);
            const pieceToRemove = placedPiecesRef.current.find(p => p.bodyId === id);
            
            if (pieceToRemove) {
                // Smažeme ho (vrátí se tím do inventáře, protože se sníží počet placedPieces)
                const body = Composite.get(engineRef.current.world, pieceToRemove.bodyId, 'body');
                if (body) Composite.remove(engineRef.current.world, body);

                setPlacedPieces(prev => prev.filter(p => p.bodyId !== id));
                placedPiecesRef.current = placedPiecesRef.current.filter(p => p.bodyId !== id);
            }
        }
    };

    const placePiece = (col, row, type) => {
        const pos = getPos(col, row);
        const body = createPieceBody(pos.x, pos.y, type, CELL_SIZE, PLAYER_PIECE_COLOR);
        Composite.add(engineRef.current.world, body);
        const newPiece = { col, row, type, bodyId: body.id };
        setPlacedPieces(prev => [...prev, newPiece]);
        placedPiecesRef.current.push(newPiece);
    };

    const handleRightClick = (e) => { /* ... stejné jako předtím ... */
        e.preventDefault(); if (isPlaying) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const col = Math.floor((e.clientX - rect.left) / CELL_SIZE);
        const row = Math.floor((e.clientY - rect.top) / CELL_SIZE);
        const pieceToRemove = placedPiecesRef.current.find(p => p.col === col && p.row === row);
        if (pieceToRemove) {
            const body = Composite.get(engineRef.current.world, pieceToRemove.bodyId, 'body');
            if (body) Composite.remove(engineRef.current.world, body);
            setPlacedPieces(prev => prev.filter(p => p.bodyId !== pieceToRemove.bodyId));
            placedPiecesRef.current = placedPiecesRef.current.filter(p => p.bodyId !== pieceToRemove.bodyId);
        }
    };

    return (
        <div 
            style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
            onDragOver={(e) => e.preventDefault()} // Povolíme globální drop
            onDrop={handleGlobalDrop}              // Globální drop pro mazání
        >
            <Header title="Wallball Puzzle" onClose={() => navigate("/")} />
            
            <LevelMenu 
                isOpen={showLevelMenu} onClose={() => setShowLevelMenu(false)} levels={LEVELS} maxUnlocked={maxUnlockedLevel} currentLevel={level} onSelectLevel={changeLevel}
            />

            <div className="wallball-container">
                {/* Levý panel */}
                <div className="wb-left-panel">
                    <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Dílky</h3>
                    {currentLevelConfig && currentLevelConfig.inventory ? (
                        currentLevelConfig.inventory.map((item, index) => {
                            const usedCount = placedPieces.filter(p => p.type === item.type).length;
                            const remaining = item.count - usedCount;
                            const disabled = remaining <= 0 || isPlaying;
                            return (
                                <div key={index} className="wb-inventory-item" draggable={!disabled} onDragStart={(e) => handleDragStart(e, item.type)} style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'grab' }} title={item.type}>
                                    <div className="wb-piece-icon"><PieceIcon type={item.type} color={PLAYER_PIECE_COLOR} /></div>
                                    <span className="wb-piece-count">{remaining}</span>
                                </div>
                            )
                        })
                    ) : ( <p>Načítání...</p> )}
                </div>

                {/* Prostřední panel */}
                <div className="wb-middle-panel">
                    <div className="wb-game-wrapper" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onContextMenu={handleRightClick} style={{ borderColor: isPlaying ? '#27ae60' : '#555' }}>
                        <div className="wb-grid-background">{renderGrid()}</div>
                        <div ref={sceneRef} className="wb-canvas-overlay" />
                        
                        {/* --- NOVÉ: Překryvná vrstva s "úchyty" pro existující dílky --- */}
                        {placedPieces.map((piece) => {
                            const pos = getPos(piece.col, piece.row);
                            return (
                                <div
                                    key={piece.bodyId}
                                    draggable={!isPlaying}
                                    onDragStart={(e) => handleDragStart(e, piece.type, piece.bodyId)}
                                    onDragEnd={(e) => { e.target.style.opacity = '1'; }} // Vrátíme opacitu, pokud drop selhal
                                    style={{
                                        position: 'absolute',
                                        left: pos.x - CELL_SIZE / 2,
                                        top: pos.y - CELL_SIZE / 2,
                                        width: CELL_SIZE,
                                        height: CELL_SIZE,
                                        cursor: isPlaying ? 'default' : 'grab',
                                        zIndex: 10 // Musí být nad Canvasem
                                    }}
                                    title="Přesuň mě nebo vyhoď pryč"
                                />
                            );
                        })}

                    </div>
                </div>

                {/* Pravý panel */}
                <div className="wb-right-panel">
                    <div className="wb-info-box"><h2>Level {level}</h2><p>Obtížnost: {difficulty}</p><p>{description}</p></div>
                    {!isPlaying ? ( <button className="wb-btn wb-btn-start" onClick={handleStart}>START ▶</button> ) : ( <button className="wb-btn wb-btn-reset" onClick={() => handleReset(false)}>STOP ■</button> )}
                    <button className="wb-btn wb-btn-reset" onClick={() => handleReset(true)}>RESET VŠE ↺</button>
                    <div style={{ flex: 1 }}></div>
                    <button className="wb-btn wb-btn-levels" onClick={() => setShowLevelMenu(true)}>VYBRAT LEVEL ☰</button>
                </div>
            </div>
        </div>
    );
}