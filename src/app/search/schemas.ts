// src/app/search/schemas.ts
export const searchSchema = {
  querystring: {
    type: "object",
    properties: {
      keywords: { type: "string" },
    },
    required: ["keywords"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        blogs: { type: "array", items: { type: "object" } },
        hotels: { type: "array", items: { type: "object" } },
      },
    },
    400: { type: "object", properties: { error: { type: "string" } } },
    404: { type: "object", properties: { message: { type: "string" } } },
  },
};
