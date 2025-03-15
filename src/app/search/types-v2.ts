export type PoiSearchParams = {
    queryInput: string;
}

export type PoiLLM = {
    name: string;
    lng: number;
    lat: number;
    description: string;
    imageUrl: string;
    url: string;
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
}