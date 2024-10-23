import { getNeo4jSession } from "./neo4j";

export async function getAllowedKeywords(
  state: string,
  location?: string,
  locationType?: string
): Promise<string[]> {
  const session = getNeo4jSession();

  try {
    let query = `
        MATCH (ga:geo_area {name: $state, type: 'state'})<-[:IS_IN]-(l:Experience {state: $state, ${locationType}: $location} )<-[:MATCHES]-(i:Interest)
        RETURN DISTINCT i.name AS keyword
    `;

    const result = await session.run(query, { state, location });

    // Map the result to an array of keywords
    const keywords = result.records.map((record) => record.get("keyword"));
    return keywords;
  } catch (error) {
    console.error("Error querying Neo4j for keywords:", error);
    throw new Error("Failed to fetch allowed keywords from Neo4j.");
  } finally {
    await session.close();
  }
}
