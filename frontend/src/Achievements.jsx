import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./meta_components/Header";
import AchievementBox from "./meta_components/AchievementBox";
import { AchievementProvider, useAchievements } from "./meta_components/AchievementContext";
import "./Achievements.css";

function AchievementPageContent({ achievements }) {
  const { completeAchievement } = useAchievements();

  const handleTest = () => {
    // test unlocks the first achievement (ID = 1)
    completeAchievement(1);
  };

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

      <button onClick={handleTest}>TEST -- Complete Achievement</button>
    </div>
  );
}

export default function Achievements() {
  const navigate = useNavigate();
  const handleClose = () => navigate("/");
  const [achievements, setAchievements] = useState({ unlocked: [], locked: [] });

  const fetchAchievements = () => {
    fetch("http://127.0.0.1:5000/get_achievements")
      .then((res) => res.json())
      .then((data) => setAchievements(data))
      .catch((err) => console.error("Failed to load achievements:", err));
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  return (
    <AchievementProvider onUpdate={fetchAchievements}>
      <Header title="Achievements" onClose={handleClose} />
      <AchievementPageContent
        achievements={achievements}
        fetchAchievements={fetchAchievements}
      />
    </AchievementProvider>
  );
}
