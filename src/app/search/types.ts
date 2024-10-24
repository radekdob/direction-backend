export interface ItemEntryResponse {
  description?: string;
  title: string;
  url: string;
  image?: string;
  nodeTypes?: string[];
  keywords?: string[];
  markers?: { lat: number; lng: number }[];
}

export interface SearchParams {
  state: string;
  location?: string;
  locationType?: string;
  nodeTypes?: string[];
  keywords?: string[];
  userInput?: string;
}
