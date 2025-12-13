import "../styles/StatusBar.css";

export default function StatusBar({ label, value, color }) {
  const clampedValue = Math.min(Math.max(value, 0), 100); // keep within 0-100 for rendering

  return (
    <div className="statusbar">
      <div className="statusbar-track">
        <div
          className="statusbar-fill"
          style={{ width: `${clampedValue}%`, background: color }}
        ></div>
        <span className="statusbar-label">
          {label}: {value}
        </span>
      </div>
    </div>
  );
}
