import { FastifyInstance } from "fastify";
import { getAllowedKeywords } from "./keywordService";

export default async function keywordRoutes(fastify: FastifyInstance) {
  fastify.get("", async (request, reply) => {
    try {
      const keywords = await getAllowedKeywords("Anchorage");
      reply.send({ keywords });
    } catch (error) {
      reply.status(500).send({ error: "Failed to fetch keywords" });
    }
  });
}
