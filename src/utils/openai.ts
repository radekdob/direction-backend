import axios, { AxiosError } from "axios";
import { getAllowedKeywords } from "./keywordService";
import { PoiSearchResponse, PoiLLM, Poi } from "../app/search/types-v2";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
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
  state: string,
  userInput: string,
  location?: string,
  locationType?: string
): Promise<string[]> {
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is not set in environment variables.");
  }

  // Fetch allowed keywords dynamically from Neo4j
  const allowedKeywords = await getAllowedKeywords(state);

  if (allowedKeywords.length === 0) {
    throw new Error("No allowed keywords found in the database.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const requestBody = {
    model: "gpt-4o-mini", // Ensure you use the correct and available model
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
    function_call: "auto", // Let the model decide if function call is needed
    max_tokens: 550,
  };

  try {
    const response = await axios.post(apiUrl, requestBody, { headers });
    const data: OpenAIResponse = response.data;

    // Check if a function call was made
    const functionCall = data.choices[0].message.function_call;
    if (functionCall?.arguments) {
      const args = JSON.parse(functionCall.arguments);
      // Filter and limit keywords to allowed items and up to 10 keywords
      const keywords = args.keywords
        .filter((kw: string) => allowedKeywords.includes(kw))
        .slice(0, 10); // Limit to 10 keywords
      return keywords;
    }

    return [];
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Axios error while communicating with OpenAI: ${error.message}`,
        error.response?.data
      );
      throw new Error(
        `Failed to extract keywords from OpenAI: ${error.message}`
      );
    }
    if (error instanceof Error) {
      console.error(
        `Error while extracting keywords from OpenAI: ${error.message}`
      );
      throw new Error(
        `Failed to extract keywords from OpenAI: ${error.message}`
      );
    }
    throw new Error(
      "Failed to extract keywords from OpenAI due to an unknown error."
    );
  }
}

export async function searchPoiByOpenAI(
  userInput: string,
): Promise<PoiSearchResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is not set in environment variables.");
  }

  const client = new OpenAI();

  const PoiLLM = z.object({
    name: z.string(),
    lng: z.number(),
    lat: z.number(),
    description: z.string(),
    imageUrl: z.string(),
    url: z.string(),
  });

  const FindPoiEvent = z.object({
    items: z.array(PoiLLM),
  });

  /* const completion = await client.chat.completions.create({
    model: "gpt-4o-mini-search-preview",
    web_search_options: {

    },
    messages: [
      {
        role: "user",
        content: userInput,
      },
      {
        role: "assistant",
        content: `Based on the user input, provide a list of places to visit. 
For the imageUrl field, please provide a valid, publicly accessible image URL that shows the actual place.
Use image URLs from reliable sources like Unsplash, Pexels or official tourism websites, or other public repositories.
Do not generate or make up image URLs - only use real, accessible URLs for existing images. Don't use url from url field as imageUrl.`,
      },

    ],
    response_format: zodResponseFormat(FindPoiEvent, "event"),
  });
  const parsedContent = JSON.parse(completion.choices[0].message.content as any); */

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    //include: ['computer_call_output.output.image_url'],
    tools: [{ 
      type: "web_search_preview",
     // search_context_size: "high",
    }],
    text: {
      format: {
        type: "json_schema",
        name: "event",
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string"
                  },
                  lng: {
                    type: "number"
                  },
                  lat: {
                    type: "number"
                  },
                  description: {
                    type: "string"
                  },
                  imageUrl: {
                    type: "string"
                  },
                  url: {
                    type: "string"
                  }
                },
                required: ["name", "lng", "lat", "description", "imageUrl", "url"],
                additionalProperties: false
              }
            }
          },
          required: ["items"],
          additionalProperties: false
        }
      }
    },
    input: [
      {
        role: "user",
        content: userInput,
      },
      {
        role: "assistant",
        content: `Based on the user input, provide a list of places to visit. 
For the imageUrl field, please provide a valid, publicly accessible image URL that shows the actual place.
Use image URLs from official tourism websites travel blogs, or other public repositories. Check if the image is available on the web.
Do not generate or make up image URLs - only use real, accessible URLs for existing images. Don't use url from url field as imageUrl.`,
      },
    ],

  });


  const parsedContent = JSON.parse(response.output_text);

  const pois: Poi[] = parsedContent.items.map((item: PoiLLM, index: number) => ({
    ...item,
    id: `poi-${new Date().getTime().toString()}-${index}`,
    owner: {
      avatarUrl: "https://picsum.photos/id/71/200/200",
      name: "Lucas Oliveira",
    },
    keywords: []
  })); 

  return {
    items: pois,
    //items: [],
  };

}
