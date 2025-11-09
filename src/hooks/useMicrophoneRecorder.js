import { useCallback, useEffect, useRef, useState } from 'react';

const MIME_TYPE = 'audio/webm';

export function useMicrophoneRecorder({ endpoint }) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    async function requestPermission() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissionGranted(true);
      } catch (err) {
        setError('Microphone permission denied.');
      }
    }
    if (typeof window !== 'undefined' && navigator?.mediaDevices) {
      requestPermission();
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
    setRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!permissionGranted) {
      setError('Microphone permission not granted.');
      return;
    }
    chunksRef.current = [];
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream, { mimeType: MIME_TYPE });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: MIME_TYPE });
          if (!blob.size) return;
          const formData = new FormData();
          formData.append('file', blob, 'answer.webm');
          try {
            await fetch(endpoint, {
              method: 'POST',
              body: formData,
            });
          } catch (uploadError) {
            setError('Failed to upload audio.');
          }
        };

        recorder.start();
        setRecording(true);
      })
      .catch(() => {
        setError('Unable to access microphone.');
      });
  }, [permissionGranted, endpoint]);

  return {
    permissionGranted,
    recording,
    error,
    startRecording,
    stopRecording,
  };
}
