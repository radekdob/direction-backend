import neo4j, { type Driver, type Session } from "neo4j-driver";
import dotenv from "dotenv";

dotenv.config();

let driver: Driver;

export const initNeo4j = () => {
  const uri = process.env.NEO4J_URI || "";
  const user = process.env.NEO4J_USER || "";
  const password = process.env.NEO4J_PASSWORD || "";

  
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    encrypted: "ENCRYPTION_ON", // or "ENCRYPTION_OFF" depending on your server
  });

  console.log("Connected to Neo4j database.");
};

export const getNeo4jSession = (): Session => {
  if (!driver) throw new Error("Neo4j driver is not initialized.");
  return driver.session();
};

export const closeNeo4j = async () => {
  await driver.close();
};
