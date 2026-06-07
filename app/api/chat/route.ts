import { query } from "@anthropic-ai/claude-agent-sdk";
import {
  buildOttoSystem,
  renderConversation,
  validateChat,
  OTTO_MODEL,
  OTTO_FALLBACK_MODEL,
  OTTO_TIMEOUT_MS,
} from "@/lib/otto";

// Spawns the Claude Agent SDK subprocess — needs the Node runtime, never Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const DEGRADED_REPLY =
  "Sorry — I couldn't reach my brain just now. Please try again in a moment. (If this keeps happening, the host's Claude auth may need attention.)";

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { ok, error, messages, context } = validateChat(body);
  if (!ok || !messages) {
    return Response.json({ error: error ?? "Invalid request." }, { status: 400 });
  }

  const systemPrompt = buildOttoSystem(context);
  const prompt = renderConversation(messages);

  const encoder = new TextEncoder();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), OTTO_TIMEOUT_MS);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let streamedAny = false;
      try {
        for await (const message of query({
          prompt,
          options: {
            model: OTTO_MODEL,
            fallbackModel: OTTO_FALLBACK_MODEL,
            systemPrompt,
            maxTurns: 6,
            allowedTools: [], // conversational only — no tools
            settingSources: [], // isolation: no CLAUDE.md / filesystem settings
            permissionMode: "default",
            includePartialMessages: true, // stream token deltas
            abortController: abort,
          },
        })) {
          // Token deltas arrive as raw streaming events.
          if (message.type === "stream_event") {
            const ev = message.event as {
              type?: string;
              delta?: { type?: string; text?: string };
            };
            if (ev?.type === "content_block_delta" && ev.delta?.type === "text_delta" && ev.delta.text) {
              streamedAny = true;
              controller.enqueue(encoder.encode(ev.delta.text));
            }
          } else if (message.type === "result" && message.subtype !== "success" && !streamedAny) {
            // Auth/turns/budget failure with nothing streamed → graceful note.
            controller.enqueue(encoder.encode(DEGRADED_REPLY));
            streamedAny = true;
          }
        }
        if (!streamedAny) controller.enqueue(encoder.encode(DEGRADED_REPLY));
      } catch (err) {
        console.warn("[chat] Otto stream failed:", (err as Error)?.message ?? err);
        if (!streamedAny) controller.enqueue(encoder.encode(DEGRADED_REPLY));
      } finally {
        clearTimeout(timer);
        controller.close();
      }
    },
    cancel() {
      clearTimeout(timer);
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
