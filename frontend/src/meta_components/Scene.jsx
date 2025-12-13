// Scene.jsx
import { sceneObjects } from "../models/sceneModel";
import { SceneObject } from "./SceneObject";

export function Scene({ controller }) {
    return (
        <>
            {Object.values(sceneObjects).map(obj => (
                <SceneObject
                    key={obj.id}
                    {...obj}
                    onClick={controller.handleObjectClick}
                />
            ))}
        </>
    );
}
