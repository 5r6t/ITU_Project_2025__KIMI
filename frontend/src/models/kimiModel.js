/*
Model enabling interaction with Kimi
Author: Jaroslav Mervart
*/

import axios from "axios";

export const KimiModel = {
    async load() {
        const res = await axios.get("http://127.0.0.1:5000/state");
        return res.data;
    },

    async feed() {
        const res = await axios.post("http://127.0.0.1:5000/feed");
        return res.data;
    },

    async clean() {
        const res = await axios.post("http://127.0.0.1:5000/clean");
        return res.data;
    },

    async sleep() {
        const res = await axios.post("http://127.0.0.1:5000/sleep");
        return res.data;
    },

    async exercise() {
        const res = await axios.post("http://127.0.0.1:5000/exercise");
        return res.data;
    }
};
