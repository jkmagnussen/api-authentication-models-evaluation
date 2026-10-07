import {
  GENERATION_PROMPT_PROTOCOL_VERSION,
  GENERATOR_PROMPTS,
  getGeneratorPrompt,
  getSystemPrompt,
  SECURITY_GUIDANCE,
} from '../../ai-generated/generator-prompts';

describe('AI generation prompt protocol', () => {
  it('uses one generic security-guidance treatment without listing evaluated control names', () => {
    expect(GENERATION_PROMPT_PROTOCOL_VERSION).toBe(2);
    for (const model of ['oauth', 'jwt', 'sessions'] as const) {
      const neutral = getGeneratorPrompt(model, 'neutral');
      const guided = getGeneratorPrompt(model, 'security-guided');
      expect(guided.replace(` ${SECURITY_GUIDANCE}`, '')).toBe(neutral);
      expect(guided).not.toMatch(/redirect|state parameter|scope validation|audience|issuer|algorithm selection|expiry|regenerat|cookie flag|logout invalidation/i);
      expect(GENERATOR_PROMPTS[model].neutral).toBe(neutral);
    }
  });

  it('keeps the system instruction shared between prompt conditions', () => {
    expect(getSystemPrompt()).toContain('Return a single code snippet with no markdown fences and no explanation.');
  });
});