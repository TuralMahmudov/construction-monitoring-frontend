import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ProductViewDialog } from '../../features/products/components/ProductViewDialog';
import { ResourceViewDialog } from '../../features/resources/components/ResourceViewDialog';

type Viewing = { kind: 'resource'; id: string } | { kind: 'product'; id: string } | null;

interface EntityViewContextValue {
  openResource: (id: string) => void;
  openProduct: (id: string) => void;
}

const EntityViewContext = createContext<EntityViewContextValue | undefined>(undefined);

// Resource and Product view dialogs cross-link to each other (Elanlar cədvəlindəki
// "Bax", Resource ümumi tabındakı "Məhsula bax") — one shared slot here means
// switching between them always replaces the currently open dialog instead of
// stacking a new one on top of it (Tural, 2026-08-05: "bir pəncərə açıq olsun").
export function EntityViewProvider({ children }: { children: ReactNode }) {
  const [viewing, setViewing] = useState<Viewing>(null);

  const openResource = useCallback((id: string) => setViewing({ kind: 'resource', id }), []);
  const openProduct = useCallback((id: string) => setViewing({ kind: 'product', id }), []);
  const close = useCallback(() => setViewing(null), []);

  const value = useMemo<EntityViewContextValue>(() => ({ openResource, openProduct }), [openResource, openProduct]);

  return (
    <EntityViewContext.Provider value={value}>
      {children}
      <ResourceViewDialog
        open={viewing?.kind === 'resource'}
        resourceId={viewing?.kind === 'resource' ? viewing.id : null}
        onClose={close}
      />
      <ProductViewDialog
        open={viewing?.kind === 'product'}
        productId={viewing?.kind === 'product' ? viewing.id : null}
        onClose={close}
      />
    </EntityViewContext.Provider>
  );
}

export function useEntityView(): EntityViewContextValue {
  const context = useContext(EntityViewContext);
  if (!context) {
    throw new Error('useEntityView must be used within an EntityViewProvider');
  }
  return context;
}
