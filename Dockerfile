FROM node:22-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build
EXPOSE 8080
CMD ["pnpm", "run", "start"]
