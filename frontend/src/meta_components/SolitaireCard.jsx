/*
Component for card rendering in solitaire
Author: Jaroslav Mervart
*/
import deckSprite from "../assets/deck_split_ready.svg";
import "../styles/Solitaire.css";

export default function SolitaireCard({
    card,
    faceDown = false,
    selected = false,
    onClick,
    draggable = false,
    onDragStart,
    onDragEnd,
}) {
    const label = card ? `${card.rank} of ${card.suit}` : "Card";
    const className = [
        "sol-card",
        faceDown ? "is-back" : "is-front",
        selected ? "is-selected" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            className={className}
            onClick={onClick}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            title={!faceDown && card ? label : undefined}
        >
            {faceDown ? (
                <div className="card-back">
                    <div className="card-back__band" />
                    <div className="card-back__label">BACK</div>
                </div>
            ) : card ? (
                // coords x=0 y=0 width=363 height=544
                <svg viewBox="0 0 363 544" className="card-svg" aria-label={label}>
                    <use href={`${deckSprite}#${card.spriteId}`} />
                </svg>
            ) : (
                <div className="card-missing">Missing card</div>
            )}
        </div>
    );
}
