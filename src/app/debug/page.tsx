"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTripFlowStore } from "../../store";
import { CollapsibleJsonViewer } from "../../components/CollapsibleJsonViewer";
import { TripFlowGraphSchema, TripFlowGraph } from "../../types/schema";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function DebugPage() {
  const [hasHydrated, setHasHydrated] = useState(false);

  const graph = useTripFlowStore((state) => state.graph);
  const isLoadingContext = useTripFlowStore((state) => state.isLoadingContext);
  const contextError = useTripFlowStore((state) => state.contextError);
  const initializeClientContext = useTripFlowStore(
    (state) => state.initializeClientContext,
  );
  const setGraph = useTripFlowStore((state) => state.setGraph);
  const setPlanning = useTripFlowStore((state) => state.setPlanning);

  // Gemini API Log States
  const [sentPayload, setSentPayload] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [receivedPayload, setReceivedPayload] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [promptInput, setPromptInput] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Token Counters (Q1 & Q2)
  const [sentTokenCount, setSentTokenCount] = useState<number>(0);
  const [receivedTokenCount, setReceivedTokenCount] = useState<number>(0);

  // Auto-scroll chat window
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
    if (!graph) {
      initializeClientContext();
    }
  }, [graph, initializeClientContext]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isQuerying]);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isQuerying || !graph) return;

    const currentPrompt = promptInput.trim();
    setPromptInput("");
    setValidationError(null);
    setIsQuerying(true);
    setPlanning(true);

    // Add user message to local chat history
    setChatHistory((prev) => [...prev, { role: "user", text: currentPrompt }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          graph,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error ||
            `API HTTP Error: ${response.status} ${response.statusText}`,
        );
      }

      const resData = await response.json();

      setSentPayload(resData.rawSent);
      setReceivedPayload(resData.rawReceived);

      // Read real tokens count from usageMetadata if available
      if (resData.rawReceived.usageMetadata) {
        setSentTokenCount(resData.rawReceived.usageMetadata.promptTokenCount);
        setReceivedTokenCount(
          resData.rawReceived.usageMetadata.candidatesTokenCount,
        );
      } else {
        setSentTokenCount(
          Math.ceil(JSON.stringify(resData.rawSent).length / 4),
        );
        setReceivedTokenCount(
          Math.ceil(JSON.stringify(resData.rawReceived).length / 4),
        );
      }

      // Overwrite local Zustand store with the server-side validated and recalculated graph
      if (resData.graph) {
        setGraph(resData.graph);
      }

      // Add response to chat history
      setChatHistory((prev) => [
        ...prev,
        { role: "model", text: resData.explanation },
      ]);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setValidationError(errorMessage);
      setChatHistory((prev) => [
        ...prev,
        { role: "model", text: `⚠️ Error during execution: ${errorMessage}` },
      ]);
    } finally {
      setIsQuerying(false);
      setPlanning(false);
    }
  };

  if (!hasHydrated || (isLoadingContext && !graph)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-darker font-mono text-text-primary">
        <div className="text-center">
          <div className="mb-4 text-suggest-color">
            ⚡ Loading client context & geolocating...
          </div>
          <div className="text-sm text-text-muted">
            Checking coordinates & local currency standards
          </div>
        </div>
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-darker p-8 font-mono text-budget-danger">
        <div className="w-full text-center" style={{ maxWidth: "600px" }}>
          <h2 className="mb-4 text-lg font-bold">
            Failed to initialize critical client context
          </h2>
          <pre className="rounded-lg border border-budget-danger bg-bg-dark p-6 text-left whitespace-pre-wrap">
            {contextError}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-darker font-mono text-text-primary">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between border-b border-border-color bg-bg-dark px-5 py-2">
        <div className="flex items-center gap-4">
          <span className="font-bold text-suggest-color">⚡ TripFlow Debug Playground</span>
        </div>
        <div className="flex gap-6">
          <Link
            href="/component-styling"
            className="flex items-center gap-1 text-sm text-text-secondary no-underline transition-colors hover:text-text-primary"
          >
            🎨 Component Styling
          </Link>
          <Link
            href="/globe"
            className="flex items-center gap-1 text-sm text-text-secondary no-underline transition-colors hover:text-text-primary"
          >
            🗺️ Globe View
          </Link>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-2 grid-rows-2 overflow-hidden">
        {/* --- QUADRANT 1: SENT PAYLOAD (TOP LEFT) --- */}
        <section className="flex flex-col overflow-hidden border-r border-b border-border-color">
          <header className="flex items-center justify-between border-b border-border-color bg-bg-dark px-4 py-3">
            <span className="font-bold text-transit-color">
              📤 Quadrant 1: JSON Payload Sent to Gemini
            </span>
            <span className="rounded-md bg-transit-color/15 px-2 py-0.5 text-xs text-transit-color">
              Total Sent: {sentTokenCount} tokens
            </span>
          </header>
          <div className="flex-1 overflow-auto p-4">
            {sentPayload ? (
              <CollapsibleJsonViewer data={sentPayload} depth={0} />
            ) : (
              <div className="italic text-text-muted">
                No request payload has been sent yet. Submit a message to populate
                this view.
              </div>
            )}
          </div>
        </section>

        {/* --- QUADRANT 2: RECEIVED PAYLOAD (TOP RIGHT) --- */}
        <section className="flex flex-col overflow-hidden border-b border-border-color">
          <header className="flex items-center justify-between border-b border-border-color bg-bg-dark px-4 py-3">
            <span className="font-bold text-budget-safe">
              📥 Quadrant 2: JSON Response from Gemini
            </span>
            <span className="rounded-md bg-budget-safe/15 px-2 py-0.5 text-xs text-budget-safe">
              Total Received: {receivedTokenCount} tokens
            </span>
          </header>
          <div className="flex-1 overflow-auto p-4">
            {receivedPayload ? (
              <CollapsibleJsonViewer data={receivedPayload} depth={0} />
            ) : (
              <div className="italic text-text-muted">
                No response payload received yet. Submit a message to populate
                this view.
              </div>
            )}
          </div>
        </section>

        {/* --- QUADRANT 3: CHAT DIALOGUE (BOTTOM LEFT) --- */}
        <section className="flex flex-col overflow-hidden border-r border-border-color bg-bg-darker">
          <header className="border-b border-border-color bg-bg-dark px-4 py-3 font-bold text-text-primary">
            💬 Quadrant 3: Chat Prompt & LLM Response
          </header>

          {/* Dialogue Feed */}
          <div className="flex-1 overflow-auto p-4">
            {chatHistory.length === 0 && (
              <div className="mx-auto my-8 text-center leading-relaxed text-text-secondary" style={{ maxWidth: "500px" }}>
                <p className="font-bold text-text-primary">
                  🤖 Welcome to the Trip Flow Gemini Playground!
                </p>
                <p className="text-sm">
                  Type a natural language instruction below to update your trip.
                  For example:{" "}
                  <i>
                    {
                      '"Add an activity named Louvre museum in Paris for 50 USD on June 3rd"'
                    }
                  </i>
                </p>
              </div>
            )}

            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <span className="mb-1 text-xs text-text-muted">
                  {msg.role === "user" ? "YOU" : "GEMINI"}
                </span>
                <div
                  style={{ maxWidth: "80%" }}
                  className={`rounded-lg px-4 py-3 leading-normal whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-transit-color text-white"
                      : "border border-border-color bg-bg-card text-text-primary shadow-glass"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isQuerying && (
              <div className="mb-4 flex flex-col items-start">
                <span className="mb-1 text-xs text-text-muted">
                  GEMINI
                </span>
                <div className="inline-flex items-center gap-2 rounded-lg border border-border-color bg-bg-card px-4 py-3 text-text-primary shadow-glass">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-suggest-color" />
                  AI is planning & validating schema delta...
                </div>
              </div>
            )}

            {validationError && (
              <div className="mt-4 rounded-lg border border-budget-danger bg-budget-danger/15 px-4 py-3 text-sm text-text-primary">
                <strong>⚠️ Validation Error:</strong> {validationError}
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendPrompt}
            className="flex gap-3 border-t border-border-color bg-bg-dark p-4"
          >
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Tell Gemini what modifications to apply to your Trip..."
              disabled={isQuerying}
              className="flex-1 resize-none rounded-md border border-border-color bg-bg-card p-3 font-mono text-text-primary outline-none focus:border-border-hover disabled:cursor-not-allowed"
              style={{ height: "50px" }}
            />
            <button
              type="submit"
              disabled={isQuerying || !promptInput.trim()}
              className={`rounded-md px-5 text-sm font-bold transition-colors ${
                isQuerying || !promptInput.trim()
                  ? "cursor-not-allowed bg-bg-darker text-text-muted"
                  : "cursor-pointer bg-transit-color text-white hover:bg-transit-color/90"
              }`}
            >
              Send
            </button>
          </form>
        </section>

        {/* --- QUADRANT 4: LIVE APP STATE (BOTTOM RIGHT) --- */}
        <section className="flex flex-col overflow-hidden">
          <header className="border-b border-border-color bg-bg-dark px-4 py-3 font-bold text-hub-color">
            ⚙️ Quadrant 4: Live Zustand Graph App State
          </header>
          <div className="flex-1 overflow-auto bg-bg-darker p-4">
            {graph ? (
              <CollapsibleJsonViewer data={graph} depth={0} />
            ) : (
              <div className="italic text-text-muted">
                No active graph state found.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
