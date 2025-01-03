export enum NodeTypeEnum {
  ACTIVITY = 'ACTIVITY',
  ATTRACTION = 'ATTRACTION',
  RESTAURANT = 'RESTAURANT',
  HOTEL = 'HOTEL',
  EVENT = 'EVENT'
}

export interface ItemOwner {
  avatarUrl: string;
  name: string;
}

export interface ItemEntryResponse {
  id: string;
  city: string;
  description?: string;
  title: string;
  url: string;
  image?: string;
  nodeTypes?: NodeTypeEnum[];
  keywords?: string[];
  markers?: { lat: number; lng: number }[];
  owner: ItemOwner;
}

export interface SearchParams {
  state: string;
  location?: string;
  locationType?: string;
  nodeTypes?: string[];
  keywords?: string[];
  userInput?: string;
}
