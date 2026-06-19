# Stage 1: Build the application (Node.js 환경)
FROM node:20-alpine AS build
WORKDIR /app

# 의존성 패키지 설치
COPY package*.json ./
RUN npm ci

# 소스 파일 복사 및 빌드
COPY . .
RUN npm run build

# Stage 2: Run the application (Nginx 환경)
FROM nginx:alpine
# 빌드된 Vite 산출물(dist)을 Nginx의 기본 웹 서비스 경로로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 기본 Nginx 포트 노출
EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
