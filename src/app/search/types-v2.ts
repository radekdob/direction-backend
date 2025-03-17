export type PoiSearchParams = {
    queryInput: string;
    keywords: string[];
    locations: string[];
}

export type PoiType = 'location' | 'poi' | 'experience' | 'attraction' | 'cruise' | 'hotel' | 'food&drink';

export type PoiLLM = {
    name: string;
    lng: number;
    lat: number;
    description: string;
    imageUrl: string;
    url: string;
    itemType: PoiType;
}

export type Poi = PoiLLM & {
    id: string;
    owner: {
        avatarUrl: string;
        name: string;
    }
    keywords: string[];
  };


export type PoiSearchResponse = {
    items: Poi[];
    keywords: string[];
    suggestedKeywords: string[];
    locations: string[];
    type: 'initial' | 'followup';
    poiTypes: PoiType[];
}