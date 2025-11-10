// Achievements.jsx
import { useNavigate } from "react-router-dom";
import Header from "./meta_components/Header";
import AchievementBox from "./meta_components/AchievementBox";
// styles
import "./Achievements.css"

export default function Achievements() {
  const navigate = useNavigate();
  const handleClose = () => navigate("/");
  const unlockedAchievements = [
  "🏅 First Win",
  "🎯 100 Points",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 asdasd Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "🔥 Perfect Run",
  "!!! Stop",
];
  const lockedAchievements = [
  "🔒 Secret Boss",
  "🔒 ???",
  "🔥 Perfect Run",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Stop",
  "!!! Start",
];

  return (
    <div>
      <Header title="Achievements" onClose={handleClose} />

      <div className="achieve">
        <AchievementBox title="Unlocked achievements">
           {unlockedAchievements.map((text, i) => (
              <div key={i} className="achievement-card">{text}</div>
            ))}
        </AchievementBox>

        <AchievementBox title="Locked achievements">
          {lockedAchievements.map((text, i) => (
              <div key={i} className="achievement-card">{text}</div>
            ))}
        </AchievementBox>
      </div>
    </div>
  );
}