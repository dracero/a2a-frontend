const BASE_URL = 'http://localhost:12000';

export interface Message {
  message_id: string;
  context_id: string;
  sender: string;
  recipient?: string;
  parts: Part[];
}

export interface Part {
  root: TextPart | FilePart;
}

export interface TextPart {
  kind: 'text';
  text: string;
}

export interface FilePart {
  kind: 'file';
  file: {
    mime_type: string;
    uri?: string;
    bytes?: string;
  };
}

export interface Conversation {
  conversation_id: string;
  messages: Message[];
}

export interface MessageInfo {
  message_id: string;
  context_id: string;
}

export interface Event {
  id: string;
  type: string;
  timestamp: string;
  data: any;
}

export interface Task {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export class ChatAPI {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async createConversation(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/conversation/create`, {
      method: 'POST',
    });
    const data = await response.json();
    return data.result;
  }

  async sendMessage(message: Message): Promise<MessageInfo> {
    const response = await fetch(`${this.baseUrl}/message/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ params: message }),
    });
    const data = await response.json();
    return data.result;
  }

  async listMessages(conversationId: string): Promise<Message[]> {
    const response = await fetch(`${this.baseUrl}/message/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ params: conversationId }),
    });
    const data = await response.json();
    return data.result;
  }

  async listConversations(): Promise<Conversation[]> {
    const response = await fetch(`${this.baseUrl}/conversation/list`, {
      method: 'POST',
    });
    const data = await response.json();
    return data.result;
  }

  async getPendingMessages(): Promise<Message[]> {
    const response = await fetch(`${this.baseUrl}/message/pending`, {
      method: 'POST',
    });
    const data = await response.json();
    return data.result;
  }

  async getEvents(): Promise<Event[]> {
    const response = await fetch(`${this.baseUrl}/events/get`, {
      method: 'POST',
    });
    const data = await response.json();
    return data.result || [];
  }

  async listTasks(): Promise<Task[]> {
    const response = await fetch(`${this.baseUrl}/task/list`, {
      method: 'POST',
    });
    const data = await response.json();
    return data.result || [];
  }

  async registerAgent(url: string): Promise<void> {
    await fetch(`${this.baseUrl}/agent/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ params: url }),
    });
  }

  async listAgents(): Promise<Agent[]> {
    const response = await fetch(`${this.baseUrl}/agent/list`, {
      method: 'POST',
    });
    const data = await response.json();
    return data.result || [];
  }

  getFileUrl(fileId: string): string {
    return `${this.baseUrl}/message/file/${fileId}`;
  }

  async updateApiKey(apiKey: string): Promise<void> {
    await fetch(`${this.baseUrl}/api_key/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ api_key: apiKey }),
    });
  }
}

export const chatAPI = new ChatAPI();
