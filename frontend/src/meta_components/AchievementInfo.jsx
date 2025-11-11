import { useEffect } from "react";
import "./AchievementInfo.css";

export default function AchievementInfo({ title, onClose }) {
  useEffect(() => {
    // auto-hide after 3 seconds
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!title) return null;

  return (
    <div className="achievement-info">
      <div className="achievement-text">
        🏅 Achievement unlocked: <strong>{title}</strong>
      </div>
    </div>
  );
}
