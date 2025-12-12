import "../styles/Header.css";
import { Link } from "react-router-dom";
import close from "../assets/close.svg";
import settings from "../assets/settings.svg";

export default function Header({ title, children, onClose }) {
  return (
    <div className="header">
      <div className="header-inner">
        <h2 className="header-title">{title}</h2>
        <span className="header-items">
          {children}
          <Link to="/settings">
            <img src={settings} alt="" />
          </Link>
          <button ><img src={close} alt="" onClick={onClose}></img></button>
        </span>
      </div>
    </div>
  );
}
