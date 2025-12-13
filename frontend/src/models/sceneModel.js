// models/sceneModel.js
import kitchen_icon from "../assets/scene/kitchen.svg";
import games_icon from "../assets/scene/games.svg"
import bedroom_icon from "../assets/scene/bedroom.svg"
import bathroom_icon from "../assets/scene/bathroom.svg"
import gym_icon from "../assets/scene/gym.svg"

const room_height = 300;
const y_offset = 0;
const x_offset =170;

export const sceneObjects = {

    bedroom: {
        id: "bedroom",
        svg: bedroom_icon,
        x: 51+x_offset,    
        y: 297+y_offset,
        width: 300,
        height: room_height,
        enabled: true,
    },
    bathroom: {
        id: "bathroom",
        svg: bathroom_icon,
        x: 181 + x_offset,
        y: 499,
        width: 300,
        height: room_height,
        enabled: true,
    },
    kitchen: {
        id: "kitchen",
        svg: kitchen_icon,
        x: 294 + x_offset,
        y: 305,
        width: 300,
        height: room_height,
        enabled: true,
    },
    games: {
        id: "games",
        svg: games_icon,
        x: 447 + x_offset,
        y: 508,
        width: 300,
        height: room_height,
        enabled: true,
    },
    gym: {
        id: "gym",
        svg: gym_icon,
        x: -90 + x_offset,
        y: 465,
        width: 300,
        height: room_height,
        enabled: true,
    },
};

// UI elements that should be positioned alongside rooms
export const sceneUi = {
    gamesCarousel: {
        // keep aligned with the isometric room layout
        x: 475 + x_offset,
        y: 510 + y_offset,
    },
};
