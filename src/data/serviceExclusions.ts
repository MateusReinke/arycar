// Groups of mutually exclusive services - only one from each group can be selected.
// Services are matched by name (not id): service ids are backend-generated UUIDs
// that are not stable across environments/seeds, while these pairs describe a
// fixed business rule between specific named services.
export const exclusionGroups: string[][] = [
  // Lavagem: Simples vs Detalhada
  ['Lavagem Simples', 'Lavagem Detalhada'],
  // Polimento: Comercial vs Técnico
  ['Polimento Comercial', 'Polimento Técnico'],
  // Lavagem de Motor: Parcial vs Completo
  ['Lavagem de Motor - Parcial', 'Lavagem de Motor - Completo'],
];

interface ServiceRef {
  id: string;
  name: string;
}

const namesInCart = (cartServiceIds: string[], services: ServiceRef[]): Set<string> => {
  const idToName = new Map(services.map((s) => [s.id, s.name]));
  const names = cartServiceIds
    .map((id) => idToName.get(id))
    .filter((name): name is string => Boolean(name));
  return new Set(names);
};

/**
 * Given the IDs of services already in cart, returns set of service IDs that should be disabled.
 */
export function getDisabledServiceIds(cartServiceIds: string[], services: ServiceRef[]): Set<string> {
  const cartNames = namesInCart(cartServiceIds, services);
  const disabledNames = new Set<string>();

  for (const group of exclusionGroups) {
    const activeName = group.find((name) => cartNames.has(name));
    if (activeName) {
      for (const name of group) {
        if (name !== activeName) disabledNames.add(name);
      }
    }
  }

  return new Set(services.filter((s) => disabledNames.has(s.name)).map((s) => s.id));
}

/** Human-readable exclusion reason */
export function getExclusionReason(serviceId: string, cartServiceIds: string[], services: ServiceRef[]): string | null {
  const service = services.find((s) => s.id === serviceId);
  if (!service) return null;

  const cartNames = namesInCart(cartServiceIds, services);

  for (const group of exclusionGroups) {
    if (!group.includes(service.name)) continue;
    const conflictingName = group.find((name) => name !== service.name && cartNames.has(name));
    if (conflictingName) {
      return `Incompatível com "${conflictingName}"`;
    }
  }

  return null;
}
