# TouraneNews - Spring Boot Project Structure

```
TouraneNews/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── touranenews/
│   │   │               │
│   │   │               ├── TouraneNewsApplication.java          # Main application class
│   │   │               │
│   │   │               ├── entity/                              # JPA Entities (Database models)
│   │   │               │   ├── User.java                        # ✅ User entity
│   │   │               │   ├── Article.java                     # ✅ Article entity
│   │   │               │   ├── Comment.java                     # ✅ Comment entity
│   │   │               │   └── SavedArticle.java                # ✅ SavedArticle entity
│   │   │               │
│   │   │               ├── repository/                          # Spring Data JPA Repositories
│   │   │               │   ├── UserRepository.java              # ✅ User repository
│   │   │               │   ├── ArticleRepository.java           # ✅ Article repository
│   │   │               │   ├── CommentRepository.java           # ✅ Comment repository
│   │   │               │   └── SavedArticleRepository.java      # ✅ SavedArticle repository
│   │   │               │
│   │   │               ├── dto/                                 # Data Transfer Objects
│   │   │               │   ├── request/                         # Request DTOs
│   │   │               │   │   ├── UserRegistrationDTO.java     # 📝 TODO
│   │   │               │   │   ├── UserLoginDTO.java            # 📝 TODO
│   │   │               │   │   ├── ArticleCreateDTO.java        # 📝 TODO
│   │   │               │   │   ├── ArticleUpdateDTO.java        # 📝 TODO
│   │   │               │   │   └── CommentCreateDTO.java        # 📝 TODO
│   │   │               │   │
│   │   │               │   ├── response/                        # Response DTOs
│   │   │               │   │   ├── UserDTO.java                 # 📝 TODO
│   │   │               │   │   ├── ArticleDTO.java              # 📝 TODO
│   │   │               │   │   ├── CommentDTO.java              # 📝 TODO
│   │   │               │   │   ├── SavedArticleDTO.java         # 📝 TODO
│   │   │               │   │   ├── ApiResponse.java             # 📝 TODO - Generic wrapper
│   │   │               │   │   ├── ErrorResponse.java           # 📝 TODO
│   │   │               │   │   └── PaginatedResponse.java       # 📝 TODO
│   │   │               │   │
│   │   │               │   └── AuthResponse.java                # 📝 TODO - JWT token response
│   │   │               │
│   │   │               ├── mapper/                              # Entity ↔ DTO Mappers
│   │   │               │   ├── UserMapper.java                  # 📝 TODO
│   │   │               │   ├── ArticleMapper.java               # 📝 TODO
│   │   │               │   ├── CommentMapper.java               # 📝 TODO
│   │   │               │   └── SavedArticleMapper.java          # 📝 TODO
│   │   │               │
│   │   │               ├── service/                             # Business Logic Layer
│   │   │               │   ├── UserService.java                 # 📝 TODO
│   │   │               │   ├── ArticleService.java              # 📝 TODO
│   │   │               │   ├── CommentService.java              # 📝 TODO
│   │   │               │   ├── SavedArticleService.java         # 📝 TODO
│   │   │               │   ├── AuthService.java                 # 📝 TODO - Authentication
│   │   │               │   └── AIService.java                   # 📝 TODO - AI integration
│   │   │               │
│   │   │               ├── controller/                          # REST API Controllers
│   │   │               │   ├── ArticleController.java           # 📝 TODO - /api/articles
│   │   │               │   ├── CommentController.java           # 📝 TODO - /api/comments
│   │   │               │   ├── UserController.java              # 📝 TODO - /api/users
│   │   │               │   ├── AuthController.java              # 📝 TODO - /api/auth
│   │   │               │   └── AIController.java                # 📝 TODO - /api/ai
│   │   │               │
│   │   │               ├── security/                            # Security & JWT
│   │   │               │   ├── JwtTokenProvider.java            # 📝 TODO - Generate/validate JWT
│   │   │               │   ├── JwtAuthenticationFilter.java     # 📝 TODO - Filter requests
│   │   │               │   ├── CustomUserDetailsService.java    # 📝 TODO - Load user details
│   │   │               │   └── SecurityConfig.java              # 📝 TODO - Security configuration
│   │   │               │
│   │   │               ├── exception/                           # Exception Handling
│   │   │               │   ├── ResourceNotFoundException.java   # 📝 TODO
│   │   │               │   ├── BadRequestException.java         # 📝 TODO
│   │   │               │   ├── UnauthorizedException.java       # 📝 TODO
│   │   │               │   ├── ForbiddenException.java          # 📝 TODO
│   │   │               │   └── GlobalExceptionHandler.java      # 📝 TODO - @RestControllerAdvice
│   │   │               │
│   │   │               ├── config/                              # Configuration Classes
│   │   │               │   ├── CorsConfig.java                  # 📝 TODO - CORS configuration
│   │   │               │   ├── OpenApiConfig.java               # 📝 TODO - Swagger/OpenAPI
│   │   │               │   └── WebConfig.java                   # 📝 TODO - Web configuration
│   │   │               │
│   │   │               └── util/                                # Utility Classes
│   │   │                   ├── DataSeeder.java                  # 📝 TODO - Initial data seeding
│   │   │                   └── DateUtils.java                   # 📝 TODO - Date utilities
│   │   │
│   │   └── resources/
│   │       ├── application.yml                                  # ✅ Main configuration
│   │       ├── application-dev.yml                              # 📝 TODO - Dev environment
│   │       ├── application-prod.yml                             # 📝 TODO - Production environment
│   │       └── static/                                          # Static resources (if needed)
│   │
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── touranenews/
│                       ├── TouraneNewsApplicationTests.java     # Default test
│                       │
│                       ├── service/                             # Service tests
│                       │   ├── ArticleServiceTest.java          # 📝 TODO
│                       │   ├── UserServiceTest.java             # 📝 TODO
│                       │   └── CommentServiceTest.java          # 📝 TODO
│                       │
│                       └── controller/                          # Controller integration tests
│                           ├── ArticleControllerTest.java       # 📝 TODO
│                           ├── AuthControllerTest.java          # 📝 TODO
│                           └── UserControllerTest.java          # 📝 TODO
│
├── pom.xml                                                      # ✅ Maven dependencies
├── .gitignore                                                   # Git ignore file
├── README.md                                                    # 📝 TODO - Project documentation
└── PROJECT_STRUCTURE.md                                         # This file

```

## 📊 Current Progress

### ✅ Completed (Phase 1.1 - 1.2)
- [x] Project setup
- [x] Database configuration
- [x] Entity classes (User, Article, Comment, SavedArticle)
- [x] Repository interfaces

### 🔄 Next Steps (Phase 1.3 - 1.7)
- [ ] Create DTOs (request/response)
- [ ] Create Mappers
- [ ] Create Services
- [ ] Create Controllers
- [ ] Implement Security (JWT)
- [ ] Exception handling

## 📝 Package Descriptions

| Package | Purpose | Status |
|---------|---------|--------|
| `entity` | JPA entities (database models) | ✅ Complete |
| `repository` | Spring Data JPA repositories | ✅ Complete |
| `dto` | Data Transfer Objects for API | 📝 TODO |
| `mapper` | Convert between Entity and DTO | 📝 TODO |
| `service` | Business logic layer | 📝 TODO |
| `controller` | REST API endpoints | 📝 TODO |
| `security` | JWT authentication & authorization | 📝 TODO |
| `exception` | Custom exceptions & error handling | 📝 TODO |
| `config` | Configuration classes | 📝 TODO |
| `util` | Utility classes | 📝 TODO |

## 🎯 API Endpoints (Planned)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user

### Articles
- `GET /api/articles` - Get all articles (paginated)
- `GET /api/articles/{id}` - Get article by ID
- `GET /api/articles/category/{category}` - Get by category
- `GET /api/articles/search?keyword=...` - Search articles
- `POST /api/articles` - Create article (admin)
- `PUT /api/articles/{id}` - Update article (admin)
- `DELETE /api/articles/{id}` - Delete article (admin)

### Comments
- `GET /api/comments/article/{articleId}` - Get comments
- `POST /api/comments/article/{articleId}` - Create comment
- `DELETE /api/comments/{id}` - Delete comment

### Users
- `GET /api/users/me` - Get profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/me/saved-articles` - Get saved articles
- `POST /api/users/me/saved-articles/{articleId}` - Save article
- `DELETE /api/users/me/saved-articles/{articleId}` - Unsave article

### AI
- `POST /api/ai/summarize` - Generate summary
- `POST /api/ai/recommend` - Get recommendations

## 🔧 Technologies

- **Java**: 22
- **Spring Boot**: 4.0.1
- **Hibernate**: 7.2.0
- **MySQL**: 8.0
- **JWT**: For authentication
- **Lombok**: Reduce boilerplate code
- **Maven**: Dependency management

## 📚 Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [Spring Security](https://spring.io/projects/spring-security)
- [JWT.io](https://jwt.io/)
