import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from './useDebouncedValue';
import { searchBrands, searchManufacturers, searchModels } from '../api/resourcesApi';

const DEBOUNCE_MS = 300;
const STALE_TIME = 60_000;

function useAutocompleteQuery(
  field: string,
  search: (term: string) => Promise<string[]>,
  inputValue: string,
  enabled = true,
) {
  const debouncedInput = useDebouncedValue(inputValue, DEBOUNCE_MS);
  return useQuery({
    queryKey: ['resources', 'field-options', field, debouncedInput],
    // Some existing rows have an empty-string value for this field — filter
    // it out so the dropdown never renders a blank, effectively invisible
    // option.
    queryFn: async () => (await search(debouncedInput)).filter((value) => value.trim() !== ''),
    staleTime: STALE_TIME,
    placeholderData: (previousData) => previousData,
    enabled,
  });
}

export function useManufacturerOptions(inputValue: string) {
  return useAutocompleteQuery('manufacturer', searchManufacturers, inputValue);
}

// `enabled` matters here specifically — AttributeValueField calls this
// unconditionally (hooks can't be conditional), for every attribute field on
// a page, not just Brend ones. Without gating, every NUMBER/ENUM/... field
// would also fire a useless /api/brands request.
export function useBrandOptions(inputValue: string, enabled = true) {
  return useAutocompleteQuery('brand', searchBrands, inputValue, enabled);
}

export function useModelOptions(inputValue: string) {
  return useAutocompleteQuery('model', searchModels, inputValue);
}
