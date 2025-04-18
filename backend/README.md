# VisionWest Work Order Management System - Backend

This is the backend API for the VisionWest Work Order Management System.

## Prerequisites

- Node.js (v14.x or higher)
- npm or yarn
- Access to a PostgreSQL database (remote or local)

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Configure the environment variables by copying the `.env.example` to `.env` and updating the values as necessary:

```bash
cp .env.example .env
# Then edit the .env file with your database credentials
```

The application is already configured to connect to a remote PostgreSQL database. If you need to modify the database connection details, update the `.env` file.

## Running the Application

### Development Mode

```bash
npm run dev
# or
yarn dev
```

This will start the server with nodemon, which will automatically restart the server when changes are made.

### Production Mode

```bash
npm start
# or
yarn start
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user information (requires authentication)

## Development Notes

- The database is automatically seeded with three test users when running in development mode:
  - Client (VisionWest): client@visionwest.org (password: password123)
  - Admin (Williams Property): admin@williamspropertyservices.co.nz (password: password123)
  - Staff (Williams Property): staff@williamspropertyservices.co.nz (password: password123)

- In development mode, the database schema is automatically synchronized using `sequelize.sync({ alter: true })`. This should not be used in production.

## License

ISC