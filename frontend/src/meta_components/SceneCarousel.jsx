import { useState } from "react";
import "../styles/SceneCarousel.css";

export default function SceneCarousel({ items = [], x, y }) {
    const itemCount = items.length;
    const [index, setIndex] = useState(0);

    if (itemCount === 0) return null;

    const next = () => setIndex((i) => (i + 1) % itemCount);
    const prev = () => setIndex((i) => (i - 1 + itemCount) % itemCount);
    const current = items[index % itemCount];
    // https://www.alt-codes.net/triangle-symbols
    return (
        <div
            className="carousel-wrapper"
            style={{
                position: "absolute",
                left: x,
                top: y,
            }}
        >
            <button className="carousel-btn" onClick={prev}>&#9650;</button>

            <div className="carousel-item">
                <button onClick={current.onClick} className="item-button">
                    {current.label}
                </button>
            </div>

            <button className="carousel-btn" onClick={next}>&#9660;</button>
        </div>
    );
}
