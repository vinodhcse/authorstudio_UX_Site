import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { fileLogger, appLog } from './auth/fileLogger';
import { initializeDatabase } from './data/dal';
import { appDataDir } from '@tauri-apps/api/path';

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

async function bootstrap() {
  try {
    // Get the app data directory and create database path
    const appDir = await appDataDir();
    const databasePath = `${appDir}/authorstudio_database`;
    
    // Ensure local database is initialized before any app logic runs
    await initializeDatabase(databasePath);
    appLog.success('main', 'Database initialized', { path: databasePath });
  } catch (e) {
    appLog.error('main', 'Failed to initialize database', e);
  }

  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}

bootstrap();