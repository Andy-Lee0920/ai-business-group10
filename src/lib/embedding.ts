export type EmbeddingVector = number[];

type OpenAIEmbeddingResponse = {
  data: Array<{ embedding: number[] }>;
};

export async function getEmbedding(
  text: string,
  apiKey: string,
): Promise<EmbeddingVector> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // 토큰 한도 대비 자르기
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OpenAI embedding API error ${response.status}: ${body}`);
  }

  const json = (await response.json()) as OpenAIEmbeddingResponse;
  const embedding = json.data[0]?.embedding;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('OpenAI embedding API returned empty vector');
  }

  return embedding;
}

export function requireOpenAiApiKey(
  source: Record<string, string | undefined> = process.env,
): string {
  const key = source.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('Missing env: OPENAI_API_KEY');
  return key;
}

export function getOpenAiApiKey(
  source: Record<string, string | undefined> = process.env,
): string | undefined {
  return source.OPENAI_API_KEY?.trim() || undefined;
}
