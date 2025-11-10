import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Achievments from './Achievments.jsx'
import Inventory from './Inventory.jsx'

// 2.11. Pinball things
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Pinball from './Pinball'

// 2.11. Přidání routování na komponenty App a Pinball namísto vykreslení pouze App
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/pinball" element={<Pinball />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/achievments" element={<Achievments />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
