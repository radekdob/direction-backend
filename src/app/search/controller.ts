// src/app/search/controller.ts
import { FastifyReply, FastifyRequest } from "fastify";
import { searchBlogsAndHotels } from "./service";
import { SEARCH_CONSTANTS } from "./constants";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class SearchController {
  static searchByKeywords = async (
    req: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const { keywords } = req.query as { keywords: string };

      if (!keywords || keywords.trim() === "") {
        return reply
          .status(400)
          .send({ error: SEARCH_CONSTANTS.INVALID_KEYWORDS });
      }

      // Split the keywords string by comma and search for each keyword
      const results = await searchBlogsAndHotels(
        keywords.split(",").map((kw) => kw.trim())
      );

      // Return the results or a no results message
      if (results.blogs.length === 0 && results.hotels.length === 0) {
        return reply.status(404).send({ message: SEARCH_CONSTANTS.NO_RESULTS });
      }

      reply.send({ blogs: results.blogs, hotels: results.hotels });
    } catch (error) {
      // Type assertion to treat error as an instance of Error
      const err = error as Error;
      reply.status(500).send({ error: err.message || "Internal server error" });
    }
  };
}

export default SearchController;
