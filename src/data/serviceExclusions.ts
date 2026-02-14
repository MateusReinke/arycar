// Groups of mutually exclusive services - only one from each group can be selected
export const exclusionGroups: string[][] = [
  // Lavagem: Simples vs Detalhada
  ['1', '2'],
  // Polimento: Comercial vs Técnico
  ['9', '10'],
  // Lavagem de Motor: Parcial vs Completo
  ['3', '4'],
];

/**
 * Given the IDs of services already in cart, returns set of service IDs that should be disabled.
 */
export function getDisabledServiceIds(cartServiceIds: string[]): Set<string> {
  const disabled = new Set<string>();
  for (const group of exclusionGroups) {
    const inCart = group.find(id => cartServiceIds.includes(id));
    if (inCart) {
      for (const id of group) {
        if (id !== inCart) disabled.add(id);
      }
    }
  }
  return disabled;
}

/** Human-readable exclusion reason */
export function getExclusionReason(serviceId: string, cartServiceIds: string[], services: { id: string; name: string }[]): string | null {
  for (const group of exclusionGroups) {
    if (!group.includes(serviceId)) continue;
    const conflicting = group.find(id => id !== serviceId && cartServiceIds.includes(id));
    if (conflicting) {
      const svc = services.find(s => s.id === conflicting);
      return `Incompatível com "${svc?.name || conflicting}"`;
    }
  }
  return null;
}
