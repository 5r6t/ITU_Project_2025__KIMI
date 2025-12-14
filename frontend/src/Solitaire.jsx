import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./meta_components/Header";
import SolitaireCard from "./meta_components/SolitaireCard";
import { createSolitaireController } from "./controllers/solitaireController";
import saveIcon from "./assets/save.svg";
import "./styles/Solitaire.css";

export default function Solitaire() {
    const navigate = useNavigate();
    const [state, setState] = useState(null);
    const [dragTarget, setDragTarget] = useState(null);
    const controllerRef = useRef(null);

    if (!controllerRef.current) {
        controllerRef.current = createSolitaireController(setState);
    }
    const ctrl = controllerRef.current;

    useEffect(() => {
        ctrl.init();
        const id = setInterval(() => ctrl.autoSave(), 30000);
        return () => clearInterval(id);
    }, []);

    const handleClose = () => navigate("/");

    if (!state) {
        return (
            <div>
                <Header title="Solitaire" onClose={handleClose} />
                <div className="solimain">
                    <div className="sol-status">Preparing deck...</div>
                </div>
            </div>
        );
    }

    const { stockCount, waste, foundations, foundationSlots = [], tableau, selection, status, saveStatus } = state;
    const wasteTop = waste[waste.length - 1];
    const isWasteSelected = selection?.source === "waste";

    const parsePayload = (e) => {
        try {
            const raw = e.dataTransfer.getData("application/json");
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (err) {
            console.warn("Bad drag payload", err);
            return null;
        }
    };

    const allowDrop = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleFoundationDrop = (slotIndex, e) => {
        e.preventDefault();
        const payload = parsePayload(e);
        ctrl.handleDropOnFoundation(payload, slotIndex);
        setDragTarget(null);
    };

    const handleTableauDrop = (pileIndex, e) => {
        e.preventDefault();
        const payload = parsePayload(e);
        ctrl.handleDropOnTableau(payload, pileIndex);
        setDragTarget(null);
    };

    const renderFoundation = (slotIndex) => {
        const slotSuit = foundationSlots[slotIndex] || null;
        const pile = slotSuit ? foundations[slotSuit] || [] : [];
        const top = pile[pile.length - 1];
        const isTarget = dragTarget?.type === "foundation" && dragTarget.slot === slotIndex;
        return (
            <div key={slotIndex} className="foundation-wrap">
                <div
                    className={`foundation-slot ${isTarget ? "drop-target" : ""}`}
                    onClick={() => ctrl.handleFoundationClick(slotIndex)}
                    onDragOver={allowDrop}
                    onDrop={(e) => handleFoundationDrop(slotIndex, e)}
                    onDragEnter={() => setDragTarget({ type: "foundation", slot: slotIndex })}
                    onDragLeave={() => setDragTarget(null)}
                >
                    {top
                        ? (<SolitaireCard card={top} selected={false} />)
                        : (<div className="sol-empty">Foundation</div>)
                    }
                </div>
                <div className="foundation-label">{slotSuit || "Any Ace"}</div>
            </div>
        );
    };

    const isSelectedTableau = (pileIndex, cardIndex) =>
        selection?.source === "tableau" &&
        selection.pileIndex === pileIndex &&
        cardIndex >= selection.cardIndex;

    return (
        <div>
            <Header title="Solitaire" onClose={handleClose}>
                <div className="sol-header-actions">
                    <button
                        className="sol-button"
                        onClick={ctrl.manualSave}
                        disabled={saveStatus?.state === "saving"}
                        title="Save progress"
                    >
                        <img src={saveIcon} alt="Save" className="sol-icon" />
                        <span className="save-label">{saveStatus?.message || "Save"}</span>
                    </button>
                </div>
            </Header>
            <div className="solimain">
                <div className="sol-controls">
                    <button className="sol-button" onClick={ctrl.reset}>
                        New Deal
                    </button>
                    <div className="sol-status">{status}</div>
                </div>

                <div className="sol-top-row">
                    <div className="stock-area">
                        <div className="stock-slot" onClick={ctrl.drawFromStock}>
                            {stockCount > 0 ? (
                                <SolitaireCard faceDown card={{}} />
                            ) : (
                                <div className="sol-empty">Empty</div>
                            )}
                            <div className="stock-count">{stockCount}</div>
                        </div>
                        <div
                            className="waste-slot"
                            onClick={ctrl.handleWasteClick}
                            onDragOver={allowDrop}
                            onDrop={(e) => handleTableauDrop(-1, e)}
                        >
                            {wasteTop ? (
                                <SolitaireCard
                                    card={wasteTop}
                                    selected={isWasteSelected}
                                    draggable
                                    onDragStart={(e) => {
                                        const payload = ctrl.beginDragFromWaste();
                                        if (!payload) {
                                            e.preventDefault();
                                            return;
                                        }
                                        e.dataTransfer.effectAllowed = "move";
                                        e.dataTransfer.setData("application/json", JSON.stringify(payload));
                                    }}
                                    onDragEnd={() => setDragTarget(null)}
                                />
                            ) : (
                                <div className="sol-empty">Waste</div>
                            )}
                        </div>
                    </div>

                    <div className="foundations">{[0, 1, 2, 3].map(renderFoundation)}</div>
                </div>

                <div className="tableau">
                    {tableau.map((pile, pileIndex) => (
                        <div
                            key={`pile-${pileIndex}`}
                            className={`tableau-pile ${dragTarget?.type === "tableau" && dragTarget.index === pileIndex
                                    ? "drop-target"
                                    : ""
                                }`}
                            onClick={() => ctrl.handleTableauClick(pileIndex)}
                            onDragOver={allowDrop}
                            onDrop={(e) => handleTableauDrop(pileIndex, e)}
                            onDragEnter={() => setDragTarget({ type: "tableau", index: pileIndex })}
                            onDragLeave={() => setDragTarget(null)}
                        >
                            {pile.length === 0 && <div className="sol-empty">Empty</div>}
                            {pile.map((card, cardIndex) => (
                                <div
                                    key={card.id}
                                    className="tableau-card"
                                    style={{ top: `${cardIndex * 26}px` }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        ctrl.handleTableauClick(pileIndex, cardIndex);
                                    }}
                                >
                                    <SolitaireCard
                                        card={card}
                                        faceDown={!card.faceUp}
                                        selected={isSelectedTableau(pileIndex, cardIndex)}
                                        draggable={card.faceUp}
                                        onDragStart={(e) => {
                                            const payload = ctrl.beginDragFromTableau(pileIndex, cardIndex);
                                            if (!payload) {
                                                e.preventDefault();
                                                return;
                                            }
                                            e.dataTransfer.effectAllowed = "move";
                                            e.dataTransfer.setData("application/json", JSON.stringify(payload));
                                        }}
                                        onDragEnd={() => setDragTarget(null)}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
