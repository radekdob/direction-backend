import { getNeo4jSession } from "../../utils/neo4j";
import { extractKeywordsFromUserInput } from "../../utils/openai";

interface SearchParams {
  location: string;
  locationType: string;
  nodeTypes?: string[];
  keywords?: string[];
  userInput?: string;
}

export async function getLocationsByParams(
  params: SearchParams
): Promise<object[]> {
  const {
    location,
    locationType,
    nodeTypes = [],
    keywords = [],
    userInput = "",
  } = params;
  const session = getNeo4jSession();

  try {
    // Initialize keywords that will be used for filtering
    const finalKeywords = userInput.trim()
      ? Array.from(
          new Set([
            ...keywords,
            ...(await extractKeywordsFromUserInput(
              userInput,
              location,
              locationType
            )),
          ])
        )
      : keywords;

    // Build the base query
    let query = "MATCH (l:Location)";

    // Parameters object for the query
    const queryParams: Record<string, any> = {};

    // Filter by location if provided
    if (location) {
      query += `
        MATCH (g:geo_area {name: $location, type: $locationType})<-[:IS_IN]-(l)
      `;
      queryParams.location = location;
      queryParams.locationType = locationType;
    }

    // Filter by nodeTypes if provided
    if (nodeTypes.length > 0) {
      query += `
        WHERE ANY(nt IN $nodeTypes WHERE nt IN labels(l))
      `;
      queryParams.nodeTypes = nodeTypes;
    }

    // Filter by keywords if provided
    if (finalKeywords.length > 0) {
      query += `
        MATCH (l)<-[:MATCHES]-(k:Keyword)
        WHERE k.name IN $keywords
      `;
      queryParams.keywords = finalKeywords;
    }

    // Complete the query to return distinct locations
    query += `
      RETURN DISTINCT l
    `;

    const result = await session.run(query, queryParams);

    // Extract location properties and return
    return result.records.map((record) => record.get("l").properties);
  } catch (error) {
    console.error(
      `Error querying Neo4j: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw new Error(
      `Failed to retrieve locations from Neo4j: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    await session.close();
  }
}
