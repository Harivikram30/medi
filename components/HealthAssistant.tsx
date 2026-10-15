
import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse } from '../services/geminiService';
import type { User, Medicine, Appointment } from '../types';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

interface HealthAssistantProps {
  users: User[];
  medicines: Medicine[];
  appointments: Appointment[];
}

const HealthAssistant: React.FC<HealthAssistantProps> = ({ users, medicines, appointments }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: 'Hello 👋 I’m MediBot. Ask me anything about our hospital or doctors.',
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);
  
  // Reset to initial state when chat is closed
  useEffect(() => {
    if (!isOpen) {
      setMessages([
        {
          text: 'Hello 👋 I’m MediBot. Ask me anything about our hospital or doctors.',
          sender: 'bot'
        }
      ]);
      setInput('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const botResponseText = await getChatbotResponse(input, { users, medicines, appointments });
    const botMessage: Message = { text: botResponseText, sender: 'bot' };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };


  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-primary text-white rounded-full p-3 shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform hover:scale-110 text-3xl flex items-center justify-center h-16 w-16"
        aria-label="Open MediBot Assistant"
      >
        💬
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-sm h-[60vh] bg-white dark:bg-dark-card rounded-xl shadow-2xl flex flex-col transition-all duration-300 animate-fadeIn">
          <div className="bg-primary text-white p-4 rounded-t-xl flex justify-between items-center">
            <h3 className="text-lg font-semibold">MediBot – Hospital Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-light dark:bg-dark-bg">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-dark-text'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
             {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="rounded-lg px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-dark-text">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm italic">MediBot is typing...</p>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t dark:border-dark-border bg-white dark:bg-dark-card rounded-b-xl">
            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                className="flex-1 border rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary bg-transparent dark:text-dark-text dark:border-gray-600"
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={isLoading || !input.trim()} className="ml-3 bg-primary text-white rounded-full p-2 hover:bg-primary/90 disabled:bg-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HealthAssistant;
