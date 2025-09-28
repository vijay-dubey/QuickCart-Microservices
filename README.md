# QuickCart Microservices

QuickCart is a comprehensive e-commerce platform built using microservices architecture. It provides a scalable, maintainable, and feature-rich solution for online shopping.

## 🌟 Key Features

### Customer Features
- User authentication and authorization with JWT
- Product browsing and searching with filters
- Shopping cart management
- Wishlist management
- Order placement and tracking
- Product reviews and ratings
- Return request management
- Address management
- Profile management

### Admin Features
- Product management (CRUD operations)
- User management
- Order management
- Return request management
- Review moderation
- Analytics dashboard

## 🏗️ Architecture

The application is built using a microservices architecture with the following components:

### Backend Services
1. **API Gateway (Port: 8765)**
   - Routes requests to appropriate services
   - Handles CORS configuration
   - Load balancing

2. **Config Server (Port: 8888)**
   - Centralized configuration management
   - Externalized configuration for all services

3. **Eureka Server (Port: 8761)**
   - Service discovery and registration
   - Health monitoring

4. **User Service (Port: 8081)**
   - User authentication and authorization
   - Profile management
   - JWT token generation and validation

5. **Product Service (Port: 8083)**
   - Product catalog management
   - Product search and filtering
   - Category management

6. **Cart Service (Port: 8084)**
   - Shopping cart management
   - Cart item operations

7. **Order Service (Port: 8086)**
   - Order processing
   - Order status management
   - Order history

8. **Address Service (Port: 8085)**
   - User address management
   - Address validation

9. **Review Service (Port: 8082)**
   - Product reviews and ratings
   - Review moderation

10. **Wishlist Service (Port: 8087)**
    - User wishlist management
    - Wishlist item operations

11. **Return Service (Port: 8088)**
    - Return request management
    - Return status tracking

### Frontend
- Built with React + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Responsive design
- Protected routes with role-based access

## 🛠️ Technology Stack

### Backend
- Java 23
- Spring Boot 3.5.5
- Spring Cloud
- Spring Security
- Spring Data JPA
- MySQL Database
- Apache Kafka
- OpenFeign Client
- JWT Authentication
- Maven

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Context API
- Heroicons

### Tools & Infrastructure
- Apache Kafka for event-driven architecture
- MySQL for data persistence
- Maven for dependency management
- Git for version control

## 📊 Database Schema

Each service has its own database schema (all within MySQL):
- User Service: User management and authentication
- Product Service: Product catalog and categories
- Cart Service: Shopping cart data
- Order Service: Order processing and history
- Address Service: User addresses
- Review Service: Product reviews and ratings
- Wishlist Service: User wishlists
- Return Service: Return requests and processing

## 🔄 Event-Driven Architecture

The application uses Apache Kafka for event-driven communication between services:
- User deletion events
- Order status updates
- Review creation events
- Return status updates

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.8+
- MySQL 8.0+
- Node.js 14+
- npm or yarn
- Docker (for Kafka setup)

### Setup Steps

1. **Clone the Repository**
   \`\`\`bash
   git clone https://github.com/vijay-dubey/QuickCart-Microservices.git
   cd QuickCart-Microservices
   \`\`\`

2. **Set Up MySQL Database**
   - Create a database named \`quickcart_ms_db\`
   - Update database configurations in \`config-repo/application.yml\`

3. **Start Kafka Services**
   \`\`\`bash
   cd quickcart-kafka
   docker-compose up -d
   \`\`\`

4. **Start Backend Services (in order)**
   \`\`\`bash
   # Start Config Server
   cd config-server
   mvn spring-boot:run

   # Start Eureka Server
   cd ../eureka-server
   mvn spring-boot:run

   # Start other services
   cd ../user-service
   mvn spring-boot:run
   # Repeat for other services
   \`\`\`

5. **Start Frontend Application**
   \`\`\`bash
   cd quickcart-frontend
   npm install
   npm run dev
   \`\`\`

### Default Ports
- Config Server: 8888
- Eureka Server: 8761
- API Gateway: 8765
- User Service: 8081
- Review Service: 8082
- Product Service: 8083
- Cart Service: 8084
- Address Service: 8085
- Order Service: 8086
- Wishlist Service: 8087
- Return Service: 8088

## 🔒 Security

- JWT-based authentication
- Role-based access control (ADMIN, CUSTOMER)
- Secure password hashing
- Protected API endpoints
- CORS configuration
- Microservices security with Spring Security

## 🤝 Service Communication

- Synchronous: REST APIs using OpenFeign
- Asynchronous: Event-driven using Apache Kafka
- Service Discovery: Netflix Eureka
- API Gateway: Spring Cloud Gateway

## ⚙️ Configuration Management

- Centralized configuration using Spring Cloud Config
- Environment-specific configurations
- Externalized sensitive information

## 🔍 Testing

For testing the APIs, you can use Postman. API documentation and collection will be shared separately.

## 🛣️ Future Roadmap

- Implement payment gateway integration
- Add OAuth 2.0 support
- Implement caching with Redis
- Add real-time notifications
- Implement product recommendation system
- Add chat support
- Enhance search with Elasticsearch

## 👥 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👏 Acknowledgments

- Spring Boot and Spring Cloud teams
- React development team
- All contributors and supporters