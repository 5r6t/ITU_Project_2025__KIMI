/*
Achievement context/provider builds the achievement controller (setPopup, onUpdate)
and renders an AchievementInfo popup when a message is requested.
Author: Jaroslav Mervart
*/
import { createContext, useContext, useState, useMemo } from "react";
import { createAchievementController } from "../controllers/achievementController";
import AchievementInfo from "./AchievementInfo";

const AchievementContext = createContext(null);

export function AchievementProvider({ children, onUpdate }) {
  const [popup, setPopup] = useState(null);

  const controller = useMemo(() => {
    return createAchievementController({ setPopup, onUpdate });
  }, [onUpdate]);

  return (
    <AchievementContext.Provider value={controller}>
      {children}
      {popup && (
        <AchievementInfo
          title={popup}
          onClose={() => setPopup(null)}
        />
      )}
    </AchievementContext.Provider>
  );
}

export const useAchievements = () => useContext(AchievementContext);
