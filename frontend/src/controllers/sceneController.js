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
                case "fridge":
                    kimiCtrl.feed();
                    break;
                default:
                    break;
            }
        }
    };
}