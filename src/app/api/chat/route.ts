import { NextRequest, NextResponse } from "next/server";
import { TripFlowGraphSchema } from "../../../types/schema";
import { GEMINI_TOOLS, executeTool } from "../../../lib/tools";

export async function POST(req: NextRequest) {
  try {
    const { prompt, graph } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt field in request body." },
        { status: 400 },
      );
    }
    if (!graph) {
      return NextResponse.json(
        { error: "Missing graph field in request body." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 },
      );
    }

    const systemInstruction = `You are the core AI planner for Trip Flow, a dynamic itinerary graph builder.
Your task is to take the user's travel request and update their travel itinerary graph.
You have access to specific tool functions to execute these modifications.

### 🌐 Graph Topology & Connectivity Rules
Every travel itinerary is a directed graph where CityHub nodes represent stops, Location nodes represent activities/transit-points, and Transit edges represent connections.
1. **Never Orphan a Stop**: Whenever you add a new travel stop/destination (using \`addTripCities\`), you **MUST** also establish a transit connection from the prior active stop (or the \`ORIGIN\` stop if it's the first departure) to the new stop. 
2. **How to Connect Two Cities**: To connect City A to City B, use \`addTransitConnections\`. In that tool call, you specify the source city, destination city, define any **new** transit locations needed (in the \`locations\` array), and list the connection \`segments\` linking them.
3. **Transit Point Reusability & Deduplication Rules**:
   a. **Re-use existing locations**: Before defining a new location in the \`locations\` array of \`addTransitConnections\`, scan the current graph's \`Locations\` state. If a Location with the same name (e.g., "Heathrow Airport" or "JFK Airport") or IATA code already exists, you **MUST NOT** define it again. Instead, reuse the existing \`LocationId\` directly in your segment references (\`fromLocationId\` and \`toLocationId\`).
   b. **Single location for each physical transit point**: If a single airport or station serves as both the arrival point and departure point for a city stop (which is almost always the case for flights at the same airport), you **MUST** use only a single transit point and a single logical ID (e.g. \`loc_f92b\`). Do not create separate duplicate arrival/departure locations (like \`loc_lon_arr_f7e1\` and \`loc_lon_dep_f7e1\`) for the same physical transit point.
4. **Batch/Array Tool Calling**: Use the plural forms of the tools (\`addTripCities\`, \`addItineraryItems\`, \`addTransitConnections\`) to add multiple stops, activities, or connections in a single tool call when planning a trip.

### 🏷️ Logical ID Chaining
Since the graph runs on client-provided IDs, you must generate short, logical, and consistent string IDs in your tool parameters to chain parallel calls:
* **CityHubs**: Format is \`hub_<city_name>_<4_char_random_hex>\` (e.g. \`hub_marrakech_7f2b\`).
* **Locations**: Format is \`loc_<4_char_random_hex>\` (e.g. \`loc_f92b\`). **NEVER** append \`_arr\` or \`_dep\` to the location ID.
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
              text: `Current Time/Date: ${new Date().toISOString()}\nCurrent TripFlowGraph:\n${JSON.stringify(graph)}\n\nRequest: ${prompt}`,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: systemInstruction,
          },
        ],
      },
      tools: GEMINI_TOOLS,
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Gemini API HTTP Error: ${response.status} ${response.statusText}`,
      );
    }

    const resData = await response.json();

    const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    interface GeminiPart {
      text?: string;
      functionCall?: {
        name: string;
        args: Record<string, unknown>;
      };
    }

    const parts = (resData.candidates?.[0]?.content?.parts ||
      []) as GeminiPart[];
    const functionCalls = parts
      .filter((p) => p.functionCall)
      .map((p) => p.functionCall!);

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
      rawReceived: resData,
    });
  } catch (err) {
    console.error("Error in /api/chat handler:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
