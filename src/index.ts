// index.ts
import Fastify from "fastify";
import dotenv from "dotenv";
import { routes } from "./routes";
import fastifyJWT from "@fastify/jwt";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyCors from "@fastify/cors"; // Added import
import { AuditLogger, ErrorLogger } from "./middlewares/logging";
import { initNeo4j, closeNeo4j } from "./utils/neo4j";
import { prisma } from "./utils/prisma";

dotenv.config();

const fastify = Fastify({
  logger: true,
  ignoreTrailingSlash: true,
});

// Register CORS plugin
fastify.register(fastifyCors, {
  origin: "*", // Adjust as needed
  methods: ["GET", "POST", "OPTIONS"],
});

fastify.register(fastifyJWT, {
  secret: process.env.JWT_SECRET || "supersecret",
});

// Register @fastify/swagger plugin.
fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Fastify Prisma Neo4j API",
      description: "API Documentation for Fastify Prisma Neo4j",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
    tags: [
      {
        name: "Root",
        description: "Root endpoints",
      },
      {
        name: "Graph",
        description: "Neo4j Graph queries",
      },
      {
        name: "Prisma",
        description: "Prisma Database queries",
      },
    ],
  },
});

// Register @fastify/swagger-ui plugin.
fastify.register(fastifySwaggerUI, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

// Middleware for logging every request
fastify.addHook("onRequest", AuditLogger);

// Error handler for logging errors
fastify.setErrorHandler(ErrorLogger);

// Initialize Neo4j on startup
initNeo4j();

// Register routes with '/api' prefix
fastify.register(
  async (fastifyInstance) => {
    for (const [prefix, route] of Object.entries(routes)) {
      fastifyInstance.register(route, { prefix });
    }
  },
  { prefix: "/api" }
);

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 8000 });
    fastify.swagger();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start().then(() => {
  process.on("SIGINT", async () => {
    await closeNeo4j();
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default fastify;
