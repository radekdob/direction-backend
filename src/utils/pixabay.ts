const PIXABAY_API_URL = 'https://pixabay.com/api';
import axios from 'axios';

interface PixabayImage {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  previewURL: string;
  tags: string;
  user: string;
  userImageURL: string;
  imageWidth: number;
  imageHeight: number;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

export const fetchPixabayImages = async (
  query: string,
  page: number = 1,
  perPage: number = 3 //3 is min
): Promise<PixabayImage[]> => {
  if (!process.env.PIXABAY_API_KEY) {
    throw new Error('Pixabay API key is not configured');
  }

  const params = {
    key: process.env.PIXABAY_API_KEY,
    q: query,
    page,
    per_page: perPage,
    image_type: 'photo',
    safesearch: true,
  };

  try {
    const { data } = await axios.get<PixabayResponse>(PIXABAY_API_URL, {
      params,
    });

    return data.hits;
  } catch (error) {
    console.error('Error fetching images from Pixabay:', error);
    throw error;
  }
} 