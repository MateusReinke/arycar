import { describe, it, expect } from 'vitest';
import { getDisabledServiceIds, getExclusionReason } from '@/data/serviceExclusions';

// Simulates backend-generated UUID ids instead of the old static "1", "2"... ids.
const services = [
  { id: 'uuid-simples', name: 'Lavagem Simples' },
  { id: 'uuid-detalhada', name: 'Lavagem Detalhada' },
  { id: 'uuid-polimento-comercial', name: 'Polimento Comercial' },
  { id: 'uuid-polimento-tecnico', name: 'Polimento Técnico' },
  { id: 'uuid-higienizacao', name: 'Higienização' },
];

describe('serviceExclusions', () => {
  it('disables the paired service once one of an exclusive pair is in the cart', () => {
    const disabled = getDisabledServiceIds(['uuid-simples'], services);
    expect(disabled.has('uuid-detalhada')).toBe(true);
    expect(disabled.has('uuid-simples')).toBe(false);
  });

  it('does not disable unrelated services', () => {
    const disabled = getDisabledServiceIds(['uuid-simples'], services);
    expect(disabled.has('uuid-higienizacao')).toBe(false);
    expect(disabled.has('uuid-polimento-comercial')).toBe(false);
  });

  it('returns a human-readable reason for the disabled service', () => {
    const reason = getExclusionReason('uuid-detalhada', ['uuid-simples'], services);
    expect(reason).toBe('Incompatível com "Lavagem Simples"');
  });

  it('returns null when there is no conflict', () => {
    expect(getExclusionReason('uuid-higienizacao', ['uuid-simples'], services)).toBeNull();
    expect(getDisabledServiceIds([], services).size).toBe(0);
  });
});
