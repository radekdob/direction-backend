const UNSPLASH_API_URL = 'https://api.unsplash.com';
import axios from 'axios';

interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    username: string;
  };
}

export const fetchUnsplashImages = async (
  query: string,
  page: number = 1,
  perPage: number = 100
): Promise<UnsplashImage[]> => {
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    throw new Error('Unsplash API key is not configured');
  }

  const params = {
    query,
    page,
    per_page: perPage,
  };

  try {
    const { data } = await axios.get(`${UNSPLASH_API_URL}/search/photos`, {
      params,
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    return data.results;
  } catch (error) {
    console.error('Error fetching images from Unsplash:', error);
    throw error;
  }
} 