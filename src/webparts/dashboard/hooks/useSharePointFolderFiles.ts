// useSharePointFolderFiles.ts
// Fetches the list of files inside a SharePoint folder using the REST API.
// The folder is identified by its server-relative URL, which is constructed
// from the site URL + the site-relative folder path from config.

import { useState, useEffect } from "react";

export interface ISharePointFile {
  name: string;
  /** Full server-relative URL — use with site origin to build an absolute link. */
  serverRelativeUrl: string;
  timeLastModified: string; // ISO date string
  /** File size in bytes — 0 for folders */
  length: number;
  uniqueId: string;
  /** Distinguishes files from sub-folders */
  kind: "file" | "folder";
}

export interface ISharePointFolderFilesState {
  files: ISharePointFile[];
  loading: boolean;
  error: string | undefined;
}

// Simple module-level cache keyed by folderServerRelativeUrl
const fileCache: Record<string, ISharePointFile[]> = {};

/**
 * @param siteUrl                  Absolute URL of the SharePoint site (from context).
 * @param folderSiteRelativePath   Path relative to the site root, no leading slash.
 *                                 e.g. "ISO 27001/Finalized Documents/External Audit/3. Registers"
 */
export function useSharePointFolderFiles(
  siteUrl: string,
  folderSiteRelativePath: string,
): ISharePointFolderFilesState {
  // Derive the full server-relative URL, e.g. /sites/ISO/ISO 27001/.../3. Registers
  const siteServerRelativePath = new URL(siteUrl).pathname.replace(/\/$/, "");
  const folderServerRelativeUrl = `${siteServerRelativePath}/${folderSiteRelativePath}`;

  const [state, setState] = useState<ISharePointFolderFilesState>(() => ({
    files:
      fileCache[folderServerRelativeUrl] !== undefined
        ? fileCache[folderServerRelativeUrl]
        : [],
    loading: fileCache[folderServerRelativeUrl] === undefined,
    error: undefined,
  }));

  useEffect(() => {
    if (fileCache[folderServerRelativeUrl] !== undefined) {
      setState({
        files: fileCache[folderServerRelativeUrl],
        loading: false,
        error: undefined,
      });
      return;
    }

    const controller = new AbortController();
    setState({ files: [], loading: true, error: undefined });

    const encodedPath = encodeURIComponent(folderServerRelativeUrl);
    const filesUrl =
      `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodedPath}')/Files` +
      `?$select=Name,ServerRelativeUrl,TimeLastModified,Length,UniqueId&$orderby=Name asc`;
    const foldersUrl =
      `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${encodedPath}')/Folders` +
      `?$select=Name,ServerRelativeUrl,TimeLastModified,UniqueId&$orderby=Name asc`;

    const fetchJson = <T>(url: string): Promise<{ value: T[] }> =>
      fetch(url, {
        signal: controller.signal,
        credentials: "same-origin",
        headers: { Accept: "application/json;odata=nometadata" },
      }).then((res) => {
        if (!res.ok) {
          throw new Error(
            `Could not load from folder "${folderSiteRelativePath}" (HTTP ${res.status}). ` +
              `Check that the folder path is correct and that you have access.`,
          );
        }
        return res.json() as Promise<{ value: T[] }>;
      });

    Promise.all([
      fetchJson<{
        Name: string;
        ServerRelativeUrl: string;
        TimeLastModified: string;
        Length: number;
        UniqueId: string;
      }>(filesUrl),
      fetchJson<{
        Name: string;
        ServerRelativeUrl: string;
        TimeLastModified: string;
        UniqueId: string;
      }>(foldersUrl),
    ])
      .then(([filesData, foldersData]) => {
        const folders: ISharePointFile[] = (foldersData.value || [])
          // SP returns a hidden "Forms" folder — skip it
          .filter((f) => f.Name !== "Forms")
          .map((f) => ({
            name: f.Name,
            serverRelativeUrl: f.ServerRelativeUrl,
            timeLastModified: f.TimeLastModified,
            length: 0,
            uniqueId: f.UniqueId,
            kind: "folder" as const,
          }));
        const files: ISharePointFile[] = (filesData.value || []).map((f) => ({
          name: f.Name,
          serverRelativeUrl: f.ServerRelativeUrl,
          timeLastModified: f.TimeLastModified,
          length: f.Length,
          uniqueId: f.UniqueId,
          kind: "file" as const,
        }));
        // Folders first, then files — both sorted alphabetically
        const combined = [...folders, ...files];
        fileCache[folderServerRelativeUrl] = combined;
        setState({ files: combined, loading: false, error: undefined });
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setState({ files: [], loading: false, error: err.message });
        }
      });

    return () => controller.abort();
    // folderServerRelativeUrl already encodes both siteUrl and folderSiteRelativePath
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderServerRelativeUrl]);

  return state;
}
