// search/controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { getLocationsByParams } from "./service";

interface SearchRequestBody {
  location: string;
  locationType: string;
  nodeTypes?: string[];
  keywords?: string[];
  userInput?: string;
}

export async function searchLocationsByParams(
  req: FastifyRequest<{ Body: SearchRequestBody }>,
  reply: FastifyReply
) {
  const { location, locationType, nodeTypes, keywords, userInput } = req.body;

  try {
    // Pass a single object containing the parameters
    const locations = await getLocationsByParams({
      location,
      locationType,
      nodeTypes: nodeTypes || [],
      keywords: keywords || [],
      userInput: userInput || "",
    });

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
