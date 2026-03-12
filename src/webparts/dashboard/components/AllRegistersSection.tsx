// AllRegistersSection.tsx
// Displays all files inside the configured SharePoint "Registers" folder
// as a full-width card on the overview page.
// Each row shows: file icon, file name (linked), last modified date, file size.

import * as React from "react";
import { Alert, Empty, Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { REGISTERS_DOC_LIB_CONFIG } from "../config/registersDocLibConfig";
import {
  ISharePointFile,
  useSharePointFolderFiles,
} from "../hooks/useSharePointFolderFiles";

const { Title } = Typography;

interface IAllRegistersSectionProps {
  siteUrl: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Return a colour tag for a file's extension, or a folder indicator. */
function FileTypeTag({
  name,
  kind,
}: {
  name: string;
  kind: "file" | "folder";
}): React.ReactElement {
  if (kind === "folder") {
    return (
      <Tag
        color="gold"
        style={{ fontSize: 10, lineHeight: "16px", padding: "0 5px" }}
      >
        📂 FOLDER
      </Tag>
    );
  }
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, { color: string; label: string }> = {
    pdf: { color: "red", label: "PDF" },
    docx: { color: "blue", label: "DOCX" },
    doc: { color: "blue", label: "DOC" },
    xlsx: { color: "green", label: "XLSX" },
    xls: { color: "green", label: "XLS" },
    pptx: { color: "orange", label: "PPTX" },
    ppt: { color: "orange", label: "PPT" },
    txt: { color: "default", label: "TXT" },
    csv: { color: "cyan", label: "CSV" },
  };
  const info = map[ext] ?? {
    color: "default",
    label: ext.toUpperCase() || "FILE",
  };
  return (
    <Tag
      color={info.color}
      style={{ fontSize: 10, lineHeight: "16px", padding: "0 5px" }}
    >
      {info.label}
    </Tag>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const AllRegistersSection: React.FC<IAllRegistersSectionProps> = ({
  siteUrl,
}) => {
  const { files, loading, error } = useSharePointFolderFiles(
    siteUrl,
    REGISTERS_DOC_LIB_CONFIG.folderSiteRelativePath,
  );

  const origin = new URL(siteUrl).origin;

  const columns: ColumnsType<ISharePointFile> = [
    {
      title: "Type",
      key: "type",
      width: 90,
      render: (_, record) => (
        <FileTypeTag name={record.name} kind={record.kind} />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: ISharePointFile) => (
        <a
          href={`${origin}${record.serverRelativeUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#0078d4", wordBreak: "break-word" }}
        >
          {name}
        </a>
      ),
    },
    {
      title: "Last Modified",
      dataIndex: "timeLastModified",
      key: "timeLastModified",
      width: 140,
      render: (val: string) => (
        <span style={{ color: "#595959", fontSize: 12 }}>
          {formatDate(val)}
        </span>
      ),
    },
    {
      title: "Size",
      dataIndex: "length",
      key: "length",
      width: 90,
      align: "right" as const,
      render: (val: number, record: ISharePointFile) =>
        record.kind === "folder" ? (
          <span style={{ color: "#bfbfbf", fontSize: 12 }}>—</span>
        ) : (
          <span style={{ color: "#8c8c8c", fontSize: 12 }}>
            {formatBytes(val)}
          </span>
        ),
    },
  ];

  const headerContent = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Title level={5} style={{ margin: 0, fontSize: 15, color: "#0078d4" }}>
          {REGISTERS_DOC_LIB_CONFIG.label}
        </Title>
        {!loading && !error && (
          <Tag
            color="blue"
            style={{ fontSize: 11, lineHeight: "18px", padding: "0 6px" }}
          >
            {files.length} item{files.length !== 1 ? "s" : ""}
          </Tag>
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 10,
        marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          background: "linear-gradient(135deg, #f0f5ff 0%, #fff 100%)",
        }}
      >
        {headerContent}
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <Spin prefixCls="iso-ant-spin" tip="Loading registers…" />
          </div>
        )}

        {!loading && error && (
          <Alert
            prefixCls="iso-ant-alert"
            type="error"
            showIcon
            message="Failed to load register files"
            description={error}
            style={{ borderRadius: 6 }}
          />
        )}

        {!loading && !error && files.length === 0 && (
          <Empty
            prefixCls="iso-ant-empty"
            description="No files or folders found in this folder"
            style={{ padding: "24px 0" }}
          />
        )}

        {!loading && !error && files.length > 0 && (
          <Table<ISharePointFile>
            prefixCls="iso-ant-table"
            dataSource={files}
            columns={columns}
            rowKey="uniqueId"
            size="small"
            pagination={false}
            scroll={{ y: 264 }}
            style={{ fontSize: 13 }}
          />
        )}
      </div>
    </div>
  );
};

export default AllRegistersSection;
