"use client";

import React, { useState } from "react";

interface CollapsibleJsonViewerProps {
  data: any;
  depth?: number;
  isLast?: boolean;
}

/**
 * Heuristic to estimate token count of a JSON segment
 */
const estimateTokens = (val: any): number => {
  return Math.ceil(JSON.stringify(val).length / 4);
};

export const CollapsibleJsonViewer: React.FC<CollapsibleJsonViewerProps> = ({
  data,
  depth = 0,
  isLast = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(depth > 1);

  const tokenCount = estimateTokens(data);

  // Handle null / undefined
  if (data === null) {
    return (
      <span style={{ color: "#a1a1aa" }}>
        null{isLast ? "" : ","}
      </span>
    );
  }
  if (data === undefined) {
    return (
      <span style={{ color: "#a1a1aa" }}>
        undefined{isLast ? "" : ","}
      </span>
    );
  }

  const type = typeof data;

  // Handle Primitives
  if (type === "string") {
    return (
      <span style={{ color: "#22c55e" }}>
        "{data}"{isLast ? "" : ","}
      </span>
    );
  }
  if (type === "number") {
    return (
      <span style={{ color: "#3b82f6" }}>
        {data}{isLast ? "" : ","}
      </span>
    );
  }
  if (type === "boolean") {
    return (
      <span style={{ color: "#eab308" }}>
        {data ? "true" : "false"}{isLast ? "" : ","}
      </span>
    );
  }

  // Handle Array
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <span style={{ color: "#e4e4e7" }}>
          []{isLast ? "" : ","}
        </span>
      );
    }

    if (isCollapsed) {
      // Rule: if 2 or fewer items, inline them
      if (data.length <= 2) {
        return (
          <span
            onClick={() => setIsCollapsed(false)}
            style={{
              cursor: "pointer",
              color: "#a1a1aa",
              background: "#18181b",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.875rem",
              border: "1px solid #27272a",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            title="Click to expand"
          >
            <span style={{ color: "#38bdf8" }}>▶</span>
            <span style={{ color: "#e4e4e7" }}>
              [{data.map((item) => JSON.stringify(item)).join(", ")}]
            </span>
            <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
              [{tokenCount} tkn]
            </span>
          </span>
        );
      }

      // Default collapsed array view
      return (
        <span
          onClick={() => setIsCollapsed(false)}
          style={{
            cursor: "pointer",
            color: "#a1a1aa",
            background: "#18181b",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "0.875rem",
            border: "1px solid #27272a",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          title="Click to expand"
        >
          <span style={{ color: "#38bdf8" }}>▶</span>
          <span style={{ color: "#e4e4e7" }}>Array({data.length})</span>
          <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
            [{tokenCount} tkn]
          </span>
        </span>
      );
    }

    // Expanded Array view
    return (
      <div style={{ display: "inline-block", verticalAlign: "top" }}>
        <span
          onClick={() => setIsCollapsed(true)}
          style={{ cursor: "pointer", color: "#38bdf8", marginRight: "4px" }}
          title="Click to collapse"
        >
          ▼
        </span>
        <span style={{ color: "#e4e4e7" }}>[</span>
        <div style={{ paddingLeft: "1.5rem", borderLeft: "1px dashed #27272a" }}>
          {data.map((item, idx) => (
            <div key={idx} style={{ margin: "2px 0" }}>
              <CollapsibleJsonViewer
                data={item}
                depth={depth + 1}
                isLast={idx === data.length - 1}
              />
            </div>
          ))}
        </div>
        <span style={{ color: "#e4e4e7" }}>]</span>
        {!isLast && <span style={{ color: "#e4e4e7" }}>,</span>}
      </div>
    );
  }

  // Handle Object
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return (
      <span style={{ color: "#e4e4e7" }}>
        {"{}"}{isLast ? "" : ","}
      </span>
    );
  }

  if (isCollapsed) {
    // Specification: "When collapsed, if the field inside has a name field, then render the name followed by ellipses"
    // Also support cityName as a fallback for name
    const nameField = data.name !== undefined ? data.name : data.cityName;

    if (nameField !== undefined) {
      return (
        <span
          onClick={() => setIsCollapsed(false)}
          style={{
            cursor: "pointer",
            background: "#18181b",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "0.875rem",
            border: "1px solid #27272a",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          title="Click to expand"
        >
          <span style={{ color: "#38bdf8" }}>▶</span>
          <span style={{ color: "#f43f5e", fontWeight: "500" }}>
            {nameField}...
          </span>
          <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
            [{tokenCount} tkn]
          </span>
        </span>
      );
    }

    // Specification: "If the inside object has 2 or fewer fields, then just render both in collapsed mode"
    if (keys.length <= 2) {
      const inlineObj = keys
        .map((k) => `${k}: ${JSON.stringify(data[k])}`)
        .join(", ");
      return (
        <span
          onClick={() => setIsCollapsed(false)}
          style={{
            cursor: "pointer",
            background: "#18181b",
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "0.875rem",
            border: "1px solid #27272a",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          title="Click to expand"
        >
          <span style={{ color: "#38bdf8" }}>▶</span>
          <span style={{ color: "#e4e4e7" }}>{"{"} {inlineObj} {"}"}</span>
          <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
            [{tokenCount} tkn]
          </span>
        </span>
      );
    }

    // Default collapsed object view
    return (
      <span
        onClick={() => setIsCollapsed(false)}
        style={{
          cursor: "pointer",
          background: "#18181b",
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "0.875rem",
          border: "1px solid #27272a",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
        title="Click to expand"
      >
        <span style={{ color: "#38bdf8" }}>▶</span>
        <span style={{ color: "#a1a1aa" }}>Object({keys.length} keys)</span>
        <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
          [{tokenCount} tkn]
        </span>
      </span>
    );
  }

  // Expanded Object view
  return (
    <div style={{ display: "inline-block", verticalAlign: "top" }}>
      <span
        onClick={() => setIsCollapsed(true)}
        style={{ cursor: "pointer", color: "#38bdf8", marginRight: "4px" }}
        title="Click to collapse"
      >
        ▼
      </span>
      <span style={{ color: "#e4e4e7" }}>{"{"}</span>
      <div style={{ paddingLeft: "1.5rem", borderLeft: "1px dashed #27272a" }}>
        {keys.map((key, idx) => (
          <div key={key} style={{ margin: "2px 0" }}>
            <span style={{ color: "#f43f5e", marginRight: "4px" }}>
              "{key}"
            </span>
            <span style={{ color: "#e4e4e7", marginRight: "8px" }}>:</span>
            <CollapsibleJsonViewer
              data={data[key]}
              depth={depth + 1}
              isLast={idx === keys.length - 1}
            />
          </div>
        ))}
      </div>
      <span style={{ color: "#e4e4e7" }}>{"}"}</span>
      {!isLast && <span style={{ color: "#e4e4e7" }}>,</span>}
    </div>
  );
};
