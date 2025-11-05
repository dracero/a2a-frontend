'use client';

import { Message, Part } from '@/lib/api';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
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
        {message.parts?.map((part, index) => (
          <MessagePart key={index} part={part} isUser={isUser} />
        ))}
      </div>
    </div>
  );
}

function MessagePart({ part, isUser }: { part: Part; isUser: boolean }) {
  // Guard clause
  if (!part || typeof part.kind === 'undefined') {
    return null;
  }

  if (part.kind === 'text') {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {part.text}
      </p>
    );
  }

  if (part.kind === 'file') {
    const isImage = part.file.mime_type?.startsWith('image/');

    if (isImage) {
      let imageSrc = '';
      
      if (part.file.uri) {
        // ✅ CORRECCIÓN: Manejar URIs del backend correctamente
        if (part.file.uri.startsWith('/message/file/')) {
          // URI relativa del backend - usar directamente (el proxy lo manejará)
          imageSrc = part.file.uri;
        } else if (part.file.uri.startsWith('http://') || part.file.uri.startsWith('https://')) {
          // URI absoluta externa
          imageSrc = part.file.uri;
        } else if (part.file.uri.startsWith('gs://')) {
          // Google Storage - necesita conversión (esto depende de tu backend)
          console.warn('GS URI no soportada directamente:', part.file.uri);
          imageSrc = part.file.uri;
        } else {
          // Otra URI relativa
          imageSrc = part.file.uri;
        }
      } else if (part.file.bytes) {
        // Datos en base64
        imageSrc = `data:${part.file.mime_type};base64,${part.file.bytes}`;
      }

      if (!imageSrc) {
        return (
          <div className="text-sm text-red-500">
            Error: No se pudo cargar la imagen
          </div>
        );
      }

      return (
        <div className="rounded-lg overflow-hidden">
          <Image
            src={imageSrc}
            alt="Uploaded content"
            width={400}
            height={300}
            className="max-w-full h-auto max-h-96 object-contain"
            style={{ width: 'auto', height: 'auto' }}
            onError={(e) => {
              console.error('Error loading image:', {
                src: imageSrc,
                mimeType: part.file.mime_type,
                hasBytes: !!part.file.bytes,
                hasUri: !!part.file.uri
              });
            }}
          />
        </div>
      );
    }

    // Archivo no-imagen
    return (
      <div
        className={cn(
          'text-sm px-3 py-2 rounded-lg',
          isUser ? 'bg-blue-700' : 'bg-slate-200'
        )}
      >
        File: {part.file.mime_type}
        {part.file.uri && (
          <a 
            href={part.file.uri} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 underline"
          >
            Download
          </a>
        )}
      </div>
    );
  }

  return null;
}