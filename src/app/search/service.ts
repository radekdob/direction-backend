// search/service.ts
import { getNeo4jSession } from "../../utils/neo4j";
import { extractKeywordsFromUserInput } from "../../utils/openai";

interface SearchParams {
  location?: string;
  nodeTypes?: string[];
  keywords?: string[];
  userInput?: string;
}

export async function getLocationsByParams(
  location?: string,
  nodeTypes: string[] = [],
  keywords: string[] = [],
  userInput: string = ""
): Promise<object[]> {
  const session = getNeo4jSession();

  try {
    // If userInput is provided, extract additional keywords using OpenAI
    if (userInput.trim() !== "") {
      const extractedKeywords = await extractKeywordsFromUserInput(userInput);
      // Merge and deduplicate keywords from frontend and OpenAI
      keywords = Array.from(new Set([...keywords, ...extractedKeywords]));
    }

    // Start building the Cypher query
    let query = `
      MATCH (l:Location)
    `;

    // Parameters object for the query
    const params: Record<string, any> = {};

    // Filter by location if provided
    if (location && location.trim() !== "") {
      query += `
        MATCH (g:geo_area {name: $location})<-[:IS_IN]-(l)
      `;
      params.location = location;
    }

    // Filter by nodeTypes if provided
    if (nodeTypes.length > 0) {
      query += `
        WHERE ANY(nt IN $nodeTypes WHERE nt IN labels(l))
      `;
      params.nodeTypes = nodeTypes;
    }

    // Filter by keywords if provided
    if (keywords.length > 0) {
      query += `
        MATCH (l)<-[:MATCHES]-(k:Keyword)
        WHERE k.name IN $keywords
      `;
      params.keywords = keywords;
    }

    // Return distinct locations
    query += `
      RETURN DISTINCT l
    `;

    const result = await session.run(query, params);

    const locations = result.records.map(
      (record) => record.get("l").properties
    );
    return locations;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error querying Neo4j: ${error.message}`);
      throw new Error(
        `Failed to retrieve locations from Neo4j: ${error.message}`
      );
    } else {
      console.error("An unknown error occurred while querying Neo4j.");
      throw new Error(
        "Failed to retrieve locations from Neo4j due to an unknown error."
      );
    }
  } finally {
    await session.close();
  }
}
