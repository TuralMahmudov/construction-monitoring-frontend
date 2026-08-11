import type { ResourceCategory } from '../../resource-categories/types/resourceCategory.types';

export interface FlatCategoryOption {
  id: string;
  name: string;
  path: string;
}

/**
 * Builds "Parent > Child > Grandchild" labels for every category, whatever
 * subset of the hierarchy `categories` actually contains — the parent chain
 * is resolved from the same array via parentId, so this degrades gracefully
 * (shorter paths) if only a partial set is available rather than crashing.
 */
export function flattenCategoryPaths(categories: ResourceCategory[], leafOnly = false): FlatCategoryOption[] {
  const byId = new Map(categories.map((category) => [category.id, category]));

  function buildPath(category: ResourceCategory): string {
    const segments: string[] = [category.name];
    let current = category;
    const visited = new Set<string>([current.id]);

    while (current.parentId) {
      const parent = byId.get(current.parentId);
      if (!parent || visited.has(parent.id)) {
        break;
      }
      segments.unshift(parent.name);
      visited.add(parent.id);
      current = parent;
    }

    return segments.join(' > ');
  }

  return categories
    .filter((category) => !leafOnly || category.leaf)
    .map((category) => ({ id: category.id, name: category.name, path: buildPath(category) }))
    .sort((a, b) => a.path.localeCompare(b.path, 'az'));
}
