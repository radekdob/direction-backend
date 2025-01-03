import { ItemEntryResponse } from "../app/search/types";

/**
 * Creates a unique identifier for a place based on its properties
 * @param item ItemEntryResponse object containing place details
 * @returns string A base64 encoded unique identifier
 */
export function createPlaceId(properties: {
  title: string;
  lat?: number;
  lng?: number;
}): string {
  // Create a string combining title and coordinates if they exist
  const idString = [
    properties.title,
    properties.lat?.toString() || '',
    properties.lng?.toString() || ''
  ].filter(Boolean).join('§§§');
  
  // Encode to base64 and remove any non-URL-safe characters
  return Buffer.from(idString, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a place ID back to its components
 * @param id The base64 encoded place ID
 * @returns Object containing the decoded components
 */
export function decodePlaceId(id: string): {
  title: string;
  lat?: number;
  lng?: number;
} {
  try {
    // Replace URL-safe characters back
    const base64 = id
      .replace(/-/g, '+')
      .replace(/_/g, '/');
      
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const [title, lat, lng] = decoded.split('§§§');
    
    // Only include coordinates if both lat and lng are valid numbers
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    
    return {
      title,
      ...((!isNaN(parsedLat) && !isNaN(parsedLng)) ? {
        lat: parsedLat,
        lng: parsedLng
      } : {})
    };
  } catch (error) {
    // If decoding fails for any reason, return just the encoded string as title
    return { title: id };
  }
}
