/*
Achievements menu component
Author: Jaroslav Mervart
*/
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./meta_components/Header";
import AchievementBox from "./meta_components/AchievementBox";
import { AchievementProvider, useAchievements } from "./meta_components/AchievementContext";
import "./styles/Achievements.css";

function AchievementPageContent() {
  const { loadList } = useAchievements();
  const [achievements, setAchievements] = useState({ unlocked: [], locked: [] });

  const refresh = () => {
    loadList().then(data => setAchievements(data));
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="achieve">
      <AchievementBox title="Unlocked achievements">
        {achievements.unlocked.map((text, i) => (
          <div key={i} className="achievement-card">{text}</div>
        ))}
      </AchievementBox>

      <AchievementBox title="Locked achievements">
        {achievements.locked.map((text, i) => (
          <div key={i} className="achievement-card">{text}</div>
        ))}
      </AchievementBox>

    </div>
  );
}

export default function Achievements() {
  const navigate = useNavigate();
  const handleClose = () => navigate("/");

  return (
    <div className="page">
      <Header title="Achievements" onClose={handleClose} />
      <AchievementPageContent />
    </div>
  );
}
