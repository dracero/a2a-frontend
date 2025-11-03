'use client';

import { useState, useEffect, useRef } from 'react';
import { chatAPI, Message, Part, Conversation } from '@/lib/api'; // Part se importa automáticamente como el nuevo tipo
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, MessageSquare } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function ChatInterface() {
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Message[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeChat(); // Inicia un nuevo chat por defecto
    loadConversations(); // Carga las conversaciones existentes
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Carga todas las conversaciones para el dropdown
  const loadConversations = async () => {
    try {
      const convs = await chatAPI.listConversations();
      // Filtramos cualquier entrada nula o indefinida de la API
      setAllConversations(
        convs.filter((conv) => conv && conv.conversation_id).reverse()
      );
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const initializeChat = async () => {
    setIsLoading(true);
    try {
      const convId = await chatAPI.createConversation();
      setConversationId(convId);
      const msgs = await chatAPI.listMessages(convId);
      setMessages(msgs);
      // Añadir la nueva conversación a la lista del dropdown
      setAllConversations((prev) => [
        { conversation_id: convId, messages: msgs },
        ...prev,
      ]);
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
      if (!convId) return;
      try {
        const msgs = await chatAPI.listMessages(convId);
        setMessages((prevMsgs) => {
          if (JSON.stringify(prevMsgs) !== JSON.stringify(msgs)) {
            // Actualizar también la lista de conversaciones
            setAllConversations((prevConvs) =>
              prevConvs.map((conv) =>
                conv.conversation_id === convId ? { ...conv, messages: msgs } : conv
              )
            );
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
      // --- INICIO DE LA CORRECCIÓN ---
      // El tipo 'Part[]' ahora es (TextPart | FilePart)[] gracias a la corrección en lib/api.ts
      const parts: Part[] = [];

      if (image) {
        // Ya no envolvemos la parte en '{ root: ... }'
        parts.push({
          kind: 'file',
          file: {
            mime_type: image.mimeType,
            bytes: image.bytes,
          },
        });
      }

      if (text) {
        // Ya no envolvemos la parte en '{ root: ... }'
        parts.push({
          kind: 'text',
          text: text,
        });
      }
      // --- FIN DE LA CORRECCIÓN ---

      const message: Message = {
        message_id: crypto.randomUUID(),
        context_id: conversationId,
        role: 'user',
        parts: parts,
      };

      setMessages((prevMsgs) => [...(prevMsgs || []), message]);
      await chatAPI.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Manejador para el botón "New Chat"
  const handleNewConversation = async () => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setMessages(undefined);
    try {
      const convId = await chatAPI.createConversation();
      setConversationId(convId);
      setMessages([]);
      setAllConversations((prev) => [
        { conversation_id: convId, messages: [] },
        ...prev,
      ]);
      startPolling(convId);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Manejador para el Dropdown
  const handleSelectConversation = (convId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setConversationId(convId);
    const selectedConv = allConversations.find(
      (c) => c.conversation_id === convId
    );
    setMessages(selectedConv?.messages || []);
    startPolling(convId);
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

        <div className="flex items-center gap-2">
          <Select
            value={conversationId}
            onValueChange={handleSelectConversation}
            disabled={isCreatingChat}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a conversation" />
            </SelectTrigger>
            <SelectContent>
              {allConversations
                // Filtramos robustamente ANTES de hacer .map()
                .filter(
                  (conv): conv is Conversation & { conversation_id: string } =>
                    conv && typeof conv.conversation_id === 'string'
                )
                .map((conv) => (
                  <SelectItem
                    key={conv.conversation_id}
                    value={conv.conversation_id}
                  >
                    {conv.conversation_id.slice(0, 8)}... (
                    {conv.messages?.length || 0} msgs)
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleNewConversation}
            variant="outline"
            className="gap-2"
            disabled={isCreatingChat}
          >
            {isCreatingChat ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New Chat
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
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