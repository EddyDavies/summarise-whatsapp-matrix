FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy application code
COPY . .

# Build TypeScript
RUN bun run build

# Set environment variables
ENV NODE_ENV=production

# Command to run the application
CMD ["bun", "start"] 