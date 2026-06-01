"use client";

import React, { useState, useEffect } from "react";
import { produce } from "immer";

interface CollapsibleJsonViewerProps {
  data: any;
  depth?: number;
  isLast?: boolean;
  editable?: boolean | undefined;
  onChange?: ((newData: any) => void) | undefined;
  path?: (string | number)[] | undefined;
  onChangePath?: ((path: (string | number)[], value: any) => void) | undefined;
}

/**
 * MapLibre GL Style Specification documentation helper
 */
const STYLE_SPEC_DOCS: Record<string, string> = {
  "version": "The style specification version. Must be 8.",
  "name": "A human-readable name for the style.",
  "metadata": "Arbitrary metadata used by style creators and applications.",
  "center": "The default starting center point of the map as [longitude, latitude].",
  "zoom": "The default starting zoom level of the map (0 to 24).",
  "projection": "The geographic projection to use when rendering the map (e.g., 'globe' or 'mercator').",
  "sources": "Data sources for the map layers (e.g., vector, raster, geojson, raster-dem).",
  "glyphs": "A URL template for loading signed distance field fonts in PBF format.",
  "layers": "An array of style layers. The order of layers determines their rendering stack (bottom-to-top).",
  "id": "A unique layer identifier.",
  "type": "The rendering type for this layer: background, fill, line, symbol, raster, circle, fill-extrusion, hillshade, heatmap.",
  "source": "The ID of the data source to use for this layer.",
  "source-layer": "The specific layer to use from a vector tile source.",
  "filter": "An expression filter specifying conditions on source features to be rendered.",
  "layout": "Layout properties that define how features are placed and spaced on the map.",
  "paint": "Paint properties that define how features are colored, shaded, and styled visually.",
  "background-color": "The color with which the background layer will be drawn.",
  "fill-color": "The fill color of a polygon/fill layer.",
  "fill-opacity": "The opacity of a polygon/fill layer (0 to 1).",
  "line-color": "The color with which a line layer will be drawn.",
  "line-width": "The width of the line layer in pixels.",
  "line-dasharray": "Specifies the pattern of dashes and gaps used to stroke paths.",
  "line-cap": "The display of line endings: butt, round, square.",
  "line-join": "The display of line joins: bevel, round, miter.",
  "fill-extrusion-color": "The color of the 3D polygon extrusion.",
  "fill-extrusion-height": "The height of the 3D extrusion in meters.",
  "fill-extrusion-base": "The height offset (minimum height) from the ground for the 3D extrusion in meters.",
  "fill-extrusion-opacity": "The opacity of the 3D extrusion layer (0 to 1).",
  "text-field": "The feature property or expression to use for symbol text labels.",
  "text-font": "The font stack to use for displaying symbol text labels.",
  "text-size": "The font size for label text in pixels.",
  "text-transform": "Specifies label text casing: none, uppercase, lowercase.",
  "text-color": "The color of the label text.",
  "text-halo-color": "The color of the label text border (halo).",
  "text-halo-width": "The width of the label text border (halo) in pixels.",
  "terrain": "Global 3D elevation terrain settings for the map.",
  "exaggeration": "A multiplier to exaggerate/scale the vertical height of 3D elevation terrain."
};

/**
 * Micro-animated glassmorphic Tooltip Component
 */
const SpecTooltip: React.FC<{ textKey: string; children: React.ReactNode }> = ({ textKey, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const text = STYLE_SPEC_DOCS[textKey];

  if (!text) return <>{children}</>;

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: "relative", display: "inline-block" }}
    >
      {children}
      {isHovered && (
        <span style={{
          position: "absolute",
          bottom: "125%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(9, 9, 11, 0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(63, 63, 70, 0.4)",
          borderRadius: "8px",
          padding: "8px 12px",
          color: "#f4f4f5",
          fontSize: "0.75rem",
          fontFamily: "sans-serif",
          width: "220px",
          lineHeight: "1.4",
          whiteSpace: "normal",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
          zIndex: 9999,
          pointerEvents: "none"
        }}>
          <strong>Style Spec:</strong> {text}
        </span>
      )}
    </span>
  );
};

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
  editable = false,
  onChange,
  path = [],
  onChangePath,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(depth > 1);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState<string>("");

  const tokenCount = estimateTokens(data);

  // Synchronize internal editing state when primitive shifts
  useEffect(() => {
    if (data !== null && data !== undefined) {
      setEditVal(data.toString());
    }
  }, [data]);

  // Handle local path updating mechanism
  const handlePathChange = (childPath: (string | number)[], newValue: any) => {
    if (depth === 0 && onChange) {
      const nextData = produce(data, (draft: any) => {
        let current: any = draft;
        for (let i = 0; i < childPath.length - 1; i++) {
          const key = childPath[i];
          if (key !== undefined) {
            current = current[key];
          }
        }
        const lastKey = childPath[childPath.length - 1];
        if (lastKey !== undefined) {
          current[lastKey] = newValue;
        }
      });
      onChange(nextData);
    } else if (onChangePath) {
      onChangePath(childPath, newValue);
    }
  };

  const handleSaveEdit = (valStr: string) => {
    setIsEditing(false);
    if (data === null || data === undefined) return;

    let parsedVal: any = valStr;
    if (typeof data === "number") {
      parsedVal = Number(valStr);
      if (isNaN(parsedVal)) parsedVal = data; // Rollback
    } else if (typeof data === "boolean") {
      parsedVal = valStr === "true";
    }

    if (onChangePath) {
      onChangePath(path, parsedVal);
    } else if (depth === 0 && onChange) {
      onChange(parsedVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveEdit(editVal);
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditVal(data.toString());
    }
  };

  const handleBlur = () => {
    handleSaveEdit(editVal);
  };

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
      <div style={{ display: "inline-block" }}>
        {isEditing ? (
          <input
            type="text"
            autoFocus
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              background: "#18181b",
              color: "#22c55e",
              border: "1px solid #3f3f46",
              borderRadius: "4px",
              padding: "2px 4px",
              fontSize: "inherit",
              fontFamily: "monospace",
              outline: "none"
            }}
          />
        ) : (
          <span
            onClick={editable ? () => setIsEditing(true) : undefined}
            style={{
              color: "#22c55e",
              cursor: editable ? "pointer" : "default",
              borderBottom: editable ? "1px dashed rgba(34, 197, 94, 0.4)" : "none",
              padding: "1px 0"
            }}
            title={editable ? "Click to edit string" : undefined}
          >
            "{data}"{isLast ? "" : ","}
          </span>
        )}
      </div>
    );
  }
  if (type === "number") {
    return (
      <div style={{ display: "inline-block" }}>
        {isEditing ? (
          <input
            type="number"
            autoFocus
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              background: "#18181b",
              color: "#3b82f6",
              border: "1px solid #3f3f46",
              borderRadius: "4px",
              padding: "2px 4px",
              fontSize: "inherit",
              fontFamily: "monospace",
              outline: "none",
              width: "100px"
            }}
          />
        ) : (
          <span
            onClick={editable ? () => setIsEditing(true) : undefined}
            style={{
              color: "#3b82f6",
              cursor: editable ? "pointer" : "default",
              borderBottom: editable ? "1px dashed rgba(59, 130, 246, 0.4)" : "none",
              padding: "1px 0"
            }}
            title={editable ? "Click to edit number" : undefined}
          >
            {data}{isLast ? "" : ","}
          </span>
        )}
      </div>
    );
  }
  if (type === "boolean") {
    return (
      <div style={{ display: "inline-block" }}>
        {isEditing ? (
          <select
            autoFocus
            value={editVal}
            onChange={(e) => handleSaveEdit(e.target.value)}
            onBlur={() => setIsEditing(false)}
            style={{
              background: "#18181b",
              color: "#eab308",
              border: "1px solid #3f3f46",
              borderRadius: "4px",
              padding: "2px 4px",
              fontSize: "inherit",
              fontFamily: "monospace",
              outline: "none"
            }}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : (
          <span
            onClick={editable ? () => setIsEditing(true) : undefined}
            style={{
              color: "#eab308",
              cursor: editable ? "pointer" : "default",
              borderBottom: editable ? "1px dashed rgba(234, 179, 8, 0.4)" : "none",
              padding: "1px 0"
            }}
            title={editable ? "Click to toggle boolean" : undefined}
          >
            {data ? "true" : "false"}{isLast ? "" : ","}
          </span>
        )}
      </div>
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
      const hasNested = data.some(
        (item) => typeof item === "object" && item !== null
      );

      if (data.length <= 2 && !hasNested) {
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
            title="Click to expand array"
          >
            <span style={{ color: "#38bdf8" }}>▶</span>
            <span style={{ color: "#e4e4e7" }}>
              [{data.map((item) => JSON.stringify(item)).join(", ")}]
            </span>
            <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
              [~{tokenCount} tokens]
            </span>
          </span>
        );
      }

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
          title="Click to expand array"
        >
          <span style={{ color: "#38bdf8" }}>▶</span>
          <span style={{ color: "#e4e4e7" }}>[ ... ]</span>
          <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
            [~{tokenCount} tokens]
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
          title="Click to collapse array"
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
                editable={editable}
                onChange={onChange}
                path={[...path, idx]}
                onChangePath={onChangePath || handlePathChange}
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
    const nameField = data.name !== undefined ? data.name : data.cityName;

    if (nameField !== undefined && (typeof nameField === "string" || typeof nameField === "number")) {
      const nameKey = data.name !== undefined ? "name" : "cityName";
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
          title="Click to expand object"
        >
          <span style={{ color: "#38bdf8" }}>▶</span>
          <span style={{ color: "#e4e4e7" }}>
            {"{"} {nameKey}: "{nameField}", ... {"}"}
          </span>
          <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
            [~{tokenCount} tokens]
          </span>
        </span>
      );
    }

    const hasNested = keys.some(
      (k) => typeof data[k] === "object" && data[k] !== null
    );

    if (keys.length <= 2 && !hasNested) {
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
          title="Click to expand object"
        >
          <span style={{ color: "#38bdf8" }}>▶</span>
          <span style={{ color: "#e4e4e7" }}>{"{"} {inlineObj} {"}"}</span>
          <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
            [~{tokenCount} tokens]
          </span>
        </span>
      );
    }

    // Default collapsed object view showing "..."
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
        title="Click to expand object"
      >
        <span style={{ color: "#38bdf8" }}>▶</span>
        <span style={{ color: "#e4e4e7" }}>{"{ ... }"}</span>
        <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
          [~{tokenCount} tokens]
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
        title="Click to collapse object"
      >
        ▼
      </span>
      <span style={{ color: "#e4e4e7" }}>{"{"}</span>
      <div style={{ paddingLeft: "1.5rem", borderLeft: "1px dashed #27272a" }}>
        {keys.map((key, idx) => (
          <div key={key} style={{ margin: "2px 0" }}>
            <SpecTooltip textKey={key}>
              <span style={{ color: "#f43f5e", marginRight: "4px", cursor: STYLE_SPEC_DOCS[key] ? "help" : "default" }}>
                "{key}"
              </span>
            </SpecTooltip>
            <span style={{ color: "#e4e4e7", marginRight: "8px" }}>:</span>
            <CollapsibleJsonViewer
              data={data[key]}
              depth={depth + 1}
              isLast={idx === keys.length - 1}
              editable={editable}
              onChange={onChange}
              path={[...path, key]}
              onChangePath={onChangePath || handlePathChange}
            />
          </div>
        ))}
      </div>
      <span style={{ color: "#e4e4e7" }}>{"}"}</span>
      {!isLast && <span style={{ color: "#e4e4e7" }}>,</span>}
    </div>
  );
};
