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
                cursor: onClick ? "pointer" : "default",
            }}
            onClick={() => onClick && onClick(id)}
            draggable={false}
        />
    );
}  