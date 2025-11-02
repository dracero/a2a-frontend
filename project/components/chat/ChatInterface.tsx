'use client';

import { useState, useEffect, useRef } from 'react';
import { chatAPI, Message, Part } from '@/lib/api';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatInterface() {
  const [conversationId, setConversationId] = useState<string>('');
  // Inicializamos 'messages' como 'undefined' para que coincida con el estado inicial
  const [messages, setMessages] = useState<Message[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true); // Empezamos en true
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeChat();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const initializeChat = async () => {
    setIsLoading(true);
    try {
      const convId = await chatAPI.createConversation();
      setConversationId(convId);
      // Hacemos una carga inicial de mensajes antes de empezar el polling
      const msgs = await chatAPI.listMessages(convId);
      setMessages(msgs);
      startPolling(convId);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (convId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const msgs = await chatAPI.listMessages(convId);
        // Comparamos si los mensajes son diferentes antes de actualizar
        // para evitar re-renders innecesarios
        setMessages((prevMsgs) => {
          if (JSON.stringify(prevMsgs) !== JSON.stringify(msgs)) {
            return msgs;
          }
          return prevMsgs;
        });
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    }, 1000);
  };

  const handleSendMessage = async (
    text: string,
    image?: { bytes: string; mimeType: string }
  ) => {
    if (!conversationId) return;

    setIsSending(true);

    try {
      const parts: Part[] = [];

      if (image) {
        parts.push({
          root: {
            kind: 'file',
            file: {
              mime_type: image.mimeType,
              bytes: image.bytes,
            },
          },
        });
      }

      if (text) {
        parts.push({
          root: {
            kind: 'text',
            text: text,
          },
        });
      }

      const message: Message = {
        message_id: crypto.randomUUID(),
        context_id: conversationId,
        role: 'user', // <-- ESTA ES LA CORRECCIÓN
        parts: parts,
      };

      // Añadimos el mensaje del usuario inmediatamente a la UI
      setMessages((prevMsgs) => [...(prevMsgs || []), message]);

      await chatAPI.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewConversation = async () => {
    setMessages(undefined); // Volvemos a undefined
    await initializeChat();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Initializing chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              AI Assistant
            </h1>
            <p className="text-sm text-slate-500">Powered by Agent SDK</p>
          </div>
        </div>

        <Button
          onClick={handleNewConversation}
          variant="outline"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* --- CORRECCIÓN APLICADA AQUÍ --- */}
        {/* Comprobamos si 'messages' no está definido O si su longitud es 0 */}
        {(!messages || messages.length === 0) ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                Start a conversation
              </h2>
              <p className="text-slate-600">
                Send a message or upload an image to begin chatting with the AI
                assistant. The assistant can analyze images and provide detailed
                responses.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* También añadimos una comprobación aquí por si acaso */}
            {messages.map((message) => (
              <MessageBubble key={message.message_id} message={message} />
            ))}
            {isSending && (
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
                <div className="bg-slate-100 text-slate-900 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-sm text-slate-600">Processing...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <MessageInput onSend={handleSendMessage} disabled={isSending} />
    </div>
  );
}