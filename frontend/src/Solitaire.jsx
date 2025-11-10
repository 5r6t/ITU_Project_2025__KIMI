import { useNavigate } from "react-router-dom";
import Header from "./meta_components/Header";
import './Solitaire.css';

export default function Solitaire () {
    const navigate = useNavigate();
    const handleClose = () => navigate("/");
    return (
        <div>
            <Header title="Solitaire" onClose={handleClose}></Header>
            <div className="solimain">
            </div>
        </div>
    );
}