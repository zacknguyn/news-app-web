# RedditNews - Run Guide for Frontend

## URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- AI service, only when testing AI: `http://localhost:8000`

Do not open `http://localhost:8080` expecting the UI. It is the backend API, so a browser may show `403` on `/`.

## 1. Run Backend

Backend repo:

```bash
cd /home/nhatlam/Downloads/RedditNews
./mvnw spring-boot:run
```

Backend uses PostgreSQL from `src/main/resources/application.yml`:

```text
database: newsapp_db
host: localhost
port: 5432
```

Default backend URL:

```text
http://localhost:8080
```

## 2. Run Frontend

Frontend repo:

```bash
cd /home/nhatlam/Documents/workspace/news-app-web/frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend Vite config proxies `/api` to `http://localhost:8080`, so FE code should call API paths like:

```text
/api/v1/articles
/api/v1/posts/hot
/api/v1/topics
```

## 3. Optional: Run AI Service

Only run this when testing AI features such as summarize or recommendation.

Start AI service:

```bash
cd /home/nhatlam/Downloads/RedditNews/ai-service
source .venv/bin/activate
./run.sh
```

Check health:

```bash
curl http://localhost:8000/health
```

Expected: response contains `"status":"ok"`.

To make backend use AI, start backend with these environment variables:

```bash
cd /home/nhatlam/Downloads/RedditNews
AI_ENABLED=true AI_BASE_URL=http://localhost:8000 ./mvnw spring-boot:run
```

If running backend from IntelliJ, add this to Run Configuration environment variables:

```text
AI_ENABLED=true;AI_BASE_URL=http://localhost:8000
```

Without `AI_ENABLED=true`, AI is disabled by default.

## Common Checks

Backend health/API check:

```bash
curl http://localhost:8080/api/v1/topics
```

Frontend page:

```text
http://localhost:5173
```

Swagger:

```text
http://localhost:8080/swagger-ui/index.html
```

## Test Account

Seed data creates an admin account when the backend starts with an empty database:

```text
email: admin@gmail.com
password: 12345
```
