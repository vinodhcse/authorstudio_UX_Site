import React, { useState } from 'react';
import { HTTPTestClient } from '../auth/httpTestClient';
import { apiClient } from '../auth/apiClient';
import { getOrCreateDeviceId } from '../auth/deviceId';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  details?: any;
}

export const ConnectivityDebugger: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const runConnectivityTests = async () => {
    setIsRunning(true);
    clearResults();

    try {
      // Test 1: Basic HTTP connectivity
      addResult({ name: 'Starting connectivity tests...', success: true });

      // Test 2: Public API test
      try {
        const publicResult = await HTTPTestClient.testPublicAPI();
        addResult({
          name: 'Public API (jsonplaceholder)',
          success: publicResult,
          details: 'Tests if HTTP plugin works with external APIs'
        });
      } catch (error) {
        addResult({
          name: 'Public API (jsonplaceholder)',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Test 3: Backend server connectivity
      try {
        const backendResult = await HTTPTestClient.testBackendConnectivity();
        addResult({
          name: 'Backend Server (127.0.0.1:4000)',
          success: backendResult,
          details: 'Tests if backend server is reachable'
        });
      } catch (error) {
        addResult({
          name: 'Backend Server (127.0.0.1:4000)',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Test 4: Auth endpoint connectivity
      try {
        const authResult = await HTTPTestClient.testAuthEndpoint();
        addResult({
          name: 'Auth Endpoint (/auth/login)',
          success: authResult,
          details: 'Tests if auth endpoints are reachable'
        });
      } catch (error) {
        addResult({
          name: 'Auth Endpoint (/auth/login)',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Test 5: Device ID generation
      try {
        const deviceId = await getOrCreateDeviceId();
        addResult({
          name: 'Device ID Generation',
          success: !!deviceId,
          details: `Device ID: ${deviceId.substring(0, 8)}...`
        });
      } catch (error) {
        addResult({
          name: 'Device ID Generation',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Test 6: API Client isOnline check
      try {
        const isOnline = apiClient.isOnline();
        addResult({
          name: 'API Client Online Status',
          success: isOnline,
          details: `Online: ${isOnline}`
        });
      } catch (error) {
        addResult({
          name: 'API Client Online Status',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }

    } catch (error) {
      addResult({
        name: 'Test Suite Error',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testSpecificEndpoint = async (endpoint: string, method: string = 'GET') => {
    setIsRunning(true);
    
    try {
      const baseUrl = 'http://127.0.0.1:4000/api';
      const url = `${baseUrl}${endpoint}`;
      
      addResult({ name: `Testing ${method} ${endpoint}...`, success: true });
      
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (method === 'POST' && endpoint.includes('/auth/login')) {
        requestOptions.body = JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword',
          deviceId: 'test-device-id'
        });
      }
      
      const response = await fetch(url, requestOptions);
      
      addResult({
        name: `${method} ${endpoint}`,
        success: response.status < 500, // Consider 4xx as success (server is responding)
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        }
      });
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        try {
          const data = await response.json();
          addResult({
            name: `${endpoint} Response Body`,
            success: true,
            details: data
          });
        } catch (e) {
          addResult({
            name: `${endpoint} Response Body`,
            success: false,
            error: 'Could not parse JSON response'
          });
        }
      }
      
    } catch (error) {
      addResult({
        name: `${method} ${endpoint}`,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Connectivity Debugger</h2>
        <p className="text-gray-600 mb-4">
          Use this tool to debug authentication and connectivity issues.
        </p>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={runConnectivityTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunning ? 'Running Tests...' : 'Run All Connectivity Tests'}
          </button>
          
          <button
            onClick={() => testSpecificEndpoint('/auth/login', 'POST')}
            disabled={isRunning}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Login Endpoint
          </button>
          
          <button
            onClick={() => testSpecificEndpoint('/auth/signup', 'POST')}
            disabled={isRunning}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Signup Endpoint
          </button>
          
          <button
            onClick={() => testSpecificEndpoint('/health', 'GET')}
            disabled={isRunning}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            Test Health Endpoint
          </button>
          
          <button
            onClick={clearResults}
            disabled={isRunning}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Clear Results
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded border ${
              result.success
                ? 'bg-green-50 border-green-200 text-green-800'
                : result.error
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {result.success ? '✅' : result.error ? '❌' : 'ℹ️'} {result.name}
              </span>
            </div>
            
            {result.error && (
              <div className="mt-1 text-sm opacity-80">
                Error: {result.error}
              </div>
            )}
            
            {result.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">
                  Show Details
                </summary>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {typeof result.details === 'string' 
                    ? result.details 
                    : JSON.stringify(result.details, null, 2)
                  }
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
      
      {results.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No tests run yet. Click "Run All Connectivity Tests" to start.
        </div>
      )}
    </div>
  );
};
