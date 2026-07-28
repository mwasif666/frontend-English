import { useCallback, useEffect, useRef, useState } from 'react';

export const useSpeechRecognition = ({ onResult, language = 'en-US' }) => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState('');

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
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();
      const finalResult = event.results[event.results.length - 1].isFinal;
      onResult(transcript, finalResult);
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

  return { isListening, supported, error, startListening, stopListening };
};