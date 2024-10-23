import searchRoutes from "./app/search/routes";
import utilRoutes from "./utils/routes";

// Export route handlers as an object
export const routes = {
  "/search": searchRoutes,
  "": utilRoutes,
};
