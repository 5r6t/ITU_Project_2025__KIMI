import { useNavigate } from "react-router-dom";
import Header from "./meta_components/Header";
import "./Achievments.css"

export default function Achievments() {
    const navigate = useNavigate();
    const handleClose = () => {
        navigate("/"); 
    // navigate away, hide modal, etc.
  };

  return(
    <div>
    <div>
      <Header title="Achievements" onClose={handleClose} />
    </div>
    <div className="achieve">
        
        <div >
          <p>Unlocked achievements</p>
        </div>

        <div >
          <p>Locked achievements</p>
        </div>
    </div>
    </div>
  )
}