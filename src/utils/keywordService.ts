import { getNeo4jSession } from "./neo4j"; // Import the session getter

/**
 * Fetch allowed keywords from Neo4j based on geo_area and matching attributes.
 * @param {string} geoArea - The geo area name to match in the query (e.g., 'Anchorage').
 * @returns {Promise<string[]>} - A promise that resolves to an array of allowed keywords.
 */
export async function getAllowedKeywords(geoArea: string): Promise<string[]> {
  const session = getNeo4jSession(); // Use the session from the initialized driver

  try {
    const result = await session.run(
      `
        MATCH (ga:geo_area {name: $geoArea})<-[:IS_IN]-(l:Location)<-[:MATCHES]-(i:Interest)
        RETURN DISTINCT i.name AS keyword
      `,
      { geoArea }
    );

    // Map the result to an array of keywords
    const keywords = result.records.map((record) => record.get("keyword"));
    return keywords;
  } catch (error) {
    console.error("Error querying Neo4j for keywords:", error);
    throw new Error("Failed to fetch allowed keywords from Neo4j.");
  } finally {
    await session.close(); // Ensure the session is closed after the query
  }
}
