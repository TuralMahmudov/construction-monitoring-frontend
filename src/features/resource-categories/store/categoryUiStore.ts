import { create } from 'zustand';
import type { ResourceCategory } from '../types/resourceCategory.types';

export type CategoryDrawerMode = 'create' | 'edit';

interface CategoryDrawerState {
  open: boolean;
  mode: CategoryDrawerMode;
  parentId: string | null;
  category: ResourceCategory | null;
}

interface CategoryMoveDialogState {
  open: boolean;
  category: ResourceCategory | null;
}

interface CategoryUiStore {
  selectedId: string | null;
  expandedIds: string[];
  /** Set by the search page's "view in tree" action; the tree page consumes
   *  and clears it to expand/select the matching node after navigation. */
  pendingFocusId: string | null;
  drawer: CategoryDrawerState;
  moveDialog: CategoryMoveDialogState;
  /** Shared by the toolbar's delete button and each node's context menu, so
   *  both trigger the same single confirm dialog instance. */
  deleteTarget: ResourceCategory | null;

  selectNode: (id: string | null) => void;
  setExpandedIds: (ids: string[]) => void;
  expandNode: (id: string) => void;
  focusNode: (id: string) => void;
  clearPendingFocus: () => void;

  openCreateDrawer: (parentId: string | null) => void;
  openEditDrawer: (category: ResourceCategory) => void;
  closeDrawer: () => void;

  openMoveDialog: (category: ResourceCategory) => void;
  closeMoveDialog: () => void;

  requestDelete: (category: ResourceCategory) => void;
  cancelDelete: () => void;
}

const initialDrawerState: CategoryDrawerState = {
  open: false,
  mode: 'create',
  parentId: null,
  category: null,
};

const initialMoveDialogState: CategoryMoveDialogState = {
  open: false,
  category: null,
};

export const useCategoryUiStore = create<CategoryUiStore>((set) => ({
  selectedId: null,
  expandedIds: [],
  pendingFocusId: null,
  drawer: initialDrawerState,
  moveDialog: initialMoveDialogState,
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

  openMoveDialog: (category) => set({ moveDialog: { open: true, category } }),
  closeMoveDialog: () => set({ moveDialog: initialMoveDialogState }),

  requestDelete: (category) => set({ deleteTarget: category }),
  cancelDelete: () => set({ deleteTarget: null }),
}));
