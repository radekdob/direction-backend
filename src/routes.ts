import userRoutes from "./app/user/routes";
import authRoutes from "./app/auth/routes";
import searchRoutes from "./app/search/routes";
import keywordRoutes from "./utils/routes";

// Export route handlers as an object
export const routes = {
  "/user": userRoutes,
  "/auth": authRoutes,
  "/search": searchRoutes,
  "/keywords": keywordRoutes, // Register keywords route
};
