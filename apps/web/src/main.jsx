import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// 🚀 1. Import your Providers
import { ThemeProvider } from './context/ThemeContext'
import { BranchProvider } from './context/BranchContext' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🚀 2. Wrap your app with the Providers */}
    <ThemeProvider>
      <BranchProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </BranchProvider>
    </ThemeProvider>
  </React.StrictMode>,
)