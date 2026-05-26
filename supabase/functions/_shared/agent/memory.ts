import type { AgentMemoryContext } from './types.ts';

export async function loadMemoryContext(): Promise<AgentMemoryContext> {
  // Placeholder for future long-term memory.
  // Later this can load user preferences, study goals, and important project context from Supabase.
  return {
    instructions: [],
    memories: [],
  };
}
