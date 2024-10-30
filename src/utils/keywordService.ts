import { getNeo4jSession } from "./neo4j";

export async function getAllowedKeywords(
  state: string,
  location?: string,
  locationType?: string,
  currentKeywords?: string
): Promise<string[]> {
  const session = getNeo4jSession();

  let query = "";
  const queryParams: Record<string, any> = { state };

  // Convert currentKeywords string to an array if it's provided
  const lowerCasedKeywordsArray = currentKeywords
    ? currentKeywords.split(",").map((keyword) => keyword.trim().toLowerCase())
    : undefined;

  if (location) {
    queryParams.location = location;

    if (locationType) {
      queryParams.locationType = locationType.toLowerCase();

      query = `
        MATCH (ga:geo_area {name: $state, type: 'state'})<-[:IS_IN]-(l:Experience)
        WHERE toLower(l[$locationType]) = toLower($location)
        MATCH (l)<-[:MATCHES]-(i:Interest)
        ${
          lowerCasedKeywordsArray && lowerCasedKeywordsArray.length > 0
            ? `WHERE NOT i.name IN $currentKeywords`
            : ""
        }
        RETURN DISTINCT i.name AS keyword
      `;
    } else {
      query = `
        MATCH (ga:geo_area {name: $state, type: 'state'})<-[:IS_IN]-(l:Experience {state: $state, city: $location})
        MATCH (l)<-[:MATCHES]-(i:Interest)
        ${
          lowerCasedKeywordsArray && lowerCasedKeywordsArray.length > 0
            ? `WHERE NOT i.name IN $currentKeywords`
            : ""
        }
        RETURN DISTINCT i.name AS keyword
      `;
    }

    if (lowerCasedKeywordsArray && lowerCasedKeywordsArray.length > 0) {
      queryParams.currentKeywords = lowerCasedKeywordsArray;
    }
  } else if (lowerCasedKeywordsArray && lowerCasedKeywordsArray.length > 0) {
    queryParams.currentKeywords = lowerCasedKeywordsArray;

    query = `
      MATCH (target:Interest)-[:MATCHES]->()<-[:MATCHES]-(related:Interest)
      WHERE (target.name IN $currentKeywords) AND (NOT related.name IN $currentKeywords)
      WITH related.name AS relatedKeyword, COUNT(*) AS relationStrength
      ORDER BY relationStrength DESC
      LIMIT 20
      RETURN relatedKeyword AS keyword
    `;
  } else {
    query = `
      MATCH (i:Interest)
      RETURN i.name AS keyword
      LIMIT 20
    `;
  }

  try {
    const result = await session.run(query, queryParams);

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
