import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, type ModelMessage } from "ai";

export const AI_MODEL = "anthropic/claude-haiku-4-5";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export class AiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

function createRunIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID_HEADER)) headers.set(RUN_ID_HEADER, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID_HEADER)?.trim() || undefined;
    return res;
  };
}

/** Streams a Claude call through the Lovable AI Gateway and returns the final text. */
export async function runClaude(opts: {
  system: string;
  messages: ModelMessage[];
  maxOutputTokens?: number;
}): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiError("AI is not configured for this app yet.", 500);
  const anthropic = createAnthropic({
    baseURL: GATEWAY,
    apiKey: key,
    headers: { Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: createRunIdFetch(),
  });
  let streamError: unknown;
  const result = streamText({
    model: anthropic(AI_MODEL),
    system: opts.system,
    messages: opts.messages,
    maxOutputTokens: opts.maxOutputTokens ?? 2000,
    maxRetries: 0,
    onError: ({ error }) => {
      streamError = error;
    },
  });
  let text = "";
  try {
    text = await result.text;
  } catch (e) {
    streamError ??= e;
  }
  if (streamError) {
    const status =
      (streamError as { statusCode?: number })?.statusCode ??
      (streamError as { status?: number })?.status ??
      500;
    if (status === 402) throw new AiError("The AI service is out of credits right now.", 402);
    if (status === 429) throw new AiError("The AI is busy — please try again in a moment.", 429);
    if (status === 403) throw new AiError("The AI service declined this request.", 403);
    throw new AiError("The AI could not complete this request.", status);
  }
  const finish = await Promise.resolve(result.finishReason).catch(() => undefined);
  if ((finish as string) === "content-filter" || !text.trim()) {
    throw new AiError("The AI declined to answer this request.", 422);
  }
  return text;
}

export function extractJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new AiError("The AI returned an unexpected format.");
  return JSON.parse(text.slice(start, end + 1)) as T;
}
