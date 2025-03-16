import axios, { AxiosError } from "axios";
import { getAllowedKeywords } from "./keywordService";
import { PoiSearchResponse, PoiLLM, Poi, PoiSearchParams } from "../app/search/types-v2";
import OpenAI from "openai";
import { tavily } from "@tavily/core";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { fetchUnsplashImages } from "./unsplash";
import { fetchPixabayImages } from "./pixabay";
import { ResponseInput } from "openai/resources/responses/responses";

// Cache interface and initialization
interface CacheEntry {
  timestamp: number;
  data: PoiSearchResponse;
}

const CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1 hour
const searchCache = new Map<string, CacheEntry>();

// Cache cleanup function
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_EXPIRY_MS) {
      searchCache.delete(key);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupCache, CACHE_EXPIRY_MS);

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
  { queryInput, keywords, locations }: PoiSearchParams,
): Promise<PoiSearchResponse> {
  // Check cache first
  const cacheEntry = searchCache.get(queryInput);
  if (cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_EXPIRY_MS) {
    return cacheEntry.data;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is not set in environment variables.");
  }

  const client = new OpenAI();

  const initialSearchInput: ResponseInput = [
    {
      role: "user",
      content: queryInput,
    },
    {
      role: "assistant",
      content: `Based on the user input, extract the keywords. Example keywords: "beach", "mountains", "city", "glaciers" etc.` +
        ` Basing on extracted keywords, provide a list of suggested keywords. Example suggested keywords: "beach", "mountains", "city", "glaciers" etc.`
    },
    {
      role: "assistant",
      //content: `Based on the user input, provide a list of places to visit.`
      content: `Based on the extracted keywords, provide a list of places to visit.`
    },
  ];

  const followupSearchInput: ResponseInput = [
    {
      role: "user",
      content: `User input: "${queryInput}" ` +
        `Current keywords: ${keywords.join(", ")} ` +
        `Current locations: ${locations.join(", ")} `,
    },
    {
      role: "assistant",
      content: `This is a follow up search. Based on the user input and current keywords and locations, extract the keywords from the user input and add them to the current keywords.` +
        `Example keywords: "beach", "mountains", "city", "glaciers" etc.` +
        `Basing on extracted keywords and current keywords, provide a list of suggested keywords. Example suggested keywords: "beach", "mountains", "city", "glaciers" etc.`
    },
    {
      role: "assistant",
      content: `Based on the new keyword extracted from the user input and current keywords and locations, provide a list of places to visit.`
    },
  ];

  const searchType = queryInput && (!keywords.length && !locations.length) ? 'initial' : 'followup';

  const input: ResponseInput = searchType === 'initial' ? initialSearchInput : followupSearchInput;

  console.log({
    searchType,
    input,

    query: queryInput,
    keywords: keywords,
    locations: locations,
  });


  const response = await client.responses.create({
    model: "gpt-4o-mini",
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
            keywords: {
              type: "array",
              items: {
                type: "string"
              }
            },
            suggestedKeywords: {
              type: "array",
              items: {
                type: "string"
              }
            },
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

                  url: {
                    type: "string"
                  }
                },
                required: ["name", "lng", "lat", "description", "url"],
                additionalProperties: false
              }
            },
          },
          required: ["items", "keywords", "suggestedKeywords"],
          additionalProperties: false
        }
      }
    },
    input
  });

  const parsedContent = JSON.parse(response.output_text);

  const locationNames = parsedContent.items.map((item: PoiLLM) => item.name);
  //const imagePromises = locationNames.map((name: string) => fetchUnsplashImages(name));
  const imagePromises = locationNames.map((name: string) => fetchPixabayImages(name));

  const images = await Promise.all(imagePromises);

  const pois: Poi[] = parsedContent.items.map((item: PoiLLM, index: number) => ({
    ...item,
    id: `poi-${new Date().getTime().toString()}-${index}`,
    owner: {
      avatarUrl: "https://picsum.photos/id/71/200/200",
      name: "Lucas Oliveira",
    },
    imageUrl: images[index]?.[0]?.webformatURL || '',
    keywords: []
  }));

  const suggestedKeywords: string[] = [...parsedContent.suggestedKeywords as string[], ...parsedContent.keywords as string[]].sort(() => Math.random() - 0.5);


  const result = {
    items: pois,
    keywords: parsedContent.keywords as string[],
    suggestedKeywords,
    locations: [],
  };

  // Store in cache
  searchCache.set(queryInput, {
    timestamp: Date.now(),
    data: result
  });

  return result;
}
