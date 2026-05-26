import type { AgentRequest, AgentSafetyResult } from './types.ts';

export function checkAgentRequestSafety(request: AgentRequest): AgentSafetyResult {
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    return {
      allowed: false,
      reason: 'Message list is empty.',
    };
  }

  const hasUserMessage = request.messages.some((message) => message.role === 'user' && message.content.trim().length > 0);

  if (!hasUserMessage) {
    return {
      allowed: false,
      reason: 'At least one user message is required.',
    };
  }

  return {
    allowed: true,
  };
}
