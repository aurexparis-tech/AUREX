export interface Agent {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  model: string;
  temperature: number;
  emoji: string;
  themeColor: "slate" | "indigo" | "emerald" | "rose" | "purple" | "amber" | "sky" | "violet";
  isTemplate?: boolean;
  starters?: string[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  agentEmoji?: string;
}

export interface ChatSession {
  id: string;
  agentId: string;
  title: string;
  messages: Message[];
  lastUpdated: string;
}

export interface ScheduledEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sendAt: number;
  status: "pending" | "sending" | "sent" | "failed";
  error?: string;
  sentAt?: number;
}

