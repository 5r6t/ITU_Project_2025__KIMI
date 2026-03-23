# Kimi - Digital Pet (ITU_Project_2025)
GUI-oriented project created for the **ITU (User Interface Programming)** class.

The project consists of:
- Backend – Python + Flask API
- Frontend – React application (Vite dev server)

---

# System Requirements
- Windows 10 or Windows 11
- Internet connection (for installing dependencies)
- Terminal / Command Prompt / PowerShell

---

# Design

The project documentation includes the following design files:

- [Design Proposal](documentation/design_proposal.pdf) – initial design concept.  
- [Final Design](documentation/design_final.pdf) – finalized design after implementation.

---

# Dependencies

## Python (3.10+)
Required for running the backend server.

1. Download Python for Windows  
   https://www.python.org/downloads/windows/

2. Run the installer.

3. Important: during installation check the option  
   Add Python to PATH

4. Verify installation:
   ```
   python --version
   ```

5. Install required backend libraries:
   ```
   pip install flask flask-cors
   ```

---

## Node.js
Required for running the React frontend.

1. Download Node.js  
   https://nodejs.org/en/download

2. Install using the official installer.

3. The installer should automatically add Node.js and npm to PATH.

4. Verify installation:
   ```
   node --version
   npm --version
   ```

5. Install frontend dependencies:

   Navigate into the frontend directory:

   ```
   cd frontend
   npm install
   ```

---

## Optional - only needed when recreating the project environment
```
npm install axios
npm install react-router-dom

npm create vite@latest frontend -- --template react
```
---

# Running the Project

The backend and frontend must be started separately in two terminals.

---

## 1) Start Backend (Flask API)

Navigate to the backend folder:

```
cd backend
```

Run the server:

```
python server.py
```

The backend should start on its configured local port.

---

## 2) Start Frontend (React Development Server)

Open a second terminal and navigate to the frontend folder:

```
cd frontend
```

Start the development server:

```
npm run dev
```

Vite will compile the frontend and start a local development server.

---

## 3) Open in Browser

After both servers are running, open (port may vary):

```
http://localhost:5173
```
---

# Notes

- Both backend and frontend must be running simultaneously.
- If dependencies fail to install, ensure Python and Node.js were correctly added to PATH.

# Screenshots

### Main Menu
![Main Menu](pictures/main_menu.png)

### Breaker
![Breaker](pictures/breaker.png)

### Pinball
![Pinball](pictures/Pinball.png)

### Pizza
![Pizza](pictures/pizza.png)

### Solitaire
![Solitaire](pictures/solitaire_menu.png)

### Wallball
![Wallball](pictures/Wallball.png)


# File structure (frontend/src)
```py
│   Achievements.jsx (Jaroslav Mervart)
│   App.jsx (Jaroslav Mervart)
│   Breaker.jsx (Šimon Dufek)
│   breaker_levels.js (Šimon Dufek)
│   Inventory.jsx (Šimon Dufek)
│   main.jsx 
│   Pinball.jsx (Pavel Hýža)
│   PizzaBaking.jsx (Šimon Dufek)
│   PizzaDecor.jsx (Šimon Dufek)
│   Settings.jsx (Jaroslav Mervart)
│   Solitaire.jsx (Jaroslav Mervart)
│   Wallball.jsx (Pavel Hýža)
│   wallball_levels.js (Pavel Hýža)
│
├───assets 
│
├───controllers
│       achievementController.js (Jaroslav Mervart)
│       breakerController.js (Šimon Dufek)
│       kimiController.js (Jaroslav Mervart)
│       pinballController.js (Pavel Hýža)
│       pizzaController.js (Šimon Dufek)
│       sceneController.js (Jaroslav Mervart)
│       solitaireController.js (Jaroslav Mervart)
│       wallballController.js (Pavel Hýža)
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
│       breakerModel.js (Šimon Dufek)
│       kimiModel.js (Jaroslav Mervart)
│       kimiMoodModel.js (Jaroslav Mervart)
│       pinballModel.js (Pavel Hýža)
│       pizzaModel.js (Šimon Dufek)
│       sceneModel.js (Jaroslav Mervart)
│       settingsModel.js (Jaroslav Mervart)
│       solitaireModel.js (Jaroslav Mervart)
│       solitaireProgressModel.js (Jaroslav Mervart)
│       wallballModel.js (Pavel Hýža)
│
└───styles
        AchievementBox.css (Jaroslav Mervart)
        AchievementInfo.css (Jaroslav Mervart)
        Achievements.css (Jaroslav Mervart)
        App.css (Jaroslav Mervart, Šimon Dufek, Pavel Hýža)
        Breaker.css (Šimon Dufek)
        Header.css (Jaroslav Mervart)
        index.css
        Inventory.css (Šimon Dufek)
        KimiStatus.css (Jaroslav Mervart)
        Pinball.css (Pavel Hýža)
        PizzaBaking.css (Šimon Dufek)
        PizzaDecor.css (Šimon Dufek)
        SceneCarousel.css (Jaroslav Mervart)
        Settings.css (Jaroslav Mervart)
        Solitaire.css (Jaroslav Mervart)
        StatusBar.css (Jaroslav Mervart, Veronika Kubová)
        Utils.css (Jaroslav Mervart)
        Wallball.css (Pavel Hýža)
```

# Final Evaluation (covers documentation and all other criteria)
47 – 50 points
