/*
Model for scene inside main menu
Author: Jaroslav Mervart
*/

import kitchen_icon from "../assets/scene/kitchen.svg";
import games_icon from "../assets/scene/games.svg"
import bedroom_icon from "../assets/scene/bedroom.svg"
import bathroom_icon from "../assets/scene/bathroom.svg"
import gym_icon from "../assets/scene/gym.svg"

const room_height = 300;
const y_offset = 0;
const x_offset =170;
const hotspot_size = 140;

export const sceneObjects = {

    bedroom: {
        id: "bedroom",
        svg: bedroom_icon,
        x: 51+x_offset,    
        y: 297+y_offset,
        width: 300,
        height: room_height,
        enabled: true,
        hotspot: {
            x: 51 + x_offset + (300 - hotspot_size) / 2,
            y: 297 + y_offset + (room_height - hotspot_size) / 2,
            size: hotspot_size,
        },
    },
    bathroom: {
        id: "bathroom",
        svg: bathroom_icon,
        x: 181 + x_offset,
        y: 499,
        width: 300,
        height: room_height,
        enabled: true,
        hotspot: {
            x: 181 + x_offset + (300 - hotspot_size) / 2,
            y: 499 + (room_height - hotspot_size) / 2,
            size: hotspot_size,
        },
    },
    kitchen: {
        id: "kitchen",
        svg: kitchen_icon,
        x: 294 + x_offset,
        y: 305,
        width: 300,
        height: room_height,
        enabled: true,
        hotspot: {
            x: 294 + x_offset + (300 - hotspot_size) / 2,
            y: 305 + (room_height - hotspot_size) / 2,
            size: hotspot_size,
        },
    },
    games: {
        id: "games",
        svg: games_icon,
        x: 447 + x_offset,
        y: 508,
        width: 300,
        height: room_height,
        enabled: true,
        hotspot: {
            x: 447 + x_offset + (300 - hotspot_size) / 2,
            y: 508 + (room_height - hotspot_size) / 2,
            size: hotspot_size,
        },
    },
    gym: {
        id: "gym",
        svg: gym_icon,
        x: -90 + x_offset,
        y: 465,
        width: 300,
        height: room_height,
        enabled: true,
        hotspot: {
            x: -90 + x_offset + (300 - hotspot_size) / 2,
            y: 465 + (room_height - hotspot_size) / 2,
            size: hotspot_size,
        },
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
