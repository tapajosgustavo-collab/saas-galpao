import { getAnthropic, MODEL } from "./anthropic";

export interface AgentResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
}

/**
 * Helper base para os 4 agentes do produto.
 * Usa prompt caching (cache_control: ephemeral) no system prompt — ele tende a se repetir
 * entre chamadas e cachear corta latência + custo significativamente.
 */
export async function runAgent(opts: {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<AgentResult> {
  const client = getAnthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: [
      {
        type: "text",
        text: opts.systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: opts.userMessage }],
  });

  const text = res.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return {
    text,
    tokensIn: res.usage.input_tokens,
    tokensOut: res.usage.output_tokens,
  };
}
