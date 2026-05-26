import type { AgentRequest, AgentResponse, AgentRunContext } from './types.ts';

export async function recordAgentRunStart(_request: AgentRequest, _context: AgentRunContext) {
  // Placeholder for future persistence.
  // Later this can store agent run metadata, token usage, latency, and tool calls in Supabase.
  return null;
}

export async function recordAgentRunSuccess(_runId: string | null, _response: AgentResponse) {
  return null;
}

export async function recordAgentRunError(_runId: string | null, _error: unknown) {
  return null;
}
