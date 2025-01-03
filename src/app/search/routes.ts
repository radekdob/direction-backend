// search/routes.ts
import type { FastifyInstance } from "fastify";
import { searchLocationsByParams } from "./controller";

export default async function searchRoutes(fastify: FastifyInstance) {
  fastify.post("", {
    schema: {
      description:
        "Search for locations based on state, location, locationType, node types, keywords, and user input",
      body: {
        type: "object",
        properties: {
          state: {
            type: "string",
            description: "The state to filter locations (e.g., 'California')",
          },
          location: {
            type: "string",
            description: "The location name (e.g., 'Los Angeles')",
          },
          locationType: {
            type: "string",
            description: "The type of the location (e.g., 'city', 'county')",
          },
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
        required: ["state"], // State is required, others are optional
      },
      response: {
        200: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              city: { type: "string" },
              description: { type: "string", nullable: true },
              title: { type: "string" },
              url: { type: "string" },
              image: { type: "string", nullable: true },
              nodeTypes: {
                type: "array",
                items: { type: "string" },
                nullable: true,
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                nullable: true,
              },
              markers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    lat: { type: "number" },
                    lng: { type: "number" },
                  },
                },
                nullable: true
              },
              owner: {
                type: "object",
                properties: {
                  avatarUrl: { type: "string" },
                  name: { type: "string" }
                }
              }
            },
          },
        },
      },
    },
    handler: searchLocationsByParams,
  });
}
