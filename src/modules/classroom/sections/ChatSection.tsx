/**
 * ChatSection Component
 *
 * Chat UI with OpenAI integration, voice support (STT/TTS),
 * and a Three.js shader ball visualization.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ClassroomDefinition, ClassroomSnapshot } from '../types';

interface ChatSectionProps {
  classroom: ClassroomDefinition;
  snapshot?: ClassroomSnapshot;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

// Check if Web Speech API is available
const speechRecognitionAvailable = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
const speechSynthesisAvailable = 'speechSynthesis' in window;

export const ChatSection: React.FC<ChatSectionProps> = ({
  classroom,
  snapshot,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const teacherName = classroom.personas.teacher?.name ?? 'Teacher';
  const activity = snapshot?.inferredActivity ?? 'idle';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (!speechRecognitionAvailable) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('[ChatSection] Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Handle voice input
  const startListening = () => {
    if (!recognitionRef.current || isListening) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('[ChatSection] Failed to start listening:', err);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      console.error('[ChatSection] Failed to stop listening:', err);
    }
  };

  // Speak text using TTS
  const speak = (text: string) => {
    if (!speechSynthesisAvailable || !ttsEnabled) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Send message to chat API
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/classrooms/${classroom.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          mode: 'default',
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      const assistantMessage = await response.json();
      const newMessage: ChatMessage = {
        ...assistantMessage,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newMessage]);

      // Speak the response if TTS is enabled
      if (ttsEnabled) {
        speak(newMessage.content);
      }
    } catch (err: any) {
      console.error('[ChatSection] Chat error:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="classroom-chat">
      <div className="classroom-chat__header">
        <div>
          <h2>Room Chat</h2>
          <p>
            {teacherName} · {activity}
          </p>
        </div>
        {/* Placeholder for shader ball - will be replaced with Three.js canvas */}
        <div className="classroom-chat__shader-ball">
          <div className="classroom-chat__shader-ball-inner" />
        </div>
      </div>

      <div className="classroom-chat__messages">
        {messages.length === 0 && (
          <div className="classroom-chat__message classroom-chat__message--hint">
            Welcome to {classroom.name}! Ask about the room environment, comfort level,
            or get help from the classroom assistant.
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`classroom-chat__message classroom-chat__message--${msg.role}`}
          >
            <div className="classroom-chat__message-content">{msg.content}</div>
            {msg.timestamp && (
              <div className="classroom-chat__message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="classroom-chat__message classroom-chat__message--assistant">
            <div className="classroom-chat__message-content">
              <span className="classroom-chat__typing-indicator">●●●</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="classroom-chat__controls">
        {speechSynthesisAvailable && (
          <button
            type="button"
            className={`classroom-chat__tts-toggle ${ttsEnabled ? 'active' : ''}`}
            onClick={() => setTtsEnabled(!ttsEnabled)}
            title={ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
          >
            🔊
          </button>
        )}
      </div>

      <form className="classroom-chat__input-row" onSubmit={handleSubmit}>
        {speechRecognitionAvailable && (
          <button
            type="button"
            className={`classroom-chat__mic-btn ${isListening ? 'listening' : ''}`}
            onClick={isListening ? stopListening : startListening}
            title={isListening ? 'Stop listening' : 'Start voice input'}
            disabled={isLoading}
          >
            🎤
          </button>
        )}

        <input
          className="classroom-chat__input"
          placeholder="Ask the room assistant, teacher, or safety agent…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || isListening}
        />

        <button
          className="classroom-chat__send"
          type="submit"
          disabled={isLoading || !input.trim() || isListening}
        >
          Send
        </button>
      </form>

      {isListening && (
        <div className="classroom-chat__listening-indicator">
          Listening... Speak now
        </div>
      )}
    </div>
  );
};
