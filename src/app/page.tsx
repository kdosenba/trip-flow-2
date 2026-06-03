"use client";

import { useEffect } from "react";
import { useTripFlowStore } from "../store";

export default function Home() {
  const graph = useTripFlowStore((state) => state.graph);
  const isLoadingContext = useTripFlowStore((state) => state.isLoadingContext);
  const contextError = useTripFlowStore((state) => state.contextError);
  const initializeClientContext = useTripFlowStore(
    (state) => state.initializeClientContext,
  );

  useEffect(() => {
    initializeClientContext();
  }, [initializeClientContext]);

  if (isLoadingContext) {
    return (
      <main
        style={{
          padding: "2rem",
          fontFamily: "monospace",
          background: "#09090b",
          color: "#f4f4f5",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
          Client Context
        </h1>
        <div style={{ color: "#eab308" }}>
          Loading geolocation and client context...
        </div>
      </main>
    );
  }

  if (contextError) {
    return (
      <main
        style={{
          padding: "2rem",
          fontFamily: "monospace",
          background: "#09090b",
          color: "#f4f4f5",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
          Client Context Error
        </h1>
        <div style={{ color: "#ef4444" }}>Error: {contextError}</div>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "monospace",
        background: "#09090b",
        color: "#f4f4f5",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
        Client Context Raw Data
      </h1>
      <pre
        style={{
          background: "#18181b",
          color: "#22c55e",
          padding: "1.5rem",
          borderRadius: "8px",
          overflowX: "auto",
          fontSize: "1rem",
          border: "1px solid #27272a",
          lineHeight: "1.5",
        }}
      >
        {JSON.stringify(graph?.clientContext, null, 2)}
      </pre>
    </main>
  );
}
