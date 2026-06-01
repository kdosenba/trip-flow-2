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
Your task is to take the user's request and update their travel itinerary graph.
You have access to specific tool functions (like addStop, connectStops, addPlannedActivity, updateBudgetLimits, adjustTripDates) to execute these modifications.

- If the user asks to add or change stops, activities, budgets, or date bounds, you MUST select and call the appropriate tool(s).
- You can call multiple tools in a single turn if needed (e.g. adding a stop and then connecting it).
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
    const functionCalls = resData.candidates?.[0]?.content?.parts?.[0]?.functionCall 
      ? [resData.candidates[0].content.parts[0].functionCall] 
      : resData.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall) || [];

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
