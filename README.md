# ITU_Project_2025
GUI oriented project from ITU (User Interface Programming) class 

# Dependencies
- Win10/11
## Python (3.10+)
- download https://www.python.org/downloads/windows/
- Check "Add Python to PATH" during install
- Backend `pip install flask flask-cors`
## Node.js
- download https://nodejs.org/en/download
- installer should add `npm` to PATH
- general libs `npm install` inside frontend folder
- ~~HTTP `npm install axios`~~
- ~~`npm install react-router-dom`~~

# ~~Create React project with Vite~~
~~`npm create vite@latest frontend -- --template react`~~
## 1) Run Backend
`cd backend`
`python server.py`
## 2) Run Frontend (React dev server)
`cd frontend`
`npm run dev`

## 3) Open in browser
http://localhost:5173

# File structure (frontend/src)
```py
│   Achievements.jsx (Jaroslav Mervart)
│   App.jsx (Jaroslav Mervart)
│   Breaker.jsx
│   breaker_levels.js
│   Inventory.jsx
│   main.jsx 
│   Pinball.jsx
│   PizzaBaking.jsx
│   PizzaDecor.jsx
│   Settings.jsx (Jaroslav Mervart)
│   Solitaire.jsx (Jaroslav Mervart)
│   Wallball.jsx
│   wallball_levels.js
│
├───assets 
│
├───controllers
│       achievementController.js (Jaroslav Mervart)
│       breakerController.js
│       kimiController.js (Jaroslav Mervart)
│       pinballController.js
│       pizzaController.js
│       sceneController.js (Jaroslav Mervart)
│       solitaireController.js (Jaroslav Mervart)
│       wallballController.js
│
├───meta_components
│       AchievementBox.jsx (Jaroslav Mervart)
│       AchievementContext.jsx (Jaroslav Mervart)
│       AchievementInfo.jsx (Jaroslav Mervart)
│       Header.jsx (Jaroslav Mervart)
│       KimiStatus.jsx (Jaroslav Mervart)
│       Scene.jsx (Jaroslav Mervart)
│       SceneCarousel.jsx (Jaroslav Mervart)
│       SceneObject.jsx (Jaroslav Mervart)
│       SolitaireCard.jsx (Jaroslav Mervart)
│       StatusBar.jsx (Jaroslav Mervart)
│
├───models
│       achievementModel.js (Jaroslav Mervart)
│       breakerModel.js
│       kimiModel.js (Jaroslav Mervart)
│       kimiMoodModel.js (Jaroslav Mervart)
│       pinballModel.js
│       pizzaModel.js
│       sceneModel.js (Jaroslav Mervart)
│       settingsModel.js (Jaroslav Mervart)
│       solitaireModel.js (Jaroslav Mervart)
│       solitaireProgressModel.js (Jaroslav Mervart)
│       wallballModel.js
│
└───styles
        AchievementBox.css (Jaroslav Mervart)
        AchievementInfo.css (Jaroslav Mervart)
        Achievements.css (Jaroslav Mervart)
        App.css (Jaroslav Mervart, Šimon Dufek, Pavel Hýža)
        Breaker.css 
        Header.css (Jaroslav Mervart)
        index.css
        Inventory.css
        KimiStatus.css (Jaroslav Mervart)
        Pinball.css
        PizzaBaking.css
        PizzaDecor.css
        SceneCarousel.css (Jaroslav Mervart)
        Settings.css (Jaroslav Mervart)
        Solitaire.css (Jaroslav Mervart)
        StatusBar.css (Jaroslav Mervart, Veronika Kubová)
        Utils.css (Jaroslav Mervart)
        Wallball.css
```
