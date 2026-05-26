import { sendMessageToAgent as sendAgentMessage } from './sendMessageToAgent';
import { streamMessageToAgent as streamAgentMessage } from './streamMessageToAgent';
import type { AgentResponse, SendAgentMessageInput, StreamAgentMessageInput } from '../types/agent';

export async function sendMessageToAgent(input: SendAgentMessageInput): Promise<AgentResponse> {
  return sendAgentMessage(input);
}

export async function streamMessageToAgent(input: StreamAgentMessageInput): Promise<AgentResponse> {
  return streamAgentMessage(input);
}
