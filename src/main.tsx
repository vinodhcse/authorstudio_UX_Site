import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { fileLogger, appLog } from './auth/fileLogger';

// Initialize file logger
fileLogger.init().then(() => {
  appLog.success('main', 'File logger initialized in main.tsx');
}).catch(error => {
  appLog.error('main', 'Failed to initialize file logger in main.tsx', error);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);