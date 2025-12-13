import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './meta_components/Header';
import { createBreakerController } from './controllers/breakerController';
import { GAME_WIDTH, GAME_HEIGHT, DIFFICULTIES } from './models/breakerModel';
import { LEVELS } from './breaker_levels'; // Import pro zjištění počtu levelů
import './styles/Breaker.css';

export default function Breaker() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const controllerRef = useRef(null);

    const [gameState, setGameState] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Stav pro menu: Který level uživatel vybral (defaultně první)
    const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);

    if (!controllerRef.current) {
        controllerRef.current = createBreakerController(setGameState);
    }
    const ctrl = controllerRef.current;

    useEffect(() => {
        ctrl.init();
        const onKeyDown = (e) => ctrl.handleKeyDown(e);
        const onKeyUp = (e) => ctrl.handleKeyUp(e); 
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        document.addEventListener("fullscreenchange", onFsChange);

        return () => {
            ctrl.cleanup();
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            document.removeEventListener("fullscreenchange", onFsChange);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameState) return;
        const ctx = canvas.getContext('2d');

        // Pozadí
        ctx.fillStyle = "#1a252f";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // --- VYKRESLENÍ HRY ---
        // Cihly
        if (gameState.bricks) {
            gameState.bricks.forEach(brick => {
                if (brick.status === 1) {
                    ctx.beginPath();
                    ctx.rect(brick.x, brick.y, brick.width, brick.height);
                    
                    if (brick.health === 1) {
                        ctx.fillStyle = "#3498db";
                        ctx.strokeStyle = "#2980b9";
                    } else if (brick.health === 2) {
                        ctx.fillStyle = "#e67e22";
                        ctx.strokeStyle = "#d35400";
                    } else if (brick.health >= 3) {
                        ctx.fillStyle = "#e74c3c";
                        ctx.strokeStyle = "#c0392b";
                    }

                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.closePath();
                }
            });
        }

        // Power-ups a zbytek (stejné jako předtím)
        if (gameState.powerUps) {
            gameState.powerUps.forEach(p => {
                ctx.beginPath();
                if (p.type === 'LIFE') ctx.fillStyle = "#e74c3c";
                else if (p.type === 'WIDE') ctx.fillStyle = "#2ecc71";
                else if (p.type === 'MULTIBALL') ctx.fillStyle = "#3498db";
                ctx.fillRect(p.x, p.y, 30, 30);
                ctx.strokeStyle = "rgba(255,255,255,0.3)";
                ctx.lineWidth = 1;
                ctx.strokeRect(p.x, p.y, 30, 30);
                ctx.closePath();
            });
        }

        if (gameState.paddleWidth) {
            ctx.beginPath();
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(gameState.paddleX + 5, GAME_HEIGHT - gameState.paddleHeight + 5, gameState.paddleWidth, gameState.paddleHeight);
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(gameState.paddleX, GAME_HEIGHT - gameState.paddleHeight, gameState.paddleWidth, gameState.paddleHeight);
            ctx.closePath();
        }

        if (gameState.balls) {
            gameState.balls.forEach(ball => {
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, gameState.ballRadius, 0, Math.PI * 2);
                ctx.fillStyle = "#ecf0f1";
                ctx.fill();
                ctx.closePath();
            });

            if (gameState.gameStarted && !gameState.balls.some(b => b.moving) && !gameState.gameOver && !gameState.gameWon) {
                ctx.font = "bold 50px Arial";
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                ctx.textAlign = "center";
                ctx.fillText(`LEVEL ${gameState.worldIndex + 1} - ${gameState.subLevelIndex + 1}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
                ctx.font = "30px Arial";
                ctx.fillText("Stiskni MEZERNÍK", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
            }
        }

    }, [gameState]);

    if (!gameState) return <div className="loading">Načítání...</div>;

    return (
        <div className="breaker-container" ref={containerRef}>
            <div className="game-header-controls">
                <Header title="Brick Breaker" onClose={() => navigate('/')}>
                     <button className="fs-btn" onClick={toggleFullscreen} title="Celá obrazovka">
                        {isFullscreen ? "⤓" : "⤢"} 
                     </button>
                </Header>
            </div>
            
            <div className="stats-panel">
                <div className="stat-box">
                    <span className="stat-label">LEVEL</span>
                    {/* Zobrazujeme Svět-Podlevel (např. 1-1) */}
                    <span className="stat-value">{gameState.worldIndex + 1}-{gameState.subLevelIndex + 1}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">SKÓRE</span>
                    <span className="stat-value">{gameState.score}</span>
                </div>
                <div className="stat-box highlight">
                    <span className="stat-label">RECORD</span>
                    <span className="stat-value">{gameState.highScore}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">ŽIVOTY</span>
                    <div className="lives-visual">
                        {Array.from({ length: Math.max(0, gameState.lives) }).map((_, i) => (
                            <span key={i}>❤️</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="game-wrapper">
                <canvas 
                    ref={canvasRef} 
                    width={GAME_WIDTH} 
                    height={GAME_HEIGHT}
                    className="game-canvas"
                />

                {/* --- MENU VÝBĚRU OBTÍŽNOSTI A LEVELU --- */}
                {!gameState.gameStarted && !gameState.gameOver && !gameState.gameWon && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Nová Hra</h2>
                            
                            {/* VÝBĚR LEVELU */}
                            <div className="level-select-container" style={{marginBottom: "20px"}}>
                                <p style={{fontWeight: "bold", marginBottom: "10px"}}>Vyber Level:</p>
                                <div style={{display: "flex", justifyContent: "center", gap: "10px"}}>
                                    {LEVELS.map((_, index) => {
                                        const isUnlocked = index <= (gameState.maxUnlockedWorld || 0);
                                        return (
                                            <button 
                                                key={index}
                                                onClick={() => isUnlocked && setSelectedLevelIndex(index)}
                                                className={selectedLevelIndex === index ? "level-btn selected" : "level-btn"}
                                                style={{
                                                    padding: "10px 15px",
                                                    backgroundColor: selectedLevelIndex === index ? "#3498db" : (isUnlocked ? "#95a5a6" : "#34495e"),
                                                    color: isUnlocked ? "white" : "#7f8c8d",
                                                    border: selectedLevelIndex === index ? "2px solid #2980b9" : "none",
                                                    borderRadius: "4px",
                                                    cursor: isUnlocked ? "pointer" : "not-allowed",
                                                    fontWeight: "bold"
                                                }}
                                                disabled={!isUnlocked}
                                            >
                                                {isUnlocked ? `Level ${index + 1}` : `Level ${index + 1} 🔒`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* VÝBĚR OBTÍŽNOSTI */}
                            <p style={{fontWeight: "bold", marginBottom: "10px"}}>Vyber Obtížnost:</p>
                            <div className="difficulty-buttons">
                                {Object.entries(DIFFICULTIES).map(([key, diff]) => (
                                    <button 
                                        key={key}
                                        // Zde voláme startGame s vybraným levelem
                                        onClick={() => ctrl.startGame(key, selectedLevelIndex)}
                                        style={{ 
                                            backgroundColor: diff.color, 
                                            margin: "10px", 
                                            padding: "15px 20px", 
                                            fontSize: "1.2rem",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            minWidth: "120px",
                                            cursor: "pointer",
                                            border: "none",
                                            borderRadius: "8px",
                                            color: "white"
                                        }}
                                    >
                                        <span style={{ fontWeight: "bold" }}>{diff.label}</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => navigate('/')} className="secondary" style={{marginTop: 20}}>Zpět</button>
                        </div>
                    </div>
                )}

                {/* --- KONEC HRY / VÍTĚZSTVÍ --- */}
                {(gameState.gameOver || gameState.gameWon) && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>{gameState.gameWon ? "🎉 Vítězství! 🎉" : "Konec hry"}</h2>
                            <div className="final-stats">
                                <p>Dokončeno: <strong>Level {gameState.worldIndex + 1}-{gameState.subLevelIndex + 1}</strong></p>
                                <p>Skóre: <strong>{gameState.score}</strong></p>
                                <p>High Score: <strong>{gameState.highScore}</strong></p>
                            </div>
                            {gameState.score >= gameState.highScore && gameState.score > 0 && (
                                <p className="new-record">🏆 NOVÝ REKORD! 🏆</p>
                            )}
                            <div className="modal-actions">
                                <button onClick={() => ctrl.restart()}>Zkusit znovu</button>
                                <button onClick={() => navigate('/')} className="secondary">Odejít</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}