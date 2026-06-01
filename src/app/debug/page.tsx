"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTripFlowStore } from "../../store";
import { CollapsibleJsonViewer } from "../../components/CollapsibleJsonViewer";
import { TripFlowGraphSchema, TripFlowGraph } from "../../types/schema";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function DebugPage() {
  const graph = useTripFlowStore((state) => state.graph);
  const isLoadingContext = useTripFlowStore((state) => state.isLoadingContext);
  const contextError = useTripFlowStore((state) => state.contextError);
  const initializeClientContext = useTripFlowStore((state) => state.initializeClientContext);
  const setGraph = useTripFlowStore((state) => state.setGraph);

  // Gemini API Log States
  const [sentPayload, setSentPayload] = useState<any>(null);
  const [receivedPayload, setReceivedPayload] = useState<any>(null);
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

    // Add user message to local chat history
    setChatHistory((prev) => [...prev, { role: "user", text: currentPrompt }]);

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      setValidationError("Gemini API key is missing. Please add GEMINI_API_KEY in your .env file.");
      setIsQuerying(false);
      return;
    }

    // System instructions telling the model how to act, what the schema is, and its strict JSON output constraint
    const systemInstruction = `You are the core AI planner for Trip Flow, a dynamic itinerary graph builder.
Your task is to take the user's conversational request, apply it logically to the current TripFlowGraph state, and return BOTH a brief explanation and the fully updated, valid graph structure.

You MUST respond with a single, raw, valid JSON object containing EXACTLY two keys:
1. "explanation" (string): A short, professional, conversational explanation of the modifications you made.
2. "graph" (object): The fully updated TripFlowGraph state matching the schema.

Important Rules:
- Do not wrap your response in markdown code blocks (\`\`\`json). Return the pure JSON text only.
- Preserve all existing locations, hubs, segments, and IDs unless explicitly asked to modify or delete them.
- If the user adds a new stop or transit, generate a unique random UUID for the new location/city hub/transit IDs.
- Ensure cost values are positive numbers.
- Ensure that for any CityHub of type "HUB", its arrivalNodeId and departureNodeId match valid LocationId values in the Locations record.
- Follow all schedule constraints: end dates must be on or after start dates.`;

    // Construct the payload according to standard Gemini content APIs
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `Current TripFlowGraph State:\n${JSON.stringify(graph, null, 2)}\n\nUser Request: ${currentPrompt}`
          }
        ]
      }
    ];

    const payload = {
      contents,
      systemInstruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    setSentPayload(payload);
    // Simple heuristic estimate for sent tokens if API doesn't return metadata
    const estimatedSent = Math.ceil(JSON.stringify(payload).length / 4);
    setSentTokenCount(estimatedSent);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`API HTTP Error: ${response.status} ${response.statusText}`);
      }

      const resData = await response.json();
      setReceivedPayload(resData);

      // Read real tokens count from usageMetadata if available
      if (resData.usageMetadata) {
        setSentTokenCount(resData.usageMetadata.promptTokenCount);
        setReceivedTokenCount(resData.usageMetadata.candidatesTokenCount);
      } else {
        setReceivedTokenCount(Math.ceil(JSON.stringify(resData).length / 4));
      }

      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Empty response received from Gemini API");
      }

      // Parse the response
      const parsedResponse = JSON.parse(rawText.trim());

      if (!parsedResponse.explanation || !parsedResponse.graph) {
        throw new Error("Response JSON does not contain 'explanation' or 'graph' keys.");
      }

      // Validate the graph against our schema
      const validatedGraph = TripFlowGraphSchema.parse(parsedResponse.graph);

      // Overwrite local Zustand store with valid graph
      setGraph(validatedGraph);

      // Add response to chat history
      setChatHistory((prev) => [
        ...prev,
        { role: "model", text: parsedResponse.explanation }
      ]);
    } catch (err: any) {
      console.error(err);
      setValidationError((err as Error).message);
      setChatHistory((prev) => [
        ...prev,
        { role: "model", text: `⚠️ Error during execution: ${(err as Error).message}` }
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  if (isLoadingContext && !graph) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#09090b",
        color: "#f4f4f5",
        fontFamily: "monospace"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#eab308", marginBottom: "1rem" }}>⚡ Loading client context & geolocating...</div>
          <div style={{ fontSize: "0.875rem", color: "#71717a" }}>Checking coordinates & local currency standards</div>
        </div>
      </div>
    );
  }

  if (contextError) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#09090b",
        color: "#ef4444",
        fontFamily: "monospace",
        padding: "2rem"
      }}>
        <div style={{ maxWidth: "600px", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Failed to initialize critical client context</h2>
          <pre style={{ background: "#18181b", padding: "1.5rem", borderRadius: "8px", border: "1px solid #ef4444" }}>
            {contextError}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr 1fr",
      height: "100vh",
      background: "#09090b",
      color: "#e4e4e7",
      fontFamily: "monospace",
      overflow: "hidden"
    }}>
      {/* --- QUADRANT 1: SENT PAYLOAD (TOP LEFT) --- */}
      <section style={{
        borderRight: "1px solid #27272a",
        borderBottom: "1px solid #27272a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        <header style={{
          background: "#18181b",
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #27272a"
        }}>
          <span style={{ fontWeight: "bold", color: "#38bdf8" }}>📤 Quadrant 1: JSON Payload Sent to Gemini</span>
          <span style={{
            fontSize: "0.75rem",
            background: "#0c4a6e",
            color: "#38bdf8",
            padding: "2px 8px",
            borderRadius: "4px"
          }}>
            Total Sent: {sentTokenCount} tokens
          </span>
        </header>
        <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
          {sentPayload ? (
            <CollapsibleJsonViewer data={sentPayload} depth={0} />
          ) : (
            <div style={{ color: "#71717a", fontStyle: "italic" }}>No request payload has been sent yet. Submit a message to populate this view.</div>
          )}
        </div>
      </section>

      {/* --- QUADRANT 2: RECEIVED PAYLOAD (TOP RIGHT) --- */}
      <section style={{
        borderBottom: "1px solid #27272a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        <header style={{
          background: "#18181b",
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #27272a"
        }}>
          <span style={{ fontWeight: "bold", color: "#22c55e" }}>📥 Quadrant 2: JSON Response from Gemini</span>
          <span style={{
            fontSize: "0.75rem",
            background: "#064e3b",
            color: "#34d399",
            padding: "2px 8px",
            borderRadius: "4px"
          }}>
            Total Received: {receivedTokenCount} tokens
          </span>
        </header>
        <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
          {receivedPayload ? (
            <CollapsibleJsonViewer data={receivedPayload} depth={0} />
          ) : (
            <div style={{ color: "#71717a", fontStyle: "italic" }}>No response payload received yet. Submit a message to populate this view.</div>
          )}
        </div>
      </section>

      {/* --- QUADRANT 3: CHAT DIALOGUE (BOTTOM LEFT) --- */}
      <section style={{
        borderRight: "1px solid #27272a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#0c0c0e"
      }}>
        <header style={{
          background: "#18181b",
          padding: "0.75rem 1rem",
          fontWeight: "bold",
          color: "#eab308",
          borderBottom: "1px solid #27272a"
        }}>
          💬 Quadrant 3: Chat Prompt & LLM Response
        </header>

        {/* Dialogue Feed */}
        <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
          {chatHistory.length === 0 && (
            <div style={{
              color: "#71717a",
              lineHeight: "1.6",
              maxWidth: "500px",
              margin: "2rem auto",
              textAlign: "center"
            }}>
              <p style={{ fontWeight: "bold", color: "#e4e4e7" }}>🤖 Welcome to the Trip Flow Gemini Playground!</p>
              <p style={{ fontSize: "0.875rem" }}>
                Type a natural language instruction below to update your trip.
                For example: <i>"Add an activity named Louvre museum in Paris for 50 USD on June 3rd"</i>
              </p>
            </div>
          )}

          {chatHistory.map((msg, idx) => (
            <div key={idx} style={{
              marginBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start"
            }}>
              <span style={{
                fontSize: "0.75rem",
                color: "#71717a",
                marginBottom: "4px"
              }}>
                {msg.role === "user" ? "YOU" : "GEMINI"}
              </span>
              <div style={{
                background: msg.role === "user" ? "#2563eb" : "#27272a",
                color: msg.role === "user" ? "#ffffff" : "#e4e4e7",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                maxWidth: "80%",
                lineHeight: "1.4",
                whiteSpace: "pre-wrap"
              }}>
                {msg.text}
              </div>
            </div>
          ))}

          {isQuerying && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#71717a", marginBottom: "4px" }}>GEMINI</span>
              <div style={{
                background: "#18181b",
                color: "#eab308",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span className="animate-pulse" style={{ display: "inline-block", width: "8px", height: "8px", background: "#eab308", borderRadius: "50%" }} />
                AI is planning & validating schema delta...
              </div>
            </div>
          )}

          {validationError && (
            <div style={{
              background: "#450a0a",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginTop: "1rem",
              fontSize: "0.875rem"
            }}>
              <strong>⚠️ Validation Error:</strong> {validationError}
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendPrompt} style={{
          padding: "1rem",
          background: "#18181b",
          borderTop: "1px solid #27272a",
          display: "flex",
          gap: "0.75rem"
        }}>
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Tell Gemini what modifications to apply to your Trip..."
            disabled={isQuerying}
            style={{
              flex: 1,
              background: "#09090b",
              color: "#f4f4f5",
              border: "1px solid #27272a",
              borderRadius: "6px",
              padding: "0.75rem",
              resize: "none",
              height: "50px",
              fontFamily: "monospace",
              outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={isQuerying || !promptInput.trim()}
            style={{
              background: isQuerying || !promptInput.trim() ? "#27272a" : "#2563eb",
              color: isQuerying || !promptInput.trim() ? "#71717a" : "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0 1.25rem",
              cursor: isQuerying || !promptInput.trim() ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "0.875rem"
            }}
          >
            Send
          </button>
        </form>
      </section>

      {/* --- QUADRANT 4: LIVE APP STATE (BOTTOM RIGHT) --- */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        <header style={{
          background: "#18181b",
          padding: "0.75rem 1rem",
          fontWeight: "bold",
          color: "#a855f7",
          borderBottom: "1px solid #27272a"
        }}>
          ⚙️ Quadrant 4: Live Zustand Graph App State
        </header>
        <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
          {graph ? (
            <CollapsibleJsonViewer data={graph} depth={0} />
          ) : (
            <div style={{ color: "#71717a", fontStyle: "italic" }}>No active graph state found.</div>
          )}
        </div>
      </section>
    </div>
  );
}
