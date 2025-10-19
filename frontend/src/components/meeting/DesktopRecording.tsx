/**
 * Desktop Recording Component
 * Works in both Electron (with Desktop SDK) and Browser (shows instructions)
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Transcript, MeetingDetected } from '@/types/electron';

export default function DesktopRecording() {
  const { user } = useUser();
  const [isElectron, setIsElectron] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingDetected | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check if running in Electron
  useEffect(() => {
    const inElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
    setIsElectron(!!inElectron);

    if (inElectron) {
      console.log('✅ Running in Electron with Desktop SDK');
      setupElectronListeners();
    } else {
      console.log('ℹ️  Running in browser (no Desktop SDK)');
    }

    return () => {
      // Cleanup listeners
      if (inElectron) {
        window.electronAPI.removeListener('sdk-ready');
        window.electronAPI.removeListener('meeting-detected');
        window.electronAPI.removeListener('recording-started');
        window.electronAPI.removeListener('new-transcript');
        window.electronAPI.removeListener('recording-complete');
        window.electronAPI.removeListener('upload-progress');
        window.electronAPI.removeListener('upload-complete');
        window.electronAPI.removeListener('recording-error');
        window.electronAPI.removeListener('upload-error');
        window.electronAPI.removeListener('sdk-error');
      }
    };
  }, []);

  const setupElectronListeners = () => {
    // SDK ready
    window.electronAPI.onSdkReady(() => {
      console.log('🖥️  Desktop SDK ready');
      setSdkReady(true);
      setError(null);
    });

    // Meeting detected
    window.electronAPI.onMeetingDetected((data) => {
      console.log('✅ Meeting detected:', data);
      setCurrentMeeting(data);
      setError(null);
    });

    // Recording started
    window.electronAPI.onRecordingStarted((data) => {
      console.log('🎥 Recording started:', data);
      setIsRecording(true);
      setError(null);
    });

    // New transcript
    window.electronAPI.onNewTranscript((transcript) => {
      console.log('[TRANSCRIPT]', transcript.speaker, ':', transcript.text);
      setTranscripts((prev) => [...prev, transcript]);
    });

    // Recording complete
    window.electronAPI.onRecordingComplete(() => {
      console.log('📤 Recording complete, uploading...');
      setIsRecording(false);
    });

    // Upload progress
    window.electronAPI.onUploadProgress((data) => {
      console.log(`📊 Upload progress: ${data.progress}%`);
      setUploadProgress(data.progress);
    });

    // Upload complete
    window.electronAPI.onUploadComplete(() => {
      console.log('✅ Upload complete');
      setUploadProgress(100);
      setCurrentMeeting(null);
      // Keep transcripts for review
    });

    // Errors
    window.electronAPI.onRecordingError((err) => {
      console.error('❌ Recording error:', err.message);
      setError(`Recording error: ${err.message}`);
      setIsRecording(false);
    });

    window.electronAPI.onUploadError((err) => {
      console.error('❌ Upload error:', err.message);
      setError(`Upload error: ${err.message}`);
    });

    window.electronAPI.onSdkError((err) => {
      console.error('❌ SDK error:', err.message);
      setError(`SDK error: ${err.message}`);
    });
  };

  const handleClearTranscripts = () => {
    setTranscripts([]);
  };

  // Electron UI
  if (isElectron) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Desktop Recording with Recall.ai</CardTitle>
          <CardDescription>
            Automatic local recording of Zoom and Google Meet meetings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* SDK Status */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Desktop SDK Status</h3>
                <p className="text-sm text-muted-foreground">
                  {sdkReady ? '✅ Ready and monitoring' : '⏳ Initializing...'}
                </p>
              </div>
              {sdkReady && (
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Current Meeting */}
          {currentMeeting && (
            <div className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950 p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Meeting Detected: {currentMeeting.platform}
                </span>
              </div>
              {isRecording && (
                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  Recording in progress...
                </p>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading recording...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          {!currentMeeting && !isRecording && (
            <Alert>
              <AlertDescription>
                <strong>How it works:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Join a Zoom or Google Meet meeting</li>
                  <li>The Desktop SDK will automatically detect it</li>
                  <li>Recording starts automatically</li>
                  <li>Real-time transcripts appear below</li>
                  <li>After the meeting, recording uploads automatically</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {/* Transcripts */}
          {transcripts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Live Transcripts ({transcripts.length})</h3>
                <Button variant="outline" size="sm" onClick={handleClearTranscripts}>
                  Clear
                </Button>
              </div>
              <div className="rounded-lg border max-h-96 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {transcripts.map((transcript, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{transcript.speaker}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(transcript.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{transcript.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Browser UI (show instructions to download Electron app)
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Desktop Recording</CardTitle>
        <CardDescription>
          Local recording of Zoom and Google Meet meetings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Desktop App Required</strong>
            <p className="mt-2">
              To use the Desktop Recording feature, you need to download and install the SayLess desktop application.
            </p>
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border bg-muted p-4 space-y-3 text-sm">
          <p className="font-semibold">Why Desktop App?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Records meetings locally on your computer</li>
            <li>Automatic detection of Zoom and Google Meet</li>
            <li>Real-time transcription while recording</li>
            <li>Better privacy - recordings stay on your device until uploaded</li>
          </ul>
        </div>

        <Button className="w-full" disabled>
          Download Desktop App (Coming Soon)
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <p>Or use the <strong>Cloud Bot</strong> feature to record meetings from your browser</p>
        </div>
      </CardContent>
    </Card>
  );
}
