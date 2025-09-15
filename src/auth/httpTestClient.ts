// Test HTTP connectivity for debugging authentication issues
import { fetch } from '@tauri-apps/plugin-http';

export class HTTPTestClient {
  /**
   * Test if HTTP plugin can make any requests at all
   */
  static async testPublicAPI(): Promise<boolean> {
    try {
      console.log('Testing HTTP plugin with public API...');
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      console.log('Public API test successful:', data);
      return true;
    } catch (error) {
      console.error('Public API test failed:', error);
      return false;
    }
  }

  /**
   * Test connectivity to the local backend server
   */
  static async testBackendConnectivity(baseUrl = 'http://127.0.0.1:4000'): Promise<boolean> {
    try {
      console.log('Testing backend connectivity...');
      
      // Try a simple GET request to see if server is reachable
      // Most backends respond to their base URL or a simple endpoint
      const response = await fetch(`${baseUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Backend response status:', response.status);
      
      // Accept any response (even errors) as long as the server is reachable
      console.log('Backend connectivity test successful - server is reachable');
      return true;
    } catch (error) {
      console.error('Backend connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Test the specific auth endpoint
   */
  static async testAuthEndpoint(baseUrl = 'http://127.0.0.1:4000/api'): Promise<boolean> {
    try {
      console.log('Testing auth endpoint connectivity...');
      
      // Try to make a request to the login endpoint with proper POST method
      // This should at least reach the server (even if it returns validation errors)
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test',
          deviceId: 'test-device'
        })
      });
      
      console.log('Auth endpoint response status:', response.status);
      console.log('Auth endpoint test - server endpoint is reachable');
      return true;
    } catch (error) {
      console.error('Auth endpoint connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Run all connectivity tests
   */
  static async runAllTests(): Promise<void> {
    console.log('=== HTTP Connectivity Test Suite ===');
    
    const publicAPIResult = await this.testPublicAPI();
    const backendConnectivityResult = await this.testBackendConnectivity();
    const authEndpointResult = await this.testAuthEndpoint();
    
    console.log('=== Test Results ===');
    console.log('Public API (internet):', publicAPIResult ? '✅ PASS' : '❌ FAIL');
    console.log('Backend Server:', backendConnectivityResult ? '✅ PASS' : '❌ FAIL');
    console.log('Auth Endpoint:', authEndpointResult ? '✅ PASS' : '❌ FAIL');
    
    if (publicAPIResult && !backendConnectivityResult) {
      console.log('🔍 Diagnosis: HTTP plugin works, but backend server may not be running or accessible');
    } else if (!publicAPIResult) {
      console.log('🔍 Diagnosis: HTTP plugin may have issues or network connectivity problems');
    } else if (backendConnectivityResult && authEndpointResult) {
      console.log('🔍 Diagnosis: All connectivity tests pass - check authentication request format');
    }
  }
}
