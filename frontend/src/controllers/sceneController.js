export function createSceneController({ navigate, kimiCtrl }) {
    return {
        handleObjectClick: function (id) {
            switch (id) {
                /*case "bed":
                    kimiCtrl.sleep();
                    break;
                case "chair":
                    kimiCtrl.rest();
                    break;
                case "window":
                    navigate("/outside");
                    break;*/
                case "kitchen":
                    navigate("/pizza");
                    break;
                case "bathroom":
                    kimiCtrl.clean();
                    break;
                case "games":
                    // game selection menu (carousel bubble)
                    break;
                case "bedroom":
                    kimiCtrl.sleep();
                    break;
                case "gym":
                    kimiCtrl.exercise();
                    break;
                default:
                    break;
            }
        }
    };
}