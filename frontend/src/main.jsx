import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App          from './App.jsx'
import Achievements from './Achievements.jsx'
import Solitaire    from './Solitaire.jsx'
import Inventory    from './Inventory.jsx'
import { AchievementProvider } from "./meta_components/AchievementContext";

// 2.11. Pinball things
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Pinball from './Pinball'
import PizzaDecor from './PizzaDecor.jsx'
import PizzaBaking from './PizzaBaking.jsx'

// 2.11. Přidání routování na komponenty App a Pinball namísto vykreslení pouze App
createRoot(document.getElementById('root')).render(
  <StrictMode>
     <AchievementProvider>
       <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/pinball" element={<Pinball />} />
          <Route path="/pizza" element={<PizzaDecor />} />
          <Route path="/pizza-baking" element={<PizzaBaking />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/solitaire" element={<Solitaire />} />
        </Routes>
      </BrowserRouter>
    </AchievementProvider>
  </StrictMode>,
)
