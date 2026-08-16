import { HarvestRecord, Settings } from '../types';

/**
 * The app stores farm and tapper labels in the same field for backwards
 * compatibility.  A tapper label must not make a single-farm account look
 * like it has multiple farms.
 */
export function isTapperName(name: string): boolean {
  const normalized = name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
  return /^tho\s+cao\b/.test(normalized);
}

function isPlaceholderFarmName(name: string): boolean {
  return /^\d+$/.test(name.trim());
}

function addFarmName(names: Set<string>, value?: string): void {
  const name = (value || '').trim();
  if (!name || isTapperName(name) || isPlaceholderFarmName(name)) return;
  names.add(name.toLocaleLowerCase());
}

/** Return distinct real farm names, excluding labels for individual tappers. */
export function getActualFarmNames(records: HarvestRecord[] = [], settings?: Settings): Set<string> {
  const names = new Set<string>();
  addFarmName(names, settings?.rubberFieldName);
  settings?.farmsList?.forEach((name) => addFarmName(names, name));
  records.forEach((record) => addFarmName(names, record.farmName));
  return names;
}

/** Farm labels are useful only once the owner has more than one real farm. */
export function hasMultipleActualFarms(records: HarvestRecord[] = [], settings?: Settings): boolean {
  return getActualFarmNames(records, settings).size > 1;
}
