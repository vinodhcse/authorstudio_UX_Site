import { AIProviderClient } from './providers/base';
import { OpenAIClient, TogetherClient, OpenRouterClient } from './providers/openaiLike';
import { AnthropicClient } from './providers/anthropic';
import { GoogleClient } from './providers/google';
import { OllamaClient } from './providers/ollama';

const clients: Record<string, AIProviderClient> = {
  openai: OpenAIClient,
  together: TogetherClient,
  openrouter: OpenRouterClient,
  anthropic: AnthropicClient,
  google: GoogleClient,
  ollama: OllamaClient,
};

export function getClient(providerId: string): AIProviderClient | undefined {
  return clients[providerId];
}
