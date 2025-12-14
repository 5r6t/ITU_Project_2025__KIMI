/*
View Component: Breaker.jsx
Author: Šimon Dufek
*/

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './meta_components/Header';
import { createBreakerController } from './controllers/breakerController';
import { GAME_WIDTH, GAME_HEIGHT, DIFFICULTIES } from './models/breakerModel';
import { LEVELS } from './breaker_levels'; 
import './styles/Breaker.css';

export default function Breaker() { // Hlavní komponenta hry Breaker
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const controllerRef = useRef(null);

    const [gameState, setGameState] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);

    if (!controllerRef.current) {
        controllerRef.current = createBreakerController(setGameState);
    }
    const ctrl = controllerRef.current;

    useEffect(() => { // Inicializace a úklid
        ctrl.init();
        const onKeyDown = (e) => ctrl.handleKeyDown(e);
        const onKeyUp = (e) => ctrl.handleKeyUp(e); 
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        document.addEventListener("fullscreenchange", onFsChange);

        return () => { // Úklid při odchodu z komponenty
            ctrl.cleanup();
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            document.removeEventListener("fullscreenchange", onFsChange);
        };
    }, []);

    const toggleFullscreen = () => { // Přepínání režimu celé obrazovky
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => { // Vykreslování hry
        const canvas = canvasRef.current;
        if (!canvas || !gameState) return;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = "#1a252f";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (gameState.bricks) {
            gameState.bricks.forEach(brick => { // Cihly
                if (brick.status === 1) {
                    ctx.beginPath();
                    ctx.rect(brick.x, brick.y, brick.width, brick.height);
                    
                    if (brick.health === 1) { ctx.fillStyle = "#3498db"; ctx.strokeStyle = "#2980b9"; } 
                    else if (brick.health === 2) { ctx.fillStyle = "#e67e22"; ctx.strokeStyle = "#d35400"; } 
                    else if (brick.health >= 3) { ctx.fillStyle = "#e74c3c"; ctx.strokeStyle = "#c0392b"; }

                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.closePath();
                }
            });
        }
        if (gameState.powerUps) { 
            gameState.powerUps.forEach(p => { // Power-upy
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
        if (gameState.paddleWidth) { // Pálka
            ctx.beginPath();
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(gameState.paddleX + 5, GAME_HEIGHT - gameState.paddleHeight + 5, gameState.paddleWidth, gameState.paddleHeight);
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(gameState.paddleX, GAME_HEIGHT - gameState.paddleHeight, gameState.paddleWidth, gameState.paddleHeight);
            ctx.closePath();
        }
        if (gameState.balls) { 
            gameState.balls.forEach(ball => { // Míčky
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, gameState.ballRadius, 0, Math.PI * 2);
                ctx.fillStyle = "#ecf0f1";
                ctx.fill();
                ctx.closePath();
            });
            if (gameState.gameStarted && !gameState.balls.some(b => b.moving) && !gameState.gameOver && !gameState.gameWon) { // Nápověda ke spuštění hry
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

    const canUsePowerUps = (gameState.maxUnlockedWorld || 0) >= 3;

    // Hlavní vykreslovací část komponenty
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
                <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="game-canvas"/>

                {/* --- VÝBĚROVÉ MENU --- */}
                {!gameState.gameStarted && !gameState.gameOver && !gameState.gameWon && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Nová Hra</h2>
                            
                            {/* VÝBĚR LEVELU */}
                            <span className="section-label">Vyber Level</span>
                            <div className="level-grid">
                                {LEVELS.map((_, index) => {
                                    const isUnlocked = index <= (gameState.maxUnlockedWorld || 0);
                                    let btnClass = "level-btn";
                                    if (isUnlocked) btnClass += " unlocked";
                                    if (selectedLevelIndex === index) btnClass += " selected";

                                    return (
                                        <button 
                                            key={index}
                                            onClick={() => isUnlocked && setSelectedLevelIndex(index)}
                                            className={btnClass}
                                            disabled={!isUnlocked}
                                            title={!isUnlocked ? "Level zamčen" : ""}
                                        >
                                            {isUnlocked ? index + 1 : "🔒"}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* NASTAVENÍ POWER-UPŮ */}
                            <div className="powerup-box">
                                {canUsePowerUps ? (
                                    <label className="powerup-label">
                                        <input 
                                            type="checkbox" 
                                            className="powerup-checkbox"
                                            checked={gameState.powerUpsEnabled} 
                                            onChange={() => ctrl.togglePowerups()}
                                        />
                                        ⚡ Povolit Power-upy
                                    </label>
                                ) : (
                                    <p className="powerup-locked">
                                        ⚡ Power-upy se odemknou po 3. světě
                                    </p>
                                )}
                            </div>

                            {/* VÝBĚR OBTÍŽNOSTI */}
                            <span className="section-label">Startovní obtížnost</span>
                            <div className="difficulty-grid">
                                {Object.entries(DIFFICULTIES).map(([key, diff]) => (
                                    <button 
                                        key={key}
                                        onClick={() => ctrl.startGame(key, selectedLevelIndex)}
                                        className="diff-btn"
                                        style={{ backgroundColor: diff.color }}
                                    >
                                        {diff.label}
                                    </button>
                                ))}
                            </div>

                            <button onClick={() => navigate('/')} className="action-btn btn-secondary">Zpět</button>
                        </div>
                    </div>
                )}

                {/* --- END SCREEN --- */}
                {(gameState.gameOver || gameState.gameWon) && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>{gameState.gameWon ? "🎉 Vítězství! 🎉" : "Konec hry"}</h2>
                            <div className="final-stats">
                                <p>Level: <strong>{gameState.worldIndex + 1}-{gameState.subLevelIndex + 1}</strong></p>
                                <p>Skóre: <strong>{gameState.score}</strong></p>
                                <p>High Score: <strong>{gameState.highScore}</strong></p>
                            </div>
                            {gameState.score >= gameState.highScore && gameState.score > 0 && (
                                <p className="new-record">🏆 NOVÝ REKORD! 🏆</p>
                            )}
                            <div className="modal-actions" style={{marginTop: "20px"}}>
                                <button onClick={() => ctrl.restart()} className="action-btn btn-primary">Zkusit znovu</button>
                                <button onClick={() => navigate('/')} className="action-btn btn-secondary">Odejít</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}