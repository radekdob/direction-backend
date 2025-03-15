// search/controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { getLocationsByParams, getLocationById, getPoiByParams } from "./service";
import { type SearchParams, type ItemEntryResponse, NodeTypeEnum } from "./types";
import { PoiSearchParams, PoiSearchResponse } from "./types-v2";

/* export async function searchLocationsByParams(
  req: FastifyRequest<{ Body: SearchParams }>,
  reply: FastifyReply
) {
  const { state, location, locationType, nodeTypes, keywords, userInput } =
    req.body;

  try {
    // Call getLocationsByParams with the state and other parameters
    const locations: ItemEntryResponse[] = await getLocationsByParams({
      state,
      location: location,
      locationType: locationType,
      nodeTypes: nodeTypes,
      keywords: keywords,
      userInput: userInput,
    });

    // Send the response with the retrieved locations in the format of ItemEntry[]

    //  const mockedItemEntries: ItemEntryResponse[] = [
    //   {
    //     id: "1",
    //     city: "Paris",
    //     title: "Eiffel Tower Tour",
    //     description: "Experience the iconic symbol of Paris with stunning city views",
    //     url: "https://example.com/eiffel-tower",
    //     image: "https://picsum.photos/id/1018/800/600",
    //     nodeTypes: [NodeTypeEnum.ATTRACTION, NodeTypeEnum.ACTIVITY],
    //     keywords: ["landmark", "Paris", "tour"],
    //     markers: [{ lat: 48.8584, lng: 2.2945 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/64/200/200",
    //       name: "Alice Dupont",
    //     },
    //   },
    //   {
    //     id: "2",
    //     city: "Rome",
    //     title: "Colosseum Experience",
    //     description: "Step back in time at Rome's most famous ancient amphitheater",
    //     url: "https://example.com/colosseum",
    //     image: "https://picsum.photos/id/1019/800/600",
    //     nodeTypes: [NodeTypeEnum.ATTRACTION],
    //     keywords: ["history", "Rome", "gladiators"],
    //     markers: [{ lat: 41.8902, lng: 12.4922 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/65/200/200",
    //       name: "Marco Rossi",
    //     },
    //   },
    //   {
    //     id: "3",
    //     city: "New York",
    //     title: "Statue of Liberty Cruise",
    //     url: "https://example.com/statue-liberty",
    //     image: "https://picsum.photos/id/1020/800/600",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY, NodeTypeEnum.ATTRACTION],
    //     keywords: ["USA", "freedom", "monument"],
    //     markers: [{ lat: 40.6892, lng: -74.0445 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/66/200/200",
    //       name: "John Smith",
    //     },
    //   },
    //   {
    //     id: "4",
    //     city: "Tokyo",
    //     title: "Shinjuku Nightlife Tour",
    //     description: "Explore the vibrant nightlife district of Tokyo",
    //     url: "https://example.com/shinjuku",
    //     image: "https://picsum.photos/id/1021/800/600",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY, NodeTypeEnum.EVENT],
    //     keywords: ["Tokyo", "nightlife", "bars"],
    //     markers: [{ lat: 35.6938, lng: 139.7034 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/67/200/200",
    //       name: "Hana Tanaka",
    //     },
    //   },
    //   {
    //     id: "5",
    //     city: "Barcelona",
    //     title: "Sagrada Familia Tour",
    //     url: "https://example.com/sagrada-familia",
    //     image: "https://picsum.photos/id/1022/800/600",
    //     nodeTypes: [NodeTypeEnum.ATTRACTION],
    //     keywords: ["Gaudi", "architecture", "Barcelona"],
    //     markers: [{ lat: 41.4036, lng: 2.1744 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/68/200/200",
    //       name: "Carlos Fernandez",
    //     },
    //   },
    //   {
    //     id: "6",
    //     city: "Cairo",
    //     title: "Pyramids of Giza",
    //     url: "https://example.com/pyramids",
    //     image: "https://picsum.photos/id/1023/800/600",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY],
    //     keywords: ["Egypt", "ancient", "wonder"],
    //     markers: [{ lat: 29.9792, lng: 31.1342 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/69/200/200",
    //       name: "Amira Hassan",
    //     },
    //   },
    //   {
    //     id: "7",
    //     city: "Sydney",
    //     title: "Sydney Opera House",
    //     url: "https://example.com/opera-house",
    //     image: "https://picsum.photos/id/1024/800/600",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY],
    //     keywords: ["Australia", "icon", "sydney"],
    //     markers: [{ lat: -33.8568, lng: 151.2153 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/70/200/200",
    //       name: "Liam O'Brien",
    //     },
    //   },
    //   {
    //     id: "8",
    //     city: "Amsterdam",
    //     title: "Canal Cruise",
    //     url: "https://example.com/canal-cruise",
    //     image: "https://example.com/images/canal.jpg",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY],
    //     keywords: ["Netherlands", "boats", "water"],
    //     markers: [{ lat: 52.3702, lng: 4.8952 }],
    //     owner: {
    //       avatarUrl: "https://example.com/avatars/user8.jpg",
    //       name: "Sophie de Vries",
    //     },
    //   },
    //   {
    //     id: "9",
    //     city: "Rio de Janeiro",
    //     title: "Christ the Redeemer Visit",
    //     url: "https://example.com/christ-redeemer",
    //     image: "https://example.com/images/christ.jpg",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY],
    //     keywords: ["Brazil", "statue", "view"],
    //     markers: [{ lat: -22.9519, lng: -43.2105 }],
    //     owner: {
    //       avatarUrl: "https://example.com/avatars/user9.jpg",
    //       name: "Lucas Oliveira",
    //     },
    //   },
    //   {
    //     id: "10",
    //     city: "London",
    //     title: "Thames River Sightseeing",
    //     url: "https://example.com/thames-cruise",
    //     image: "https://example.com/images/thames.jpg",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY],
    //     keywords: ["UK", "river", "London"],
    //     markers: [{ lat: 51.5074, lng: -0.1278 }],
    //     owner: {
    //       avatarUrl: "https://example.com/avatars/user10.jpg",
    //       name: "Emily Watson",
    //     },
    //   },
    // ];
    // reply.send(mockedItemEntries);
     reply.send(locations);
  } catch (error) {
    if (error instanceof Error) {
      req.log.error({ err: error }, "Error in searchLocationsByParams");
      reply.status(500).send({ error: error.message });
    } else {
      req.log.error({ err: error }, "Unknown error in searchLocationsByParams");
      reply.status(500).send({ error: "An unknown error occurred." });
    }
  }
}
 */

export async function searchPoiByParams(
  req: FastifyRequest<{ Body: PoiSearchParams }>,
  reply: FastifyReply
) {
  const { queryInput } =
    req.body;

  try {
    // Call getLocationsByParams with the state and other parameters
    const locations: PoiSearchResponse = await getPoiByParams({
      queryInput: queryInput,
    });

    //   {
    //     id: "1",
    //     city: "Paris",
    //     title: "Eiffel Tower Tour",
    //     description: "Experience the iconic symbol of Paris with stunning city views",
    //     url: "https://example.com/eiffel-tower",
    //     image: "https://picsum.photos/id/1018/800/600",
    //     nodeTypes: [NodeTypeEnum.ATTRACTION, NodeTypeEnum.ACTIVITY],
    //     keywords: ["landmark", "Paris", "tour"],
    //     markers: [{ lat: 48.8584, lng: 2.2945 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/64/200/200",
    //       name: "Alice Dupont",
    //     },
    //   },
    //   {
    //     id: "2",
    //     city: "Rome",
    //     title: "Colosseum Experience",
    //     description: "Step back in time at Rome's most famous ancient amphitheater",
    //     url: "https://example.com/colosseum",
    //     image: "https://picsum.photos/id/1019/800/600",
    //     nodeTypes: [NodeTypeEnum.ATTRACTION],
    //     keywords: ["history", "Rome", "gladiators"],
    //     markers: [{ lat: 41.8902, lng: 12.4922 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/65/200/200",
    //       name: "Marco Rossi",
    //     },
    //   },
    //   {
    //     id: "3",
    //     city: "New York",
    //     title: "Statue of Liberty Cruise",
    //     url: "https://example.com/statue-liberty",
    //     image: "https://picsum.photos/id/1020/800/600",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY, NodeTypeEnum.ATTRACTION],
    //     keywords: ["USA", "freedom", "monument"],
    //     markers: [{ lat: 40.6892, lng: -74.0445 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/66/200/200",
    //       name: "John Smith",
    //     },
    //   },
    //   {
    //     id: "4",
    //     city: "Tokyo",
    //     title: "Shinjuku Nightlife Tour",
    //     description: "Explore the vibrant nightlife district of Tokyo",
    //     url: "https://example.com/shinjuku",
    //     image: "https://picsum.photos/id/1021/800/600",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY, NodeTypeEnum.EVENT],
    //     keywords: ["Tokyo", "nightlife", "bars"],
    //     markers: [{ lat: 35.6938, lng: 139.7034 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/67/200/200",
    //       name: "Hana Tanaka",
    //     },
    //   },
    //   {
    //     id: "5",
    //     city: "Barcelona",
    //     title: "Sagrada Familia Tour",
    //     url: "https://example.com/sagrada-familia",
    //     image: "https://picsum.photos/id/1022/800/600",
    //     nodeTypes: [NodeTypeEnum.ATTRACTION],
    //     keywords: ["Gaudi", "architecture", "Barcelona"],
    //     markers: [{ lat: 41.4036, lng: 2.1744 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/68/200/200",
    //       name: "Carlos Fernandez",
    //     },
    //   },
    //   {
    //     id: "6",
    //     city: "Cairo",
    //     title: "Pyramids of Giza",
    //     url: "https://example.com/pyramids",
    //     image: "https://picsum.photos/id/1023/800/600",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY],
    //     keywords: ["Egypt", "ancient", "wonder"],
    //     markers: [{ lat: 29.9792, lng: 31.1342 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/69/200/200",
    //       name: "Amira Hassan",
    //     },
    //   },
    //   {
    //     id: "7",
    //     city: "Sydney",
    //     title: "Sydney Opera House",
    //     url: "https://example.com/opera-house",
    //     image: "https://picsum.photos/id/1024/800/600",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY],
    //     keywords: ["Australia", "icon", "sydney"],
    //     markers: [{ lat: -33.8568, lng: 151.2153 }],
    //     owner: {
    //       avatarUrl: "https://picsum.photos/id/70/200/200",
    //       name: "Liam O'Brien",
    //     },
    //   },
    //   {
    //     id: "8",
    //     city: "Amsterdam",
    //     title: "Canal Cruise",
    //     url: "https://example.com/canal-cruise",
    //     image: "https://example.com/images/canal.jpg",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY],
    //     keywords: ["Netherlands", "boats", "water"],
    //     markers: [{ lat: 52.3702, lng: 4.8952 }],
    //     owner: {
    //       avatarUrl: "https://example.com/avatars/user8.jpg",
    //       name: "Sophie de Vries",
    //     },
    //   },
    //   {
    //     id: "9",
    //     city: "Rio de Janeiro",
    //     title: "Christ the Redeemer Visit",
    //     url: "https://example.com/christ-redeemer",
    //     image: "https://example.com/images/christ.jpg",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY],
    //     keywords: ["Brazil", "statue", "view"],
    //     markers: [{ lat: -22.9519, lng: -43.2105 }],
    //     owner: {
    //       avatarUrl: "https://example.com/avatars/user9.jpg",
    //       name: "Lucas Oliveira",
    //     },
    //   },
    //   {
    //     id: "10",
    //     city: "London",
    //     title: "Thames River Sightseeing",
    //     url: "https://example.com/thames-cruise",
    //     image: "https://example.com/images/thames.jpg",
    //     nodeTypes: [NodeTypeEnum.ACTIVITY],
    //     keywords: ["UK", "river", "London"],
    //     markers: [{ lat: 51.5074, lng: -0.1278 }],
    //     owner: {
    //       avatarUrl: "https://example.com/avatars/user10.jpg",
    //       name: "Emily Watson",
    //     },
    //   },
    // ];
    // reply.send(mockedItemEntries);
     reply.send(locations);
  } catch (error) {
    if (error instanceof Error) {
      req.log.error({ err: error }, "Error in searchLocationsByParams");
      reply.status(500).send({ error: error.message });
    } else {
      req.log.error({ err: error }, "Unknown error in searchLocationsByParams");
      reply.status(500).send({ error: "An unknown error occurred." });
    }
  }
}





export async function findLocationById(
  req: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    //const location = await getLocationById(id);
    // Mock data with different image aspect ratios
    const mockLocation: ItemEntryResponse = {
      id,
      city: "Tokyo",
      title: "Tokyo Tower Experience",
      description: "Visit the iconic Tokyo Tower and enjoy panoramic city views",
      url: "https://example.com/tokyo-tower",
      // Randomly choose between 16:9 (1920x1080) or square (800x800) image
      image: Math.random() > 0.5 
        ? "https://picsum.photos/1920/1080"
        : "https://picsum.photos/800/800",
      nodeTypes: [NodeTypeEnum.ATTRACTION, NodeTypeEnum.ACTIVITY],
      keywords: ["Tokyo", "landmark", "observation"],
      markers: [{ lat: 35.6586, lng: 139.7454 }],
      owner: {
        avatarUrl: "https://picsum.photos/id/64/200/200",
        name: "Yuki Tanaka"
      }
    };

    if (!mockLocation) {
      reply.status(404).send({ error: "Location not found" });
      return;
    }

    reply.send(mockLocation);
  } catch (error) {
    req.log.error({ err: error }, "Error in findLocationById");
    reply.status(500).send({ 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    });
  }
}
