import type { AgentRequest, AgentSafetyResult } from './types.ts';

const MAX_MESSAGES = 48;
const MAX_MESSAGE_CHARS = 8000;
const MAX_TOTAL_CHARS = 60000;
const MAX_CONVERSATION_ID_CHARS = 120;

const ALLOWED_ROLES = new Set(['user', 'assistant']);

function reject(reason: string): AgentSafetyResult {
  return {
    allowed: false,
    reason,
  };
}

function allow(): AgentSafetyResult {
  return {
    allowed: true,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidRole(role: unknown) {
  return typeof role === 'string' && ALLOWED_ROLES.has(role);
}

function isValidContent(content: unknown) {
  return typeof content === 'string' && content.trim().length > 0;
}

function hasControlCharacters(value: string) {
  // Allows normal whitespace like newline, tab, and carriage return.
  // Blocks invisible control characters that can break logs/parsers.
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
}

function normalizeContentLength(content: string) {
  return content.trim().length;
}

function getLastNonEmptyMessage(messages: AgentRequest['messages']) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (typeof message?.content === 'string' && message.content.trim().length > 0) {
      return message;
    }
  }

  return null;
}

export function checkAgentRequestSafety(request: AgentRequest): AgentSafetyResult {
  if (!isObject(request)) {
    return reject('Invalid request body.');
  }

  if (
    request.conversationId !== undefined &&
    request.conversationId !== null &&
    typeof request.conversationId !== 'string'
  ) {
    return reject('Conversation id must be a string.');
  }

  if (
    typeof request.conversationId === 'string' &&
    request.conversationId.length > MAX_CONVERSATION_ID_CHARS
  ) {
    return reject('Conversation id is too long.');
  }

  if (
    request.modelMode !== undefined &&
    request.modelMode !== 'auto' &&
    request.modelMode !== 'fast' &&
    request.modelMode !== 'smart'
  ) {
    return reject('Invalid model mode.');
  }

  if (!Array.isArray(request.messages)) {
    return reject('Message list must be an array.');
  }

  if (request.messages.length === 0) {
    return reject('Message list is empty.');
  }

  if (request.messages.length > MAX_MESSAGES) {
    return reject(`Too many messages. Maximum is ${MAX_MESSAGES}.`);
  }

  let totalChars = 0;
  let hasUserMessage = false;

  for (const [index, message] of request.messages.entries()) {
    if (!isObject(message)) {
      return reject(`Message at index ${index} is invalid.`);
    }

    if (!isValidRole(message.role)) {
      return reject(`Message at index ${index} has an invalid role.`);
    }

    if (!isValidContent(message.content)) {
      return reject(`Message at index ${index} is empty.`);
    }

    const content = message.content.trim();

    if (hasControlCharacters(content)) {
      return reject(`Message at index ${index} contains unsupported control characters.`);
    }

    const contentLength = normalizeContentLength(content);

    if (contentLength > MAX_MESSAGE_CHARS) {
      return reject(`Message at index ${index} is too long.`);
    }

    totalChars += contentLength;

    if (totalChars > MAX_TOTAL_CHARS) {
      return reject('Conversation payload is too large.');
    }

    if (message.role === 'user') {
      hasUserMessage = true;
    }
  }

  if (!hasUserMessage) {
    return reject('At least one user message is required.');
  }

  const lastMessage = getLastNonEmptyMessage(request.messages);

  if (!lastMessage) {
    return reject('At least one non-empty message is required.');
  }

  if (lastMessage.role !== 'user') {
    return reject('The latest message must be from the user.');
  }

  return allow();
}
