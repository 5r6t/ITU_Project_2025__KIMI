import "../styles/StatusBar.css";

export default function StatusBar({ label, value, color }) {
  return (
    <div className="statusbar">
      <p style={{ margin: 0 }}>{label}: {value}</p>
      <div className="statusbar-track">
        <div
          className="statusbar-fill"
          style={{ width: `${value}%`, background: color }} // width above 100% stays 100%
        ></div>
      </div>
    </div>
  );
}