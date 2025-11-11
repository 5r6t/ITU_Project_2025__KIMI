import { createContext, useContext, useState, useCallback } from "react";
import AchievementInfo from "./AchievementInfo";

const AchievementContext = createContext();

export function AchievementProvider({ children, onUpdate }) {
  const [popup, setPopup] = useState(null);

  const completeAchievement = useCallback(async (id, newProgress = 100) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/update_achievement/${id}/${newProgress}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.completed) {
        setPopup(`🏅 ${data.name}`);
        onUpdate?.(); // refresh parent if needed
      }
      return data;
    } catch (err) {
      console.error("Achievement update failed:", err);
    }
  }, [onUpdate]);

  return (
    <AchievementContext.Provider value={{ completeAchievement }}>
      {children}
      {popup && (
        <AchievementInfo title={popup} onClose={() => setPopup(null)} />
      )}
    </AchievementContext.Provider>
  );
}

export const useAchievements = () => useContext(AchievementContext);
