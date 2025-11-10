// AchievementBox.jsx
import { useState } from "react";
import "./AchievementBox.css";

export default function AchievementBox({ title, children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="achievement-box">
      <header className="achievement-header" onClick={() => setIsOpen(!isOpen)}>
        <h2>{title}</h2>
        <button className="toggle">{isOpen ? "˅" : "˄"}</button>
      </header>
      {isOpen && <div className="achievement-content">{children}</div>}
    </section>
  );
}
