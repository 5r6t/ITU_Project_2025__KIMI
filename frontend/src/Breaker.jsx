import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './meta_components/Header';
import { createBreakerController } from './controllers/breakerController';
import { GAME_WIDTH, GAME_HEIGHT } from './models/breakerModel';
import './styles/Breaker.css';

export default function Breaker() {
    const navigate = useNavigate();
    
    // Reference
    const canvasRef = useRef(null);
    const containerRef = useRef(null); // Reference pro celý kontejner hry
    const controllerRef = useRef(null);

    const [gameState, setGameState] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false); // State pro ikonu tlačítka

    if (!controllerRef.current) {
        controllerRef.current = createBreakerController(setGameState);
    }
    const ctrl = controllerRef.current;

    useEffect(() => {
        ctrl.init();
        const onKeyDown = (e) => ctrl.handleKeyDown(e);
        const onKeyUp = (e) => ctrl.handleKeyUp(e); 
        
        // Listener pro změnu fullscreenu (např. přes Esc)
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

    // Funkce pro přepínání fullscreenu
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error enabling full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Vykreslovací smyčka (Canvas)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameState) return;
        const ctx = canvas.getContext('2d');

        // Vyčištění a nastavení pozadí
        ctx.fillStyle = "#1a252f";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Bricks
        gameState.bricks.forEach(brick => {
            if (brick.status === 1) {
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, brick.width, brick.height);
                ctx.fillStyle = "#3498db";
                ctx.fill();
                ctx.strokeStyle = "#2980b9";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();
            }
        });

        // Paddle
        ctx.beginPath();
        // Stín pod pálkou
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(gameState.paddleX + 5, GAME_HEIGHT - gameState.paddleHeight + 5, gameState.paddleWidth, gameState.paddleHeight);
        
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(gameState.paddleX, GAME_HEIGHT - gameState.paddleHeight, gameState.paddleWidth, gameState.paddleHeight);
        ctx.closePath();

        // Ball
        ctx.beginPath();
        ctx.arc(gameState.ballX, gameState.ballY, gameState.ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#ecf0f1";
        ctx.fill();
        ctx.closePath();

        // Start text
        if (!gameState.ballMoving && !gameState.gameOver && !gameState.gameWon) {
            ctx.font = "bold 50px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.textAlign = "center";
            ctx.fillText("Stiskni MEZERNÍK", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
            
            ctx.font = "20px Arial";
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.fillText("Šipky pro pohyb", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90);
        }

    }, [gameState]);

    if (!gameState) return <div className="loading">Načítání...</div>;

    return (
        <div className="breaker-container" ref={containerRef}>
            {/* Header upravíme, aby obsahoval tlačítko fullscreenu */}
            <div className="game-header-controls">
                <Header title="Brick Breaker" onClose={() => navigate('/')}>
                     <button className="fs-btn" onClick={toggleFullscreen} title="Celá obrazovka">
                        {isFullscreen ? "⤓" : "⤢"} 
                     </button>
                </Header>
            </div>
            
            <div className="stats-panel">
                <div className="stat-box">
                    <span className="stat-label">SKÓRE</span>
                    <span className="stat-value">{gameState.score}</span>
                </div>
                <div className="stat-box highlight">
                    <span className="stat-label">RECORD</span>
                    <span className="stat-value">{gameState.highScore}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">LEVEL</span>
                    <span className="stat-value">{gameState.level}</span>
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

                {(gameState.gameOver || gameState.gameWon) && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>{gameState.gameWon ? "🎉 Vítězství! 🎉" : "Konec hry"}</h2>
                            <div className="final-stats">
                                <p>Skóre: <strong>{gameState.score}</strong></p>
                                <p>High Score: <strong>{gameState.highScore}</strong></p>
                            </div>
                            {gameState.score >= gameState.highScore && gameState.score > 0 && (
                                <p className="new-record">🏆 NOVÝ REKORD! 🏆</p>
                            )}
                            <div className="modal-actions">
                                <button onClick={ctrl.restart}>Hrát znovu</button>
                                <button onClick={() => navigate('/')} className="secondary">Odejít</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}