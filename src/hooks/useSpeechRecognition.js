import { useCallback, useEffect, useRef, useState } from 'react';

const getRecognitionClass = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const isFirefox = () => /firefox|fxios/i.test(navigator.userAgent);

const describeUnsupported = () => {
  if (typeof window === 'undefined') return '';
  if (!window.isSecureContext) {
    return 'Voice input only works on a secure page. Open SpeakFlow over https (or on localhost) to speak your answers.';
  }
  if (isFirefox()) {
    return 'Firefox has no built-in speech recognition, so it cannot turn your voice into text. This is a browser limit, not a blocked microphone. Use Chrome, Edge or Safari to speak — typing works everywhere.';
  }
  return 'This browser cannot transcribe speech. Chrome, Edge or Safari work best for voice practice.';
};

export const useSpeechRecognition = ({ onResult, language = 'en-US' }) => {
  const recognitionRef = useRef(null);
  const listeningRequestedRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const restartTimerRef = useRef(null);
  const accumulatedTranscriptRef = useRef('');
  const currentTranscriptRef = useRef('');
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(() => Boolean(getRecognitionClass()));
  const [unsupportedReason, setUnsupportedReason] = useState(() => (getRecognitionClass() ? '' : describeUnsupported()));
  const [permission, setPermission] = useState('unknown');
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [error, setError] = useState('');
  const [lastConfidence, setLastConfidence] = useState(null);
  const [lastInputMode, setLastInputMode] = useState('typed');

  useEffect(() => {
    const SpeechRecognition = getRecognitionClass();
    if (!SpeechRecognition) {
      setSupported(false);
      setUnsupportedReason(describeUnsupported());
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const clearTimers = () => {
      window.clearTimeout(silenceTimerRef.current);
      window.clearTimeout(restartTimerRef.current);
    };

    const armSilenceTimer = () => {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = window.setTimeout(() => {
        listeningRequestedRef.current = false;
        recognition.stop();
        setIsListening(false);
      }, 10000);
    };

    recognition.onstart = () => {
      setError('');
      setIsListening(true);
      setLastInputMode('speech');
      armSilenceTimer();
    };

    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const transcript = results
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();
      currentTranscriptRef.current = transcript;
      const completeTranscript = [
        accumulatedTranscriptRef.current,
        currentTranscriptRef.current,
      ].filter(Boolean).join(' ');
      const latestResult = event.results[event.results.length - 1];
      const finalResult = latestResult.isFinal;
      const confidence = Number(latestResult[0]?.confidence);
      if (Number.isFinite(confidence) && confidence > 0) setLastConfidence(confidence);
      onResult(completeTranscript, finalResult, Number.isFinite(confidence) ? confidence : null);
      armSilenceTimer();
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setPermission('denied');
        setError('The microphone is blocked for this site. Open the padlock icon in the address bar, allow the microphone, then try again.');
      } else if (event.error === 'no-speech') {
        // Browsers often report no-speech after only a couple of seconds.
        // Keep the requested session alive; our own ten-second silence timer controls it.
      } else if (event.error === 'audio-capture') {
        setError('No microphone was found. Connect one and reload the page.');
      } else if (event.error === 'network') {
        setError('Speech recognition needs an internet connection in this browser.');
      } else if (event.error !== 'aborted') {
        setError('Voice recognition stopped unexpectedly. Please try again.');
      }
      if (event.error !== 'no-speech') {
        listeningRequestedRef.current = false;
        clearTimers();
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (listeningRequestedRef.current) {
        accumulatedTranscriptRef.current = [
          accumulatedTranscriptRef.current,
          currentTranscriptRef.current,
        ].filter(Boolean).join(' ');
        currentTranscriptRef.current = '';
        restartTimerRef.current = window.setTimeout(() => {
          try {
            recognition.start();
          } catch {
            listeningRequestedRef.current = false;
            setIsListening(false);
          }
        }, 120);
        return;
      }
      clearTimers();
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    setSupported(true);
    setUnsupportedReason('');

    return () => {
      listeningRequestedRef.current = false;
      clearTimers();
      recognition.abort();
    };
  }, [language, onResult]);

  useEffect(() => {
    let cancelled = false;
    let status = null;

    const watchPermission = async () => {
      if (!navigator.permissions?.query) return;
      try {
        status = await navigator.permissions.query({ name: 'microphone' });
        if (cancelled) return;
        setPermission(status.state);
        status.onchange = () => setPermission(status.state);
      } catch {
        // Firefox and older browsers reject the "microphone" permission name.
      }
    };

    watchPermission();
    return () => {
      cancelled = true;
      if (status) status.onchange = null;
    };
  }, []);

  const requestMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not expose microphone access.');
      return false;
    }

    setRequestingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermission('granted');
      setError('');
      return true;
    } catch (permissionError) {
      const name = permissionError?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setPermission('denied');
        setError('Microphone access was blocked. Click the padlock icon next to the address bar, set Microphone to "Allow", then reload.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('No microphone was found on this device.');
      } else {
        setError('The microphone could not be started. Close other apps using it and try again.');
      }
      return false;
    } finally {
      setRequestingPermission(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;
    if (!recognitionRef.current) {
      setError(unsupportedReason || describeUnsupported());
      return;
    }

    if (permission !== 'granted') {
      const allowed = await requestMicrophone();
      if (!allowed) return;
    }

    try {
      listeningRequestedRef.current = true;
      accumulatedTranscriptRef.current = '';
      currentTranscriptRef.current = '';
      recognitionRef.current.start();
    } catch {
      listeningRequestedRef.current = false;
      setError('The microphone is already active.');
    }
  }, [isListening, permission, requestMicrophone, unsupportedReason]);

  const stopListening = useCallback(() => {
    listeningRequestedRef.current = false;
    window.clearTimeout(silenceTimerRef.current);
    window.clearTimeout(restartTimerRef.current);
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const markTyped = useCallback(() => {
    setLastInputMode('typed');
    setLastConfidence(null);
  }, []);

  const dismissError = useCallback(() => setError(''), []);

  return {
    isListening,
    supported,
    unsupportedReason,
    permission,
    requestingPermission,
    error,
    lastConfidence,
    lastInputMode,
    startListening,
    stopListening,
    requestMicrophone,
    markTyped,
    dismissError,
  };
};
