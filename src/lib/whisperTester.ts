import { invoke } from '@tauri-apps/api/core';

export interface WhisperTestResult {
  success: boolean;
  result?: string;
  error?: string;
}

export class WhisperTester {
  private static instance: WhisperTester;
  
  public static getInstance(): WhisperTester {
    if (!WhisperTester.instance) {
      WhisperTester.instance = new WhisperTester();
    }
    return WhisperTester.instance;
  }

  async testWithSineWave(): Promise<WhisperTestResult> {
    try {
      console.log('🧪 Testing Whisper with sine wave...');
      const result = await invoke('test_whisper_with_sine_wave') as string;
      console.log('✅ Sine wave test result:', result);
      
      return {
        success: true,
        result: result
      };
    } catch (error) {
      console.error('❌ Sine wave test failed:', error);
      return {
        success: false,
        error: error as string
      };
    }
  }

  async testWithFile(filePath: string): Promise<WhisperTestResult> {
    try {
      console.log('🧪 Testing Whisper with file:', filePath);
      const result = await invoke('test_whisper_with_file', { filePath }) as string;
      console.log('✅ File test result:', result);
      
      return {
        success: true,
        result: result
      };
    } catch (error) {
      console.error('❌ File test failed:', error);
      return {
        success: false,
        error: error as string
      };
    }
  }

  // Test function to create a simple button for testing
  createTestButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '🧪 Test Whisper with Sine Wave';
    button.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600';
    button.onclick = async () => {
      button.disabled = true;
      button.textContent = '🔄 Testing...';
      
      const result = await this.testWithSineWave();
      
      if (result.success) {
        button.textContent = '✅ Test Complete';
        button.className = 'px-4 py-2 bg-green-500 text-white rounded';
        console.log('Test result:', result.result);
        alert(`Test Result:\n${result.result}`);
      } else {
        button.textContent = '❌ Test Failed';
        button.className = 'px-4 py-2 bg-red-500 text-white rounded';
        console.error('Test error:', result.error);
        alert(`Test Failed:\n${result.error}`);
      }
      
      setTimeout(() => {
        button.disabled = false;
        button.textContent = '🧪 Test Whisper with Sine Wave';
        button.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600';
      }, 3000);
    };
    
    return button;
  }
}

// Export for easy use
export const whisperTester = WhisperTester.getInstance();
