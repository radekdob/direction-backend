import { FastifyInstance } from "fastify";
import SearchController from "./controller";
import { searchSchema } from "./schemas";

const searchRoutes = async (app: FastifyInstance) => {
  app.route({
    method: "GET",
    url: "/search",
    schema: searchSchema,
    handler: SearchController.searchByKeywords,
  });
};

export default searchRoutes;
