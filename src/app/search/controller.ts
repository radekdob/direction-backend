// search/controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { getLocationsByParams } from "./service";
import type { SearchParams, ItemEntryResponse } from "./types";

interface SearchRequestBody {
  state: string; // State is required
  location?: string; // Location is optional
  locationType?: string; // LocationType is optional
  nodeTypes?: string[]; // Optional node types
  keywords?: string[]; // Optional keywords
  userInput?: string; // Optional user input
}

export async function searchLocationsByParams(
  req: FastifyRequest<{ Body: SearchParams }>,
  reply: FastifyReply
) {
  const { state, location, locationType, nodeTypes, keywords, userInput } =
    req.body;

  try {
    // Call getLocationsByParams with the state and other parameters
    const locations: ItemEntryResponse[] = await getLocationsByParams({
      state,
      location: location || "", // Default to empty string if not provided
      locationType: locationType || "", // Default to empty string if not provided
      nodeTypes: nodeTypes || [], // Default to empty array if not provided
      keywords: keywords || [], // Default to empty array if not provided
      userInput: userInput || "", // Default to empty string if not provided
    });

    // Send the response with the retrieved locations in the format of ItemEntry[]
    reply.send(locations);
  } catch (error) {
    if (error instanceof Error) {
      req.log.error({ err: error }, "Error in searchLocationsByParams");
      reply.status(500).send({ error: error.message });
    } else {
      req.log.error({ err: error }, "Unknown error in searchLocationsByParams");
      reply.status(500).send({ error: "An unknown error occurred." });
    }
  }
}
