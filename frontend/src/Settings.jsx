/*
Settings menu
Author: Jaroslav Mervart
*/
import { useNavigate } from "react-router-dom";
import Header from "./meta_components/Header";

export default function Achievements() {
    const navigate = useNavigate();
    const handleClose = () => navigate("/");

    return (
        <div className="page">
            <Header title="Settings" onClose={handleClose} />
        </div>
    );
}
