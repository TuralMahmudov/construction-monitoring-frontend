import type { ResourceCategory } from '../types/resourceCategory.types';

/**
 * True if `candidateId` is `ancestor.id` itself or one of its descendants,
 * given a flat map of already-loaded nodes keyed by id. Used to block
 * selecting a category as its own parent (directly or transitively) both in
 * the form and the move dialog, mirroring the backend's own guard.
 */
export function isSelfOrDescendant(
  candidateId: string,
  ancestorId: string,
  nodesById: Map<string, ResourceCategory>,
): boolean {
  if (candidateId === ancestorId) {
    return true;
  }

  let current = nodesById.get(candidateId);
  const visited = new Set<string>();

  while (current?.parentId) {
    if (visited.has(current.id)) {
      // Defensive: a cyclic parent chain should never happen, but bail out
      // rather than loop forever if the loaded data is inconsistent.
      return false;
    }
    visited.add(current.id);

    if (current.parentId === ancestorId) {
      return true;
    }
    current = nodesById.get(current.parentId);
  }

  return false;
}
