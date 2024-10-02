// src/app/search/service.ts
import prisma from "../../lib/helpers/prisma";

/**
 * Search for blogs and hotels based on the provided keywords.
 * @param keywords - Array of keywords to search for.
 * @returns Object containing arrays of matching blogs and hotels.
 */
export const searchBlogsAndHotels = async (keywords: string[]) => {
  // Convert keywords array to a search pattern
  const keywordPattern = keywords.join("|"); // Create a pattern like "beach|park|luxury"

  // Search for matching blogs using the `contains` filter
  const blogs = await prisma.blogpost.findMany({
    where: {
      keywords: {
        contains: keywordPattern, // Use contains to match the keyword pattern
        mode: "insensitive", // Make the search case-insensitive
      },
    },
  });

  // Search for matching hotels using the `contains` filter
  const hotels = await prisma.hotel.findMany({
    where: {
      keywords: {
        contains: keywordPattern, // Use contains to match the keyword pattern
        mode: "insensitive", // Make the search case-insensitive
      },
    },
  });

  return { blogs, hotels };
};
