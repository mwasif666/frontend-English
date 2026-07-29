import { useCallback, useEffect, useRef, useState } from 'react';

export const useSpeechRecognition = ({ onResult, language = 'en-US' }) => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState('');
  const [lastConfidence, setLastConfidence] = useState(null);
  const [lastInputMode, setLastInputMode] = useState('typed');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError('');
      setIsListening(true);
      setLastInputMode('speech');
    };

    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const transcript = results
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();
      const latestResult = event.results[event.results.length - 1];
      const finalResult = latestResult.isFinal;
      const confidence = Number(latestResult[0]?.confidence);
      if (Number.isFinite(confidence) && confidence > 0) setLastConfidence(confidence);
      onResult(transcript, finalResult, Number.isFinite(confidence) ? confidence : null);
    };

    recognition.onerror = (event) => {
      const friendlyMessages = {
        'not-allowed': 'Microphone permission was blocked.',
        'no-speech': 'I could not hear anything. Please try again.',
        network: 'Speech recognition needs an internet connection in this browser.',
      };
      setError(friendlyMessages[event.error] || 'Voice recognition stopped unexpectedly.');
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => recognition.abort();
  }, [language, onResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
    } catch {
      setError('The microphone is already active.');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const markTyped = useCallback(() => {
    setLastInputMode('typed');
    setLastConfidence(null);
  }, []);

  return {
    isListening,
    supported,
    error,
    lastConfidence,
    lastInputMode,
    startListening,
    stopListening,
    markTyped,
  };
};
