import type { FastifyInstance } from "fastify";
import { getAllowedKeywords } from "./keywordService";

// Define the structure of query parameters
interface KeywordQueryParams {
  location: string;
  locationType: string;
}

// keywordRoutes.ts
export default async function keywordRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: KeywordQueryParams }>(
    "/",
    async (request, reply) => {
      const { location, locationType } = request.query;

      try {
        const keywords = await getAllowedKeywords(location, locationType);
        reply.send({ keywords });
      } catch (error) {
        request.log.error({ err: error }, "Failed to fetch keywords");
        reply.status(500).send({ error: "Failed to fetch keywords" });
      }
    }
  );
}
