import { useEffect } from "react";
import { preloadMoodImages } from "../models/kimiMoodModel";
import "../styles/KimiStatus.css";

export default function KimiStatus({ moodImage, mood, moodText }) {
  useEffect(() => {
    preloadMoodImages();
  }, []);

  return (
    <div className="kimi-status">
      {moodImage ? (
        <img className="kimi-status__img" src={moodImage} alt={mood || "fox"} />
      ) : (
        <div className="kimi-status__placeholder">🦊</div>
      )}
      <div className="kimi-status__text">
        <div className="kimi-status__label">Kimi is {mood || "..."}</div>
        <div className="kimi-status__message">
          {moodText || "Getting things ready..."}
        </div>
      </div>
    </div>
  );
}
