import type { AgentModelMode } from '../types/agent';

export const agentConfig = {
  defaultModel: 'gpt-5-nano',
  defaultModelMode: 'fast' as AgentModelMode,
  chatFunctionName: 'lunivo-chat-v2',
  streamFunctionName: 'lunivo-chat-stream',
  attachmentNote: 'Photos are attached in the composer preview, but image analysis is not enabled yet.',
  maxSelectedAttachments: 5,
} as const;

export const agentLayoutConfig = {
  closedComposerBottom: 38,
  keyboardGap: 8,
  closedMessageBottomGap: 260,
  keyboardMessageBottomGap: 34,
  messageListTopInset: 28,
  defaultComposerHeight: 66,
} as const;
