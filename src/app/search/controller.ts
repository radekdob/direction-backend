// search/controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { getLocationsByParams } from "./service";

interface SearchRequestBody {
  location?: string;
  nodeTypes?: string[];
  keywords?: string[];
  userInput?: string;
}

export async function searchLocationsByParams(
  req: FastifyRequest<{ Body: SearchRequestBody }>,
  reply: FastifyReply
) {
  const { location, nodeTypes, keywords, userInput } = req.body;

  try {
    const locations = await getLocationsByParams(
      location,
      nodeTypes || [],
      keywords || [],
      userInput || ""
    );
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
