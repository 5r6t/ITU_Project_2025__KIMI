export const AchievementModel = {
    async update(id, newProgress = 100) {
        const res = await fetch(
            `http://127.0.0.1:5000/update_achievement/${id}/${newProgress}`,
            { method: "POST" }
        );
        return res.json();
    },

    async loadList() {
        const res = await fetch("http://127.0.0.1:5000/get_achievements");
        return res.json();
    }
};
  