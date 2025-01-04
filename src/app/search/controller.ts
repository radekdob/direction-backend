// search/controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { getLocationsByParams, getLocationById } from "./service";
import type { SearchParams, ItemEntryResponse } from "./types";

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
      location: location,
      locationType: locationType,
      nodeTypes: nodeTypes,
      keywords: keywords,
      userInput: userInput,
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

export async function findLocationById(
  req: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const location = await getLocationById(id);

    if (!location) {
      reply.status(404).send({ error: "Location not found" });
      return;
    }

    reply.send(location);
  } catch (error) {
    req.log.error({ err: error }, "Error in findLocationById");
    reply.status(500).send({ 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    });
  }
}
