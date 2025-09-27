import { ImageProviderClient } from './base';
import { OpenAIImageClient } from './openai';
import { TogetherImageClient } from './together';

const clients: Record<string, ImageProviderClient> = {
  openai: OpenAIImageClient,
  together: TogetherImageClient,
};

export function getImageClient(providerId: string): ImageProviderClient | undefined {
  return clients[providerId];
}
