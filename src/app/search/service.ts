import { getNeo4jSession } from "../../utils/neo4j";
import { extractKeywordsFromUserInput } from "../../utils/openai";
import { createPlaceId } from "../../utils/place_id";
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
      console.log(record)
      const locationNode = record.get("l").properties;
      const locationId = record.get("l").elementId;
      const nodeTypesFromResult = record.get("nodeTypes"); // Get the labels from the query result
      
      const descLength = Math.floor(Math.random() * (300 - 30 + 1)) + 30;
      const titleLength = Math.floor(Math.random() * (100 - 30 + 1)) + 30;
      const randomDesc = `[Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum non dolor et tellus mollis tincidunt. Quisque lacinia lorem nec tortor ullamcorper dictum. Etiam commodo pretium viverra. Duis accumsan lacus et lectus pellentesque, eu commodo risus finibus. Nullam at ante magna. Duis eu nulla tempor urna tincidunt mattis at in ipsum. Maecenas ultrices faucibus lorem, vel vulputate nulla vulputate sed. Nunc at dui eros.`.slice(0, descLength);
      const randomTitle = 'Spectacular Alaska Adventure with Amazing Views and Activities'.slice(0, titleLength);
  
      return {
       /*  id: createPlaceId({
          title: locationNode.name || randomTitle,
          lat: locationNode.lat,
          lng: locationNode.lng
        }), */
        id: locationId,
        city: locationNode.city || 'city',
        title: locationNode.name || randomTitle, // 'name' maps to 'title',
        description: randomDesc,

        owner:{
          avatarUrl: `https://picsum.photos/${200 + Math.floor(Math.random() * 50)}/${150 + Math.floor(Math.random() * 50)}`,
          name: 'Visit Anchorage'
        },
        url:
          locationNode.web_url ||
          `https://maps.google.com/?q=${locationNode.lat},${locationNode.lng}`, // If no web_url, create a Google Maps link
        image: locationNode.image || `https://picsum.photos/${800 + Math.floor(Math.random() * 200)}/${600 + Math.floor(Math.random() * 200)}`, // Use an empty string if image is missing
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

export async function getLocationById(id: string): Promise<ItemEntryResponse | null> {
  const session = getNeo4jSession();

  try {
    const query = `
      MATCH (l)
      WHERE elementId(l) = $id
      RETURN l, labels(l) AS nodeTypes
    `;

    const result = await session.run(query, { id });

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const locationNode = record.get("l").properties;
    const locationId = record.get("l").elementId;
    const nodeTypesFromResult = record.get("nodeTypes");

    const descLength = Math.floor(Math.random() * (300 - 30 + 1)) + 30;
    const titleLength = Math.floor(Math.random() * (100 - 30 + 1)) + 30;
    const randomDesc = `Lorem ipsum dolor sit amet...`.slice(0, descLength);
    const randomTitle = 'Spectacular Alaska Adventure with Amazing Views and Activities'.slice(0, titleLength);

    return {
      id: locationId,
      city: locationNode.city || 'city',
      title: locationNode.name || randomTitle,
      description: randomDesc,
      owner: {
        avatarUrl: `https://picsum.photos/${200 + Math.floor(Math.random() * 50)}/${150 + Math.floor(Math.random() * 50)}`,
        name: 'Visit Anchorage'
      },
      url: locationNode.web_url || `https://maps.google.com/?q=${locationNode.lat},${locationNode.lng}`,
      image: locationNode.image || `https://picsum.photos/${800 + Math.floor(Math.random() * 200)}/${600 + Math.floor(Math.random() * 200)}`,
      markers: [{ lat: locationNode.lat, lng: locationNode.lng }],
      nodeTypes: nodeTypesFromResult?.length > 0 ? nodeTypesFromResult : undefined,
      keywords: undefined
    };
  } catch (error) {
    console.error(`Error querying Neo4j: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw new Error(`Failed to retrieve location from Neo4j: ${error instanceof Error ? error.message : "Unknown error"}`);
  } finally {
    await session.close();
  }
}
