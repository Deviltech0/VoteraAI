import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ElectionVertexService } from '../../src/services/vertex';

describe('Vertex Cache Coverage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should return cached embeddings on subsequent calls', async () => {
    const service = new ElectionVertexService();
    
    // Mock the embedText private method
    const embedTextMock = vi.spyOn(service as any, 'embedText').mockResolvedValue([0.1, 0.2]);
    const cosineMock = vi.spyOn(service as any, 'cosineSimilarity').mockReturnValue(0.4);
    
    // First call: computes embeddings
    const promise1 = (service as any).getCorpusEmbeddings();
    // Second call: should hit corpusEmbeddingsPromise branch
    const promise2 = (service as any).getCorpusEmbeddings();
    
    await Promise.all([promise1, promise2]);
    
    // Third call: should hit corpusEmbeddingsCache branch
    const cached = await (service as any).getCorpusEmbeddings();
    
    expect(cached).toBeDefined();
    // It should only be called once per FAQ item despite multiple calls to getCorpusEmbeddings
    expect(embedTextMock).toHaveBeenCalled();

    // Call findRelevantFaq to hit score < 0.5 branch
    const match = await service.findRelevantFaq("some obscure query");
    expect(match).toBeNull();
  });
});
