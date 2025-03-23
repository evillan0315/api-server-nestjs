# NestJS API Server

## Overview
This project is a NestJS-based API server that provides authentication, file management, AI integrations, and database interactions. It utilizes AWS Cognito for authentication, DynamoDB and Prisma for database management, and various AI integrations such as Google Gemini and OpenAI.

## Features
- **Authentication**: AWS Cognito-based authentication with JWT strategy.
- **Database Management**: Prisma ORM for structured database operations, integrated with PostgreSQL.
- **AI Integrations**: Google Gemini and OpenAI APIs for AI-powered features.
- **File Handling**: Upload, manage, and retrieve files.
- **Real-time Execution**: WebSocket support for real-time interactions.
- **API Documentation**: Integrated Swagger UI for API exploration.

## Project Structure
```
api-server/
├── prisma/                  # Prisma schema and migrations
│   ├── schema.prisma        # Prisma schema definition
├── src/                     # Source code
│   ├── auth/                # Authentication module
│   │   ├── strategy/        # Authentication strategies
│   ├── chatgpt/             # OpenAI integration
│   ├── dynamodb/            # DynamoDB operations
│   ├── file/                # File management module
│   ├── google-gemini/       # Google Gemini API integration
│   ├── prisma/              # Prisma API endpoints
│   ├── main.ts              # Application entry point
├── .env                     # Environment variables
├── package.json             # Project dependencies
├── nest-cli.json            # NestJS configuration
├── eslint.config.mjs        # ESLint configuration
├── .prettierrc              # Prettier configuration
├── .gitignore               # Git ignore file
└── README.md                # Documentation
```

## Installation
### Prerequisites
- Node.js (Latest LTS recommended)
- PostgreSQL Database
- AWS Cognito Setup

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/evillan0315/api-server-nestjs.git
   cd api-server
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables:
   ```sh
   cp .env.example .env
   ```
   Edit `.env` with your database, Cognito, and AI API credentials.
4. Run database migrations:
   ```sh
   npx prisma migrate dev
   ```
5. Start the application:
   ```sh
   npm run start:dev
   ```

## API Documentation
To access API documentation, run the server and open:
```
http://localhost:3000/api
```
Swagger documentation is available for testing endpoints.

## Testing
Run unit tests using:
```sh
npm run test
```

## Contributing
1. Fork the repository
2. Create a new branch (`feature/new-feature`)
3. Commit changes
4. Push to your fork
5. Open a Pull Request

## License
MIT License. See [LICENSE](LICENSE) for details.

## 📞 Contact
- **GitHub**: [evillan0315](https://github.com/evillan0315)
- **Email**: evillan0315@gmail.com
- **LinkedIn**: [Eddie Villanueva](https://www.linkedin.com/in/evillanueva0315/)


