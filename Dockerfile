# Stage 1: Build the application
FROM node:22.5.1-slim AS build

# Install OpenSSL to satisfy Prisma's dependency
RUN apt-get update && apt-get install -y openssl

WORKDIR /travelzoom-backend

# Copy package.json and yarn.lock to install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy the rest of the application code
COPY . .

# Generate Prisma client (if you're using Prisma)
RUN npx prisma generate

# Compile TypeScript to JavaScript
RUN yarn tsc

# Stage 2: Final image to run the application
FROM node:22.5.1-slim

# Install OpenSSL in the runtime container as well
RUN apt-get update && apt-get install -y openssl

WORKDIR /travelzoom-backend

# Copy compiled code and dependencies from the build stage
COPY --from=build /travelzoom-backend/package.json ./
COPY --from=build /travelzoom-backend/node_modules ./node_modules
COPY --from=build /travelzoom-backend/build ./build
COPY --from=build /travelzoom-backend/prisma ./prisma

# Expose server port (default is 8000)
EXPOSE 8000

# Start the application using the compiled JavaScript
CMD ["node", "build/index.js"]