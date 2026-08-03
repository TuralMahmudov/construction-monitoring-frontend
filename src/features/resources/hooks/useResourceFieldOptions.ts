import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from './useDebouncedValue';
import { searchBrands, searchManufacturers, searchModels } from '../api/resourcesApi';

const DEBOUNCE_MS = 300;
const STALE_TIME = 60_000;

function useAutocompleteQuery(field: string, search: (term: string) => Promise<string[]>, inputValue: string) {
  const debouncedInput = useDebouncedValue(inputValue, DEBOUNCE_MS);
  return useQuery({
    queryKey: ['resources', 'field-options', field, debouncedInput],
    // Some existing rows have an empty-string value for this field — filter
    // it out so the dropdown never renders a blank, effectively invisible
    // option.
    queryFn: async () => (await search(debouncedInput)).filter((value) => value.trim() !== ''),
    staleTime: STALE_TIME,
    placeholderData: (previousData) => previousData,
  });
}

export function useManufacturerOptions(inputValue: string) {
  return useAutocompleteQuery('manufacturer', searchManufacturers, inputValue);
}

export function useBrandOptions(inputValue: string) {
  return useAutocompleteQuery('brand', searchBrands, inputValue);
}

export function useModelOptions(inputValue: string) {
  return useAutocompleteQuery('model', searchModels, inputValue);
}
