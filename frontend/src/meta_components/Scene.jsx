// Scene.jsx
import { sceneObjects, sceneUi } from "../models/sceneModel";
import SceneCarousel from "./SceneCarousel";
import { SceneObject } from "./SceneObject";
import "../styles/SceneCarousel.css";

export function Scene({ controller, carouselItems = [] }) {
    const { gamesCarousel } = sceneUi;

    return (
        <>
            {Object.values(sceneObjects).map(obj => (
                <SceneObject
                    key={obj.id}
                    {...obj}
                    onClick={controller.handleObjectClick}
                />
            ))}
            {carouselItems.length > 0 && (
                <SceneCarousel
                    items={carouselItems}
                    x={gamesCarousel.x}
                    y={gamesCarousel.y}
                />
            )}
        </>
    );
}
