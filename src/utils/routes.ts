import { FastifyInstance } from "fastify";
import { getAllowedKeywords } from "./keywordService";
import { getVersion } from "./version";

// Define the structure of query parameters
interface KeywordQueryParams {
  state: string;
  location?: string;
  locationType?: string;
}

export default async function utilRoutes(fastify: FastifyInstance) {
  // Register the keywords route
  fastify.get<{ Querystring: KeywordQueryParams }>(
    "/keywords",
    {
      schema: {
        description:
          "Get allowed keywords based on state and optional location",
        tags: ["Keywords"],
        querystring: {
          type: "object",
          required: ["state"],
          properties: {
            state: { type: "string" },
            location: { type: "string" },
            locationType: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              keywords: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { state, location, locationType } = request.query;

      try {
        const keywords = await getAllowedKeywords(
          state,
          location,
          locationType
        );
        reply.send({ keywords });
      } catch (error) {
        request.log.error({ err: error }, "Failed to fetch keywords");
        reply.status(500).send({ error: "Failed to fetch keywords" });
      }
    }
  );

  // Register the version route
  fastify.get(
    "/version",
    {
      schema: {
        description: "Get the API version",
        tags: ["Root"],
        response: {
          200: {
            type: "object",
            properties: {
              version: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const version = getVersion();
      reply.send({ version });
    }
  );
}
