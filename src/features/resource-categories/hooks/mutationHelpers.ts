import type { ResourceCategory } from '../types/resourceCategory.types';

export function patchCategoryInArray(
  categories: ResourceCategory[] | undefined,
  updated: ResourceCategory,
): ResourceCategory[] | undefined {
  if (!categories) {
    return categories;
  }
  return categories.map((category) => (category.id === updated.id ? updated : category));
}

export function removeCategoryFromArray(
  categories: ResourceCategory[] | undefined,
  id: string,
): ResourceCategory[] | undefined {
  if (!categories) {
    return categories;
  }
  return categories.filter((category) => category.id !== id);
}
