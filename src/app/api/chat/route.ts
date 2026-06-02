import { NextRequest, NextResponse } from "next/server";
import { TripFlowGraphSchema } from "../../../types/schema";
import { GEMINI_TOOLS, executeTool } from "../../../lib/tools";

export async function POST(req: NextRequest) {
  try {
    const { prompt, graph } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt field in request body." }, { status: 400 });
    }
    if (!graph) {
      return NextResponse.json({ error: "Missing graph field in request body." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    const systemInstruction = `You are the core AI planner for Trip Flow, a dynamic itinerary graph builder.
Your task is to take the user's travel request and update their travel itinerary graph.
You have access to specific tool functions to execute these modifications.

### 🌐 Graph Topology & Connectivity Rules
Every travel itinerary is a directed graph where CityHub nodes represent stops, Location nodes represent activities/transit-points, and Transit edges represent connections.
1. **Never Orphan a Stop**: Whenever a user asks to add or plan a new travel stop/destination (using \`addTripCity\`), you **MUST** also establish a transit connection from the prior active stop (or the \`ORIGIN\` stop if it's the first departure) to the new stop. 
2. **How to Connect Two Cities**: To connect City A to City B, you must execute a multi-step chain:
   a. Create the departure transit point (e.g. Airport/Train Station) in City A using \`addTransitPoint\` if it does not already exist in the graph.
   b. Create the arrival transit point (e.g. Airport/Train Station) in City B using \`addTransitPoint\` if it does not already exist.
   c. Build the transit connection edge between the two cities using \`connectTransitPoints\`, referencing the respective cities and transit point location IDs.
3. **Parallel Tool Calling**: When the user requests a new stop (e.g. "Plan a trip to Morocco"), you should make **all relevant tool calls in parallel in a single turn** (e.g. calling \`addTripCity\` for the destination, \`addTransitPoint\` for departure, \`addTransitPoint\` for arrival, and \`connectTransitPoints\` to link them).

### 🏷️ Logical ID Chaining
Since the graph runs on client-provided IDs, you must generate short, logical, and consistent string IDs in your tool parameters to chain parallel calls:
* **CityHubs**: Format is \`hub_<city_name>_<4_char_random_hex>\` (e.g. \`hub_marrakech_7f2b\`).
* **Locations**: Format is \`loc_<4_char_random_hex>\` (e.g. \`loc_f92b\`).
* Reference these identical self-generated IDs across your parallel tool calls in the same turn so the backend can link them instantly.

### 📅 Scheduling & Time Rules
* All start and end times must be ISO 8601 Datetime strings (e.g. \`YYYY-MM-DDTHH:mm:ssZ\`).
* Transit connection arrival times must be after departure times.
* Activities/itinerary items at a stop must occur chronologically after the transit arrival time at that stop, and before the departure transit time to the next stop.

### ✍️ Write-Only Mutations
All tool functions are write-only graph mutators that execute state updates and do not return data back to you. Do not wait for tool output to decide your next steps—simply perform all required parallel mutations and write a clean, helpful final message to the user explaining what you did.

- If the request is a simple conversational query or question that does not require updating the graph, just respond with text normally.`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Current TripFlowGraph:\n${JSON.stringify(graph)}\n\nRequest: ${prompt}`
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      tools: GEMINI_TOOLS
    };

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
      throw new Error(`Gemini API HTTP Error: ${response.status} ${response.statusText}`);
    }

    const resData = await response.json();

    const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parts = resData.candidates?.[0]?.content?.parts || [];
    const functionCalls = parts
      .filter((p: any) => p.functionCall)
      .map((p: any) => p.functionCall);

    let updatedGraph = graph;
    const executedToolsList = [];

    // Execute tool mutations if returned by Gemini
    if (functionCalls.length > 0) {
      for (const call of functionCalls) {
        updatedGraph = await executeTool(call.name, call.args, updatedGraph);
        executedToolsList.push({ name: call.name, args: call.args });
      }

      // Validate the mutated graph schema
      TripFlowGraphSchema.parse(updatedGraph);
    }

    // Synthesize the final text explanation
    let explanation = rawText || "";
    if (executedToolsList.length > 0) {
      const toolSummaries = executedToolsList
        .map((t) => `${t.name}(${JSON.stringify(t.args)})`)
        .join(", ");
      explanation = `Successfully updated itinerary graph by executing the following tool mutations: ${toolSummaries}.`;
    } else if (!explanation) {
      explanation = "No modifications requested.";
    }

    return NextResponse.json({
      explanation,
      graph: updatedGraph,
      executedTools: executedToolsList,
      rawSent: payload,
      rawReceived: resData
    });
  } catch (err: any) {
    console.error("Error in /api/chat handler:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
