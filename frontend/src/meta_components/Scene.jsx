/*
Component for rendering scene inside main menu
Author: Jaroslav Mervart
*/
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
                />
            ))}

            {Object.values(sceneObjects).map(({ id, hotspot }) => (
                <button
                    key={`${id}-hotspot`}
                    className="scene-hotspot"
                    style={{
                        left: hotspot?.x ?? 0,
                        top: hotspot?.y ?? 0,
                        width: hotspot?.size ?? 100,
                        height: hotspot?.size ?? 100,
                    }}
                    onClick={() => controller.handleObjectClick(id)}
                    aria-label={`${id} hotspot`}
                    title={id}
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
