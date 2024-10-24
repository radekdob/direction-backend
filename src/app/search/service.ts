import { getNeo4jSession } from "../../utils/neo4j";
import { extractKeywordsFromUserInput } from "../../utils/openai";
import type { ItemEntryResponse, SearchParams } from "./types";

export async function getLocationsByParams(
  params: SearchParams
): Promise<ItemEntryResponse[]> {
  const {
    state,
    location = "",
    locationType = "",
    nodeTypes = [],
    keywords = [],
    userInput = "",
  } = params;

  const session = getNeo4jSession();

  try {
    // Initialize final keywords, merging keywords from user input if provided
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

    // Parameters object for the query
    const queryParams: Record<string, any> = { state };

    if (finalKeywords.length > 0) {
      queryParams.keywords = finalKeywords;
    }

    let query: string;

    query = `
          MATCH (g:geo_area {name: 'Alaska', type: 'state'})<-[:IS_IN]-(l)
          MATCH (l)<-[:MATCHES]-(k:Interest)
          WHERE k.name IN ['hiking', 'outdoor'] 
          AND l.city = 'Anchorage'
          RETURN DISTINCT l
    `;

    // If location is provided, include location and locationType in the query
    if (location && locationType) {
      queryParams.location = location;
      queryParams.locationType = locationType;
      query = `
        MATCH (ga:geo_area {name: $state, type: 'state'})<-[:IS_IN]-(l:Experience {state: $state, ${locationType}: $location})
      `;

      if (finalKeywords.length > 0) {
        query += `
          <-[:MATCHES]-(i:Interest)
          WHERE i.name IN $keywords
        `;
      }

      query += `
        RETURN DISTINCT l, labels(l) AS nodeTypes
      `;
    } else {
      // If location is not provided, query without location and locationType
      query = `
        MATCH (ga:geo_area {name: $state, type: 'state'})<-[:IS_IN]-(l:Experience {state: $state})
      `;

      if (finalKeywords.length > 0) {
        query += `
          <-[:MATCHES]-(i:Interest)
          WHERE i.name IN $keywords
        `;
      }

      query += `
        RETURN DISTINCT l, labels(l) AS nodeTypes
      `;
    }

    if (nodeTypes.length > 0) {
      query += `
        AND ANY(nt IN $nodeTypes WHERE nt IN labels(l))
      `;
      queryParams.nodeTypes = nodeTypes;
    }

    const result = await session.run(query, queryParams);

    // Transform results into the ItemEntry format for both Experience and Attraction
    const items: ItemEntryResponse[] = result.records.map((record) => {
      const locationNode = record.get("l").properties;
      const nodeTypesFromResult = record.get("nodeTypes"); // Get the labels from the query result

      return {
        title: locationNode.name, // 'name' maps to 'title'
        url:
          locationNode.web_url ||
          `https://maps.google.com/?q=${locationNode.lat},${locationNode.lng}`, // If no web_url, create a Google Maps link
        image: locationNode.image || "", // Use an empty string if image is missing
        markers: [{ lat: locationNode.lat, lng: locationNode.lng }], // Use lat/lng for map markers
        nodeTypes:
          nodeTypesFromResult.length > 0 ? nodeTypesFromResult : undefined, // Include nodeTypes from query result
        keywords: finalKeywords.length > 0 ? finalKeywords : undefined, // Include keywords if provided
      };
    });

    return items;
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
