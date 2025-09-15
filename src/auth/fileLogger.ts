// File-based logging system with rotation and cleanup
import { writeTextFile, readDir, remove, exists, mkdir } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component: string;
  message: string;
  data?: any;
}

class FileLogger {
  private logDir: string = '';
  private currentLogFile: string = '';
  private currentLogSize: number = 0;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly RETENTION_DAYS = 7;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    
    try {
      const appDir = await appDataDir();
      this.logDir = `${appDir}/logs`;
      
      console.log('📁 File logger initializing...');
      console.log('📂 App data directory:', appDir);
      console.log('📂 Log directory will be:', this.logDir);
      
      // Create logs directory if it doesn't exist
      if (!(await exists(this.logDir))) {
        console.log('📁 Creating logs directory...');
        await mkdir(this.logDir, { recursive: true });
        console.log('✅ Logs directory created');
      } else {
        console.log('📁 Logs directory already exists');
      }
      
      // Set current log file
      await this.rotateLogFile();
      
      // Clean up old log files
      await this.cleanupOldLogs();
      
      this.isInitialized = true;
      console.log('✅ File logger initialized successfully');
      console.log('📝 Current log file:', this.currentLogFile);
    } catch (error) {
      console.error('❌ Failed to initialize file logger:', error);
      console.error('❌ Error details:', error);
    }
  }

  private async rotateLogFile() {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const timeDetail = new Date().toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    this.currentLogFile = `${this.logDir}/app-${timestamp}-${timeDetail}.log`;
    this.currentLogSize = 0;
    
    // Write initial log entry
    await this.writeToFile({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      component: 'LOGGER',
      message: 'Log file started'
    });
  }

  private async writeToFile(entry: LogEntry) {
    try {
      const logLine = `[${entry.timestamp}] [${entry.level}] [${entry.component}] ${entry.message}${
        entry.data ? ' | Data: ' + JSON.stringify(entry.data) : ''
      }\n`;
      
      await writeTextFile(this.currentLogFile, logLine, { append: true });
      this.currentLogSize += logLine.length;
      
      // Check if we need to rotate
      if (this.currentLogSize >= this.MAX_FILE_SIZE) {
        await this.rotateLogFile();
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async cleanupOldLogs() {
    try {
      const entries = await readDir(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
      
      for (const entry of entries) {
        if (entry.name?.startsWith('app-') && entry.name.endsWith('.log')) {
          // Extract date from filename: app-YYYY-MM-DD-HH-MM-SS.log
          const dateMatch = entry.name.match(/app-(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            const fileDate = new Date(dateMatch[1]);
            if (fileDate < cutoffDate) {
              await remove(`${this.logDir}/${entry.name}`);
              console.log(`🗑️ Cleaned up old log file: ${entry.name}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  async log(level: LogEntry['level'], component: string, message: string, data?: any) {
    if (!this.isInitialized) {
      await this.init();
    }
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data
    };
    
    // Write to file asynchronously (don't wait)
    this.writeToFile(entry).catch(error => {
      console.error('Failed to write log entry:', error);
    });
  }

  async debug(component: string, message: string, data?: any) {
    await this.log('DEBUG', component, message, data);
  }

  async info(component: string, message: string, data?: any) {
    await this.log('INFO', component, message, data);
  }

  async warn(component: string, message: string, data?: any) {
    await this.log('WARN', component, message, data);
  }

  async error(component: string, message: string, data?: any) {
    await this.log('ERROR', component, message, data);
  }

  // Get current log file path for debugging
  getCurrentLogFile(): string {
    return this.currentLogFile;
  }

  // Get log directory for debugging
  getLogDirectory(): string {
    return this.logDir;
  }

  // Test logging functionality
  async testLogging() {
    await this.init();
    console.log('🧪 Testing file logging...');
    console.log('📂 Log directory:', this.logDir);
    console.log('📝 Current log file:', this.currentLogFile);
    
    await this.info('TEST', 'File logging test - this should appear in the log file');
    console.log('✅ Test log written, check file:', this.currentLogFile);
  }
}

// Create singleton instance
export const fileLogger = new FileLogger();

// Enhanced console logging that also logs to file
export const appLog = {
  debug: (component: string, message: string, data?: any) => {
    console.log(`🔍 [${component}] ${message}`, data || '');
    fileLogger.debug(component, message, data);
  },
  
  info: (component: string, message: string, data?: any) => {
    console.log(`ℹ️ [${component}] ${message}`, data || '');
    fileLogger.info(component, message, data);
  },
  
  warn: (component: string, message: string, data?: any) => {
    console.warn(`⚠️ [${component}] ${message}`, data || '');
    fileLogger.warn(component, message, data);
  },
  
  error: (component: string, message: string, data?: any) => {
    console.error(`❌ [${component}] ${message}`, data || '');
    fileLogger.error(component, message, data);
  },
  
  success: (component: string, message: string, data?: any) => {
    console.log(`✅ [${component}] ${message}`, data || '');
    fileLogger.info(component, `SUCCESS: ${message}`, data);
  }
};

export default appLog;

// Add test function to window for debugging in dev console
if (typeof window !== 'undefined') {
  (window as any).testFileLogger = async () => {
    console.log('🧪 Starting file logger test...');
    await fileLogger.testLogging();
  };
  
  (window as any).getLogInfo = () => {
    console.log('📂 Log directory:', fileLogger.getLogDirectory());
    console.log('📝 Current log file:', fileLogger.getCurrentLogFile());
  };
}
