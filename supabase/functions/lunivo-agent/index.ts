import { runAgent } from '../_shared/agent/orchestrator.ts';
import type { AgentRequest } from '../_shared/agent/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      Connection: 'keep-alive',
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const body = await request.json() as AgentRequest;
    const response = await runAgent(body);

    return jsonResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return jsonResponse(
      {
        error: 'Lunivo agent request failed.',
        detail: message,
      },
      500,
    );
  }
});
