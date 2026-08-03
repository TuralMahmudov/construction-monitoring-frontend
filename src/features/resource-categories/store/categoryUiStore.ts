import { create } from 'zustand';
import type { ResourceCategory } from '../types/resourceCategory.types';

export type CategoryDrawerMode = 'create' | 'edit';

interface CategoryDrawerState {
  open: boolean;
  mode: CategoryDrawerMode;
  parentId: string | null;
  category: ResourceCategory | null;
}

interface CategoryUiStore {
  /** Raw SimpleTreeView itemId — either a category UUID or a
   *  `product::{uuid}` id (bax utils/treeItemId.ts). */
  selectedId: string | null;
  expandedIds: string[];
  /** Set by the search page's "view in tree" action; the tree page consumes
   *  and clears it to expand/select the matching node after navigation. */
  pendingFocusId: string | null;

  // Create/edit/delete — central-admin only (bax CategoryTreeToolbar),
  // reinstated on 2026-07-30 after briefly being fully hidden. Move and
  // enable/disable stay hidden for now (not requested back).
  drawer: CategoryDrawerState;
  deleteTarget: ResourceCategory | null;

  selectNode: (id: string | null) => void;
  setExpandedIds: (ids: string[]) => void;
  expandNode: (id: string) => void;
  focusNode: (id: string) => void;
  clearPendingFocus: () => void;

  openCreateDrawer: (parentId: string | null) => void;
  openEditDrawer: (category: ResourceCategory) => void;
  closeDrawer: () => void;

  requestDelete: (category: ResourceCategory) => void;
  cancelDelete: () => void;
}

const initialDrawerState: CategoryDrawerState = {
  open: false,
  mode: 'create',
  parentId: null,
  category: null,
};

export const useCategoryUiStore = create<CategoryUiStore>((set) => ({
  selectedId: null,
  expandedIds: [],
  pendingFocusId: null,
  drawer: initialDrawerState,
  deleteTarget: null,

  selectNode: (id) => set({ selectedId: id }),
  setExpandedIds: (ids) => set({ expandedIds: ids }),
  expandNode: (id) =>
    set((state) =>
      state.expandedIds.includes(id)
        ? state
        : { expandedIds: [...state.expandedIds, id] },
    ),
  focusNode: (id) => set({ pendingFocusId: id }),
  clearPendingFocus: () => set({ pendingFocusId: null }),

  openCreateDrawer: (parentId) =>
    set({ drawer: { open: true, mode: 'create', parentId, category: null } }),
  openEditDrawer: (category) =>
    set({ drawer: { open: true, mode: 'edit', parentId: category.parentId, category } }),
  closeDrawer: () => set({ drawer: initialDrawerState }),

  requestDelete: (category) => set({ deleteTarget: category }),
  cancelDelete: () => set({ deleteTarget: null }),
}));
