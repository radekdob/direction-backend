import userRoutes from "./app/user/routes";
import authRoutes from "./app/auth/routes";
import searchRoutes from "./app/search/routes";

export const routes = {
  "/api/user": userRoutes,
  "/api/auth": authRoutes,
  "/api/search": searchRoutes,
};
