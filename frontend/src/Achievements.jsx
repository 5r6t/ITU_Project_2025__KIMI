// Achievements.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./meta_components/Header";
import AchievementBox from "./meta_components/AchievementBox";
// styles
import "./Achievements.css"

export default function Achievements() {
  const navigate = useNavigate();
  const handleClose = () => navigate("/");

  const[achievements, setAchievements] = useState({ unlocked: [], locked: []});
  useEffect(() => {
    fetch("http://127.0.0.1:5000/achievements")
      .then(res => res.json())
      .then(data => setAchievements(data))
      .catch(err => console.error("Failed to load achievements:", err));
  }, []);

  return (
    <div>
      <Header title="Achievements" onClose={handleClose} />

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
    </div>
  );
}