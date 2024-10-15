import axios, { AxiosError } from "axios";
import { getAllowedKeywords } from "./keywordService";

interface OpenAIResponse {
  choices: Array<{
    message: {
      function_call?: {
        arguments?: string;
      };
    };
  }>;
}

export async function extractKeywordsFromUserInput(
  userInput: string
): Promise<string[]> {
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is not set in environment variables.");
  }

  // Fetch allowed keywords dynamically from Neo4j
  const allowedKeywords = await getAllowedKeywords("Anchorage"); // Pass the geo_area here

  if (allowedKeywords.length === 0) {
    throw new Error("No allowed keywords found in the database.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const requestBody = {
    model: "gpt-4o-mini", // Use the appropriate model
    messages: [
      {
        role: "user",
        content: `Extract up to 10 keywords from the following search string based on the allowed items. Here are the allowed items:
Keywords: ${allowedKeywords.join(", ")}
Search String: "${userInput}"`,
      },
    ],
    functions: [
      {
        name: "set_search_parameters",
        parameters: {
          type: "object",
          properties: {
            search: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            limit: { type: "number" },
            offset: { type: "number" },
          },
          required: ["search", "keywords", "limit", "offset"],
        },
      },
    ],
    function_call: "auto",
    max_tokens: 550,
  };

  try {
    const response = await axios.post(apiUrl, requestBody, { headers });
    const data: OpenAIResponse = response.data;

    const functionCall = data.choices[0].message.function_call;
    if (functionCall?.arguments) {
      const args = JSON.parse(functionCall.arguments);
      // Limit keywords to allowed items and up to 10 keywords
      const keywords = args.keywords
        .filter((kw: string) => allowedKeywords.includes(kw))
        .slice(0, 10); // Limit to 10 keywords
      return keywords;
    }
    return [];
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to extract keywords from OpenAI: ${error.message}`
      );
    } else if (error instanceof Error) {
      throw new Error(
        `Failed to extract keywords from OpenAI: ${error.message}`
      );
    } else {
      throw new Error(
        "Failed to extract keywords from OpenAI due to an unknown error."
      );
    }
  }
}
