FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
# 国内服务器构建时走 npm 镜像，避免 npmjs.org 网络波动阻断镜像构建。
RUN pnpm config set registry https://registry.npmmirror.com \
    && pnpm install --frozen-lockfile
COPY . ./
# 生产环境使用相对路径 /api/v1，由 Nginx 同域反向代理。
RUN pnpm build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
