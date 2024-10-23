import searchRoutes from "./app/search/routes";
import keywordRoutes from "./utils/routes";

// Export route handlers as an object
export const routes = {
  "/search": searchRoutes,
  "/keywords": keywordRoutes,
};
