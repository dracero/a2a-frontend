'use client';

import { Message, Part } from '@/lib/api';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // --- CORRECCIÓN AQUÍ ---
  // Cambiamos 'sender' por 'role' para coincidir con el backend
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex items-start gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-blue-600' : 'bg-slate-800'
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-white" />
        )}
      </div>

      <div
        className={cn(
          'flex flex-col gap-2 max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-slate-100 text-slate-900 rounded-tl-sm'
        )}
      >
        {/*
          Esta comprobación es importante. Si 'parts' no existe o está vacío,
          no intentará mapearlo, evitando errores si el backend envía un
          mensaje sin partes (aunque no debería).
        */}
        {message.parts?.map((part, index) => (
          <MessagePart key={index} part={part} isUser={isUser} />
        ))}
      </div>
    </div>
  );
}

function MessagePart({ part, isUser }: { part: Part; isUser: boolean }) {
  const content = part.root;

  if (content.kind === 'text') {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {content.text}
      </p>
    );
  }

  if (content.kind === 'file') {
    const isImage = content.file.mime_type?.startsWith('image/');

    if (isImage) {
      let imageSrc = '';
      if (content.file.uri) {
        // Usamos una ruta relativa para que el proxy (en next.config.js) funcione
        imageSrc = content.file.uri;
      } else if (content.file.bytes) {
        imageSrc = `data:${content.file.mime_type};base64,${content.file.bytes}`;
      }

      return (
        <div className="rounded-lg overflow-hidden">
          <img
            src={imageSrc}
            alt="Uploaded content"
            className="max-w-full h-auto max-h-96 object-contain"
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          'text-sm px-3 py-2 rounded-lg',
          isUser ? 'bg-blue-700' : 'bg-slate-200'
        )}
      >
        File: {content.file.mime_type}
      </div>
    );
  }

  return null;
}