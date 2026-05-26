export type AgentMessageRole = 'user' | 'assistant';

export type AgentModelMode = 'auto' | 'fast' | 'smart';

export type AgentProvider = 'openai';

export type AgentChatMessage = {
  id: string;
  role: AgentMessageRole;
  content: string;
};

export type AgentResponse = {
  answer: string;
  conversationId?: string;
  model?: string;
  modelMode?: AgentModelMode;
  persistenceError?: string | null;
  provider?: AgentProvider | string;
};

export type SendAgentMessageInput = {
  conversationId?: string | null;
  messages: AgentChatMessage[];
  modelMode?: AgentModelMode;
};

export type StreamAgentMessageInput = SendAgentMessageInput & {
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
};
