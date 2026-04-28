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

  // TS narrow via discriminated union (evita criar type predicate que precisaria
  // replicar o shape exato de TextBlock do SDK, que muda entre versoes).
  const text = res.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("\n");

  return {
    text,
    tokensIn: res.usage.input_tokens,
    tokensOut: res.usage.output_tokens,
  };
}
