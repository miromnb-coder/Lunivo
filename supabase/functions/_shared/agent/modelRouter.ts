import type { AgentModelMode, AgentModelProfile } from './types.ts';

const DEFAULT_FAST_MODEL = 'gpt-5-nano';
const DEFAULT_SMART_MODEL = 'gpt-5-mini';

function readModelFromEnv(key: string, fallback: string) {
  return Deno.env.get(key)?.trim() || fallback;
}

export function resolveModelProfile(modelMode: AgentModelMode = 'fast'): AgentModelProfile {
  if (modelMode === 'smart') {
    return {
      model: readModelFromEnv('OPENAI_MODEL_SMART', DEFAULT_SMART_MODEL),
      modelMode: 'smart',
      provider: 'openai',
      supportsTools: false,
      supportsVision: false,
    };
  }

  if (modelMode === 'auto') {
    return {
      model: readModelFromEnv('OPENAI_MODEL_FAST', DEFAULT_FAST_MODEL),
      modelMode: 'auto',
      provider: 'openai',
      supportsTools: false,
      supportsVision: false,
    };
  }

  return {
    model: readModelFromEnv('OPENAI_MODEL_FAST', DEFAULT_FAST_MODEL),
    modelMode: 'fast',
    provider: 'openai',
    supportsTools: false,
    supportsVision: false,
  };
}
