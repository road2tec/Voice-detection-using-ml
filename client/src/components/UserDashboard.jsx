import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeAudio } from '../services/api';
import LedIndicator from './LedIndicator';
import { playBuzzer } from '../utils/audio';

const UserDashboard = ({ users, selectedUserId, setSelectedUserId, history, setHistory, lockUserSelection = false, location }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const selectedUser = useMemo(
    () => users.find((user) => user._id === selectedUserId) || null,
    [users, selectedUserId],
  );

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError('');
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getSupportedRecordingMimeType = () => {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  };

  const startRecording = async () => {
    try {
      setError('');
      setResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = getSupportedRecordingMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blobType = recorder.mimeType || mimeType || 'audio/webm';
        const extension = blobType.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(recordingChunksRef.current, { type: blobType });
        const file = new File([blob], `recording-${Date.now()}.${extension}`, { type: blobType });

        setSelectedFile(file);
        setIsRecording(false);

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        setRecordingDuration(0);

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setError('Microphone access denied or recording failed.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const analyzeUploadedAudio = async () => {
    if (!selectedUserId) {
      setError('Select a user before uploading audio.');
      return;
    }

    if (!selectedFile) {
      setError('Please choose an audio file first.');
      return;
    }

    try {
      setError('');
      setResult(null);
      setAnalyzing(true);

      const analysis = await analyzeAudio({ 
        userId: selectedUserId, 
        audioBlob: selectedFile,
        latitude: location?.latitude,
        longitude: location?.longitude
      });
      setResult(analysis);

      if (analysis.danger) {
        playBuzzer();
      }

      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          label: analysis.label,
          danger: analysis.danger,
          confidence: analysis.confidence,
          reason: analysis.reason,
          modelUsed: analysis.modelUsed,
          timestamp: analysis.timestamp,
        },
        ...prev,
      ]);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to analyze audio.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">User Dashboard</h2>
        <LedIndicator danger={Boolean(result?.danger)} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="grid gap-3">
          <select
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            disabled={lockUserSelection}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none ring-blue-400/40 focus:ring"
          >
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>

          <input
            type="file"
            accept="audio/*"
            onChange={onFileChange}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startRecording}
              disabled={isRecording || analyzing}
              className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start Recording
            </button>

            <button
              type="button"
              onClick={stopRecording}
              disabled={!isRecording}
              className="rounded-md border border-red-500/60 bg-red-900/20 px-3 py-1.5 text-sm font-medium text-red-200 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Stop Recording
            </button>

            {isRecording && (
              <span className="text-xs text-red-300">Recording... {recordingDuration}s</span>
            )}
          </div>
        </div>

        <button
          onClick={analyzeUploadedAudio}
          disabled={analyzing || !selectedFile}
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900"
        >
          Analyze Audio
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
        <span className={`h-3 w-3 rounded-full ${analyzing ? 'animate-pulse bg-blue-500' : 'bg-slate-500'}`} />
        {analyzing
          ? 'Audio uploaded. Sending to ML for detection...'
          : selectedFile
            ? `Selected file: ${selectedFile.name}`
            : 'Upload audio file or record audio (.wav/.webm/.mp3/.m4a)'}
      </div>

      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
        <p className="text-sm text-slate-400">Active User</p>
        <p className="text-lg font-medium text-white">{selectedUser?.name || 'No user selected'}</p>

        <p className="mt-4 text-sm text-slate-400">Detected Sound</p>
        <p className="text-2xl font-bold text-white">{result?.label || '—'}</p>

        <p className="mt-2 text-sm text-slate-300">
          Confidence: {typeof result?.confidence === 'number' ? `${Math.round(result.confidence * 100)}%` : 'N/A'}
        </p>

        {result?.modelUsed && <p className="mt-2 text-sm text-slate-400">Loaded with ML Model</p>}
        {result?.reason && <p className="mt-1 text-sm text-slate-400">Reason: {result.reason}</p>}

        {analyzing && <p className="mt-3 text-sm text-blue-300">Analyzing audio...</p>}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Recent Alerts</h3>
        <div className="mt-3 space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No alerts yet for this user.</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id || item._id}
                className={`rounded-lg border px-3 py-2 ${
                  item.danger ? 'border-red-500/50 bg-red-950/30' : 'border-slate-700 bg-slate-800/60'
                }`}
              >
                <p className="font-medium text-slate-100">{item.label}</p>
                <p className="text-xs text-slate-400">{formatTimestamp(item.timestamp)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default UserDashboard;
