import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Admin from './Admin.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { CustomCursor } from './InteractiveLayer.jsx'

const path = window.location.pathname;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <CustomCursor />
      {path === '/admin' ? <Admin /> : <App />}
    </ErrorBoundary>
  </StrictMode>,
)

