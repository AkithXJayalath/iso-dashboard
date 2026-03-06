// useRegistryData.ts
// ─────────────────────────────────────────────────────────────────────────────
// Custom hook: fetches items from a SharePoint list defined by an IRegistryConfig.
//
// Field name resolution strategy:
//   1. Fetch /_api/web/lists/getbytitle(...)/fields to build a
//      displayName → internalName map for the list.
//   2. Use that map to translate config display names to SP internal names
//      before building the $select query — so config values can simply be
//      the column "Title" (display name) as shown in SharePoint.
//
// Both the field map and the item results are cached per list/registry.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { IRegistryConfig } from "../config/registryConfig";

// ── Normalised shape returned to consumers ───────────────────────────────────
export interface IRegistryItem {
  id: number;
  title: string;
  status: string;
  date: string; // ISO date string from SharePoint
}

export interface IRegistryDataState {
  items: IRegistryItem[];
  loading: boolean;
  error: string | undefined;
}

// ── Caches ────────────────────────────────────────────────────────────────────
// Item cache keyed by registry id
const itemCache: Record<string, IRegistryItem[]> = {};
// Field map cache keyed by SP list name: displayName → internalName
const fieldMapCache: Record<string, Record<string, string>> = {};

// ── Fetch the field metadata for a list and return displayName → internalName
async function fetchFieldMap(
  siteUrl: string,
  listName: string,
  signal: AbortSignal,
): Promise<Record<string, string>> {
  const url =
    `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')` +
    `/fields?$select=Title,InternalName&$filter=Hidden eq false`;

  const res = await fetch(url, {
    signal,
    credentials: "same-origin",
    headers: { Accept: "application/json;odata=nometadata" },
  });

  if (!res.ok) {
    throw new Error(
      `Could not load field metadata for list "${listName}" (HTTP ${res.status}). ` +
        `Verify the list name is correct.`,
    );
  }

  const data = (await res.json()) as {
    value: Array<{ Title: string; InternalName: string }>;
  };

  const map: Record<string, string> = {};
  (data.value || []).forEach((f) => {
    map[f.Title] = f.InternalName;
  });
  return map;
}

// ── Resolve a display name to its internal name; fall back to the name as-is
function resolveField(
  map: Record<string, string>,
  displayName: string,
): string {
  return map[displayName] !== undefined ? map[displayName] : displayName;
}

// ── Map a raw SP item to a normalised IRegistryItem ─────────────────────────
function normalise(
  raw: Record<string, unknown>,
  statusKey: string,
  dateKey: string,
  titleKey: string | undefined,
): IRegistryItem {
  const itemId = (raw.Id as number) || (raw.ID as number);

  return {
    id: itemId,
    title: titleKey
      ? (raw[titleKey] as string) || `#${itemId}`
      : `#${itemId}`,
    status: (raw[statusKey] as string) || "",
    date: (raw[dateKey] as string) || "",
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useRegistryData(
  registry: IRegistryConfig,
  siteUrl: string,
): IRegistryDataState {
  const [state, setState] = useState<IRegistryDataState>({
    items: itemCache[registry.id] !== undefined ? itemCache[registry.id] : [],
    loading: itemCache[registry.id] === undefined,
    error: undefined,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (itemCache[registry.id] !== undefined) {
      setState({
        items: itemCache[registry.id],
        loading: false,
        error: undefined,
      });
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ items: [], loading: true, error: undefined });

    const listName = registry.sharepointListName;

    // Step 1 — get field map (cached or fetched), Step 2 — fetch items
    const getFieldMap: Promise<Record<string, string>> =
      fieldMapCache[listName] !== undefined
        ? Promise.resolve(fieldMapCache[listName])
        : fetchFieldMap(siteUrl, listName, controller.signal).then((map) => {
            fieldMapCache[listName] = map;
            return map;
          });

    getFieldMap
      .then((map) => {
        // Translate config display names -> SP internal names
        const statusKey = resolveField(map, registry.statusField);
        const dateKey = resolveField(map, registry.dateField);
        const titleKey = registry.titleField
          ? resolveField(map, registry.titleField)
          : undefined;

        const selectFields = ["Id", statusKey, dateKey];
        if (titleKey) {
          selectFields.push(titleKey);
        }

        const listUrl = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listName)}')/items`;
        const params = [`$select=${selectFields.join(",")}`, `$top=500`].join(
          "&",
        );

        return fetch(`${listUrl}?${params}`, {
          signal: controller.signal,
          credentials: "same-origin",
          headers: {
            Accept: "application/json;odata=nometadata",
            "Content-Type": "application/json",
          },
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(
                `SharePoint API error ${res.status} for list "${listName}". ` +
                  `Resolved fields — ` +
                  `dateField: "${registry.dateField}" -> "${dateKey}", ` +
                  `statusField: "${registry.statusField}" -> "${statusKey}".`,
              );
            }
            return res.json() as Promise<{ value: Record<string, unknown>[] }>;
          })
          .then((data) => {
            const items = (data.value || []).map((raw) =>
              normalise(raw, statusKey, dateKey, titleKey),
            );
            itemCache[registry.id] = items;
            setState({ items, loading: false, error: undefined });
          });
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") {
          return;
        }
        setState({ items: [], loading: false, error: err.message });
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registry.id, siteUrl]);

  return state;
}
