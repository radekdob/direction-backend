// search/routes.ts
import type { FastifyInstance } from "fastify";
import { searchLocationsByParams } from "./controller";

export default async function searchRoutes(fastify: FastifyInstance) {
  fastify.post("", {
    schema: {
      description:
        "Search for locations based on location, node types, keywords, and user input",
      body: {
        type: "object",
        properties: {
          location: { type: "string" },
          nodeTypes: {
            type: "array",
            items: { type: "string" },
            description: "Types of nodes to filter (e.g., Restaurant, Park)",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Keywords to filter locations",
          },
          userInput: {
            type: "string",
            description: "User input to extract additional keywords",
          },
        },
        required: [], // No required fields since all are optional
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              address: { type: "string" },
              // Add other properties as necessary
            },
          },
        },
      },
    },
    handler: searchLocationsByParams,
  });
}
