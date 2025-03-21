import axios, { AxiosError } from "axios";
import { getAllowedKeywords } from "./keywordService";
import { PoiSearchResponse, PoiLLM, Poi, PoiSearchParams, PoiType } from "../app/search/types-v2";
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
  const cacheEntry = searchCache.get(queryInput + keywords.join(",") + locations.join(","));
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
      content: `User input:\n """${queryInput}"""`,
    },
    {
      role: "assistant",
      content: `From the user input:\n ` +
        "Step 1: Extract the keywords.\n" +
        "Step 2: Suggest suggestedKeywords based on the keywords\n" +
        "Step 3: Extract locations\n" +

        "Example output: User input: ###I want to visit a tropical beach in Europe###: \n{\n  \"keywords\": [\"tropical beaches\", \"historic cities\", \"kids activities\"],\n  \"locations\": [\"Europe\"],\n  \"suggestedKeywords\": [\"beaches\", \"tropical\", \"historic sites\", \"family-friendly\", \"kids' activities\"]\n}\n" +
        "Example output: User input: ###I want to visit a tropical beach###: \n{\n  \"keywords\": [\"tropical beaches\", \"historic cities\", \"kids activities\"],\n  \"locations\": [],\n  \"suggestedKeywords\": [\"beaches\", \"tropical\", \"historic sites\", \"family-friendly\", \"kids' activities\"]\n}\n"
    },
    {
      role: "assistant",
      content: `Using extracted keywords and locations, suggest a list of travel attractions or experiences or cruises or hotels or food&drink.`
    },
  ];

  const followupSearchInput: ResponseInput = [
    {
      role: 'assistant',
      content:
        `This is a follow up search. From the user input """${queryInput}""" and current keywords """${keywords.join(", ")}""" and locations """${locations.join(", ")}"""\n ` +
        "Step 1: Extract the keywords from the input and add them to the current keywords.\n" +
        "Step 2: Suggest suggestedKeywords based on extracted keywords and current keywords and locations\n" +
        "Step 3: Using extracted keywords and current keywords and locations, suggest a list of travel attractions or experiences or cruises or hotels or food&drink.\n"
      //`Return locations as current locations values. (e.g. Anywhere, Europe), don't cut any value from original input.\n` + }
    }
  ];

  const searchType = queryInput && (!keywords.length && !locations.length) ? 'initial' : 'followup';

  const input: ResponseInput = searchType === 'initial' ? initialSearchInput : followupSearchInput;


  const response = await client.responses.create({
    model: "gpt-4o-mini",
    tools: [{
      type: "web_search_preview",
      search_context_size: "high",
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
            locations: {
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
                  itemType: {
                    type: "string",
                    enum: ["experience", "attraction", "cruise", "hotel", "food&drink"]
                  },
                  url: {
                    type: "string"
                  }
                },
                required: ["name", "lng", "lat", "description", "url", "itemType"],
                additionalProperties: false
              }
            },
          },
          required: ["items", "keywords", "suggestedKeywords", "locations"],
          additionalProperties: false
        }
      }
    },
    input,
    instructions:
      "You are a travel expert specialized in suggesting travel experiences, attractions, cruises, hotels, food&drink. You are unique because unlike other travel search engines you provide a list of travel experiences, attractions, cruises, hotels, food&drink instead of plain locations.\n" +
      "Suggest at least 20 items. It can be less only when there are not enough items to suggest.\n" +


      "Travel experience - An activity a traveler participates in at a location. The engagement or action, rather than just seeing a place.\n" +
      "Example of travel experience: 'Wine tasting in Tuscany ' or 'Hot air balloon ride over Cappadocia' or 'Cooking class in Bangkok'.\n" +

      "Travel attraction - A physical location or site that people visit. The place itself, not what visitors do there.\n" +
      "Example of travel attraction: 'Eiffel Tower' or 'Great Wall' or 'Machu Picchu'.\n" +

      "Cruise - A travel experience that involves a journey on a ship, typically offering multiple destinations, onboard entertainment, and scenic views. It is an activity rather than a single location.\n" +
      "Example of cruise: 'Mediterranean cruise' or 'Alaskan glacier cruise' or 'Caribbean island-hopping cruise'.\n" +

      "Hotel - A place that provides accommodation for travelers, often with additional amenities such as restaurants, pools, or spas. It is a location rather than an activity.\n" +
      "Example of hotel: 'Burj Al Arab' or 'The Ritz Paris' or 'Marina Bay Sands'.\n" +

      "Food & Drink - Places where travelers can eat or drink, including restaurants, cafes, bars, and street food stalls. It refers to locations offering food and beverages rather than specific culinary experiences.\n" +
      "Example of food & drink: 'Nobu Restaurant' or 'Café de Flore' or 'Hofbräuhaus Munich'.\n" +

      "Locations are a geophraphical location. Can be continent, country, city. Example locations: 'Europe', 'Poland', 'Paris', 'Alps'.\n"
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
  const poiTypes: PoiType[] = [...new Set(parsedContent.items.map((item: PoiLLM) => item.itemType) as PoiType[])];

  console.log(response.output_text);
  const result: PoiSearchResponse = {
    items: pois,
    keywords: parsedContent.keywords as string[],
    suggestedKeywords,
    locations: parsedContent.locations as string[],
    type: searchType,
    poiTypes
  };

  // Store in cache
  searchCache.set(queryInput, {
    timestamp: Date.now(),
    data: result
  });

  return result;

}
