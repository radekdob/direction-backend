import type { FastifyInstance } from "fastify";
import { getAllowedKeywords } from "./keywordService";
import type { FastifyRequest } from "fastify/types/request";
import type { FastifyReply } from "fastify/types/reply";

// Define the structure of query parameters
interface KeywordQueryParams {
  location: string;
  locationType: string;
}

export default async function keywordRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: KeywordQueryParams;
  }>(
    "/keywords",
    async (
      request: FastifyRequest<{ Querystring: KeywordQueryParams }>,
      reply: FastifyReply
    ) => {
      const { location, locationType } = request.query;

      try {
        // Use the dynamic location and locationType passed from the query params
        const keywords = await getAllowedKeywords(location, locationType);
        reply.send({ keywords });
      } catch (error) {
        request.log.error({ err: error }, "Failed to fetch keywords");
        reply.status(500).send({ error: "Failed to fetch keywords" });
      }
    }
  );
}
