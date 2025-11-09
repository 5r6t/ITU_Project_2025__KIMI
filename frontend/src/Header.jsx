// Header.jsx
import "./Header.css";

export default function Header({ title, onClose }) {
  return (
    <div className="header">
        <div className="header-inner">
            <h2 className="header-title">{title}</h2>
            <button className="header-close" onClick={onClose}>
                X
            </button>
        </div>
    </div>
  );
}
