import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Set to true to enable StrictMode for development, false to disable it
// Turn off StrictMode temporarily to fix the infinite loop issues
const ENABLE_STRICT_MODE = false;

// Determine if we're in development or production
const isDev = import.meta.env.DEV;

const AppWithStrictMode = isDev && ENABLE_STRICT_MODE 
  ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) 
  : <App />;

ReactDOM.createRoot(document.getElementById('root')!).render(
  AppWithStrictMode
);
