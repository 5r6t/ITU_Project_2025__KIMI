/*
Component for rendering objects in the scene
Author: Jaroslav Mervart
*/
import "../styles/Utils.css";

export function SceneObject({
    id,
    svg,
    x,
    y,
    width,
    height,
    enabled = true,
    onClick,
}) {
    if (!enabled) return null;

    const handleClick = onClick ? () => onClick(id) : undefined;

    return (
        <img
            className="no_select"
            src={svg}
            alt={id}
            style={{
                position: "absolute",
                left: x,
                top: y,
                width: width,
                height: height,
                cursor: "default",
                pointerEvents: "none",
            }}
            onClick={handleClick}
            draggable={false}
        />
    );
}  
