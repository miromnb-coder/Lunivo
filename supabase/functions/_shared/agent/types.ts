export type AgentRole = 'user' | 'assistant';

export type AgentModelMode = 'auto' | 'fast' | 'smart';

export type AgentProvider = 'openai';

export type AgentMessage = {
  role: AgentRole;
  content: string;
};

export type AgentRequest = {
  conversationId?: string | null;
  messages: AgentMessage[];
  modelMode?: AgentModelMode;
};

export type AgentModelProfile = {
  model: string;
  modelMode: AgentModelMode;
  provider: AgentProvider;
  supportsTools: boolean;
  supportsVision: boolean;
};

export type AgentMemoryContext = {
  instructions: string[];
  memories: string[];
};

export type AgentToolDefinition = {
  name: string;
  description: string;
};

export type AgentSafetyResult = {
  allowed: boolean;
  reason?: string;
};

export type AgentRunContext = {
  conversationId?: string | null;
  memory: AgentMemoryContext;
  model: AgentModelProfile;
  tools: AgentToolDefinition[];
};

export type AgentResponse = {
  answer: string;
  conversationId?: string | null;
  model: string;
  modelMode: AgentModelMode;
  provider: AgentProvider;
  usedTools: string[];
};

export type StreamDeltaHandler = (delta: string) => void | Promise<void>;
