import { useNavigate } from "react-router-dom";
import Header from "./Header";

export default function Achievments() {
    const navigate = useNavigate();
    const handleClose = () => {
        navigate("/"); 
    // navigate away, hide modal, etc.
  };

  return(
    <div>
        <Header title="Achievements" onClose={handleClose} />
    </div>
  )
}