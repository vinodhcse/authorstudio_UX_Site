import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

const WhisperTestPage: React.FC = () => {
  const [testFiles, setTestFiles] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{[key: string]: string}>({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadTestFiles();
  }, []);

  const loadTestFiles = async () => {
    try {
      const files = await invoke('list_test_audio_files') as string[];
      setTestFiles(files);
    } catch (error) {
      console.error('Failed to load test files:', error);
    }
  };

  const generateTestFile = async (text: string, filename: string) => {
    setIsGenerating(true);
    try {
      await invoke('create_test_audio_file', { text, filename });
      await loadTestFiles(); // Refresh file list
      setTestResults(prev => ({
        ...prev,
        [filename]: `✅ Generated test file for: "${text}"`
      }));
    } catch (error) {
      console.error('Failed to generate test file:', error);
      setTestResults(prev => ({
        ...prev,
        [filename]: `❌ Failed to generate: ${error}`
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const testWithFile = async (filename: string) => {
    const filePath = `test-audio/${filename}`;
    try {
      const result = await invoke('test_whisper_with_file', { filePath }) as string;
      setTestResults(prev => ({
        ...prev,
        [filename]: `🗣️ Transcribed: "${result}"`
      }));
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults(prev => ({
        ...prev,
        [filename]: `❌ Test failed: ${error}`
      }));
    }
  };

  const testSineWave = async () => {
    try {
      const result = await invoke('test_whisper_with_sine_wave') as string;
      setTestResults(prev => ({
        ...prev,
        'sine-wave': result
      }));
    } catch (error) {
      console.error('Sine wave test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'sine-wave': `❌ Test failed: ${error}`
      }));
    }
  };

  const testSpeechPattern = async () => {
    try {
      const result = await invoke('test_whisper_with_speech_pattern') as string;
      setTestResults(prev => ({
        ...prev,
        'speech-pattern': result
      }));
    } catch (error) {
      console.error('Speech pattern test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'speech-pattern': `❌ Test failed: ${error}`
      }));
    }
  };

  const testSilence = async () => {
    try {
      const result = await invoke('test_whisper_silence') as string;
      setTestResults(prev => ({
        ...prev,
        'silence': result
      }));
    } catch (error) {
      console.error('Silence test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'silence': `❌ Test failed: ${error}`
      }));
    }
  };

  const testNoise = async () => {
    try {
      const result = await invoke('test_whisper_noise') as string;
      setTestResults(prev => ({
        ...prev,
        'noise': result
      }));
    } catch (error) {
      console.error('Noise test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'noise': `❌ Test failed: ${error}`
      }));
    }
  };

  const testMicrophoneNoise = async () => {
    try {
      const result = await invoke('test_whisper_microphone_noise') as string;
      setTestResults(prev => ({
        ...prev,
        'microphone-noise': result
      }));
    } catch (error) {
      console.error('Microphone noise test failed:', error);
      setTestResults(prev => ({
        ...prev,
        'microphone-noise': `❌ Test failed: ${error}`
      }));
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🧪 Whisper Engine Test Lab
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Test Whisper transcription accuracy with different audio patterns
        </p>
      </div>

      {/* Quick Tests */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          � Quick Tests
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Sine Wave Test</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Pure 440Hz tone - should produce no text or minimal hallucination
            </p>
            <button 
              onClick={testSineWave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🎵 Test Sine Wave
            </button>
            {testResults['sine-wave'] && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {testResults['sine-wave']}
              </div>
            )}
          </div>

          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Speech Pattern Test</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Complex waveform simulating "mike testing 123"
            </p>
            <button 
              onClick={testSpeechPattern}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              🗣️ Test Speech Pattern
            </button>
            {testResults['speech-pattern'] && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {testResults['speech-pattern']}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW: Diagnostic Tests */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🧪 Diagnostic Tests (Key for fixing your microphone issue!)
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          These tests help us understand why Whisper produces "electronic music" instead of speech
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">🔇 Silence Test</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Pure silence - should produce no hallucination
            </p>
            <button 
              onClick={testSilence}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              🔇 Test Silence
            </button>
            {testResults['silence'] && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {testResults['silence']}
              </div>
            )}
          </div>

          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">📻 White Noise Test</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Random noise - should be ignored by Whisper
            </p>
            <button 
              onClick={testNoise}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              📻 Test Noise
            </button>
            {testResults['noise'] && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {testResults['noise']}
              </div>
            )}
          </div>

          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">🚨 Microphone Noise</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              <strong>THIS IS THE KEY TEST!</strong> Simulates mic background
            </p>
            <button 
              onClick={testMicrophoneNoise}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              🎤 Test Mic Noise
            </button>
            {testResults['microphone-noise'] && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {testResults['microphone-noise']}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 What These Tests Tell Us:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li><strong>If silence produces text:</strong> Whisper is hallucinating from nothing</li>
            <li><strong>If noise produces "electronic music":</strong> Whisper correctly identifies non-speech</li>
            <li><strong>If microphone noise produces specific text:</strong> This reveals what your real microphone sounds like to Whisper!</li>
          </ul>
        </div>
      </div>

      {/* File Generation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🎵 Generate Test Files
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { text: "mike testing 123", filename: "mike-testing-123.wav" },
            { text: "hello world", filename: "hello-world.wav" },
            { text: "the quick brown fox", filename: "quick-brown-fox.wav" }
          ].map(({ text, filename }) => (
            <div key={filename} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">"{text}"</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => generateTestFile(text, filename)}
                  disabled={isGenerating}
                  className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                >
                  {isGenerating ? '🔄 Generating...' : '🎵 Generate WAV'}
                </button>
                {testFiles.includes(filename) && (
                  <button 
                    onClick={() => testWithFile(filename)}
                    className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    🧪 Test File
                  </button>
                )}
              </div>
              {testResults[filename] && (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                  {testResults[filename]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Existing Files */}
      {testFiles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📁 Test Files ({testFiles.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testFiles.map(filename => (
              <div key={filename} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{filename}</h3>
                <button 
                  onClick={() => testWithFile(filename)}
                  className="w-full px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                >
                  🧪 Test Transcription
                </button>
                {testResults[filename] && (
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                    {testResults[filename]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          🎯 Testing Strategy
        </h3>
        <div className="text-yellow-700 dark:text-yellow-300 text-sm space-y-2">
          <p><strong>1. Sine Wave Test:</strong> Should produce no text (tests for hallucination)</p>
          <p><strong>2. Speech Pattern Test:</strong> Complex waveform that might trigger recognition</p>
          <p><strong>3. Generated WAV Files:</strong> Frequency patterns mapped to expected text</p>
          <p><strong>4. Compare Results:</strong> If Whisper works correctly with these, the issue is in real-time streaming</p>
        </div>
      </div>
    </div>
  );
};

export default WhisperTestPage;
