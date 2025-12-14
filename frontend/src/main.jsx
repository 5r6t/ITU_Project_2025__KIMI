/*
Router for the kimi game
Author: Jaroslav Mervart, Simon Dufek, Pavel Hyza
*/
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import Achievements from './Achievements.jsx'
import Settings from './Settings.jsx'
import Solitaire from './Solitaire.jsx'
import Inventory from './Inventory.jsx'
import { AchievementProvider } from "./meta_components/AchievementContext";

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Pinball from './Pinball'
import Wallball from './Wallball.jsx'
import PizzaDecor from './PizzaDecor.jsx'
import PizzaBaking from './PizzaBaking.jsx'
import Breaker from './Breaker.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AchievementProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/pinball" element={<Pinball />} />
          <Route path="/wallball" element={<Wallball />} />
          <Route path="/pizza" element={<PizzaDecor />} />
          <Route path="/pizza-baking" element={<PizzaBaking />} />
          <Route path="/breaker" element={<Breaker />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/solitaire" element={<Solitaire />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </AchievementProvider>
  </StrictMode>,
)