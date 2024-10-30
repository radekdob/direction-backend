import { getNeo4jSession } from "../../utils/neo4j";
import { extractKeywordsFromUserInput } from "../../utils/openai";
import type { ItemEntryResponse, SearchParams } from "./types";

// Note for future: location and locationType are not used as decision made by user

export async function getLocationsByParams(
  params: SearchParams
): Promise<ItemEntryResponse[]> {
  const {
    state,
    location,
    locationType,
    nodeTypes,
    keywords = [],
    userInput = "",
  } = params;

  const session = getNeo4jSession();

  try {
    // Initialize final keywords, merging keywords from user input if provided
    const finalKeywords = (
      userInput.trim()
        ? Array.from(
            new Set([
              ...keywords,
              ...(await extractKeywordsFromUserInput(userInput, state)),
            ])
          )
        : keywords
    ).map((keyword) => keyword.toLowerCase());

    const query = `
      MATCH (g:geo_area {name: $state, type: 'state'})<-[:IS_IN]-(l)
      MATCH (l)<-[:MATCHES]-(k:Interest)
      WHERE k.name IN  $keywords
      RETURN DISTINCT l, labels(l) AS nodeTypes
    `;
    console.log(finalKeywords);
    const result = await session.run(query, {
      state,
      keywords: finalKeywords,
    });

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
          nodeTypesFromResult && nodeTypesFromResult.length > 0
            ? nodeTypesFromResult
            : undefined, // Include nodeTypes from query result
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
