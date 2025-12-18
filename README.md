cmd
Bombandak NFT Game!

## Getting Started

### Prerequisites
- Node.js installed
- Backend server must be running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment (optional):
```bash
cp .env.example .env
```

### Running the Application

**Important:** The frontend requires the backend server to be running.

Start both frontend and backend together:
```bash
npm start
```

Or run them separately:

1. Start the backend server:
```bash
npm run start-server
```

2. In another terminal, start the frontend:
```bash
npm run dev
```

The frontend will check server health on startup and display an error if the server is not available.

## API Configuration

The frontend connects to the backend API. You can configure the API URL in `.env`:

```
VITE_API_URL=http://localhost:4000/api
```

## Reusing in Other Projects

The server health check system is designed to be easily portable:

1. Copy `src/config/api.ts` - Contains API client and health check logic
2. Copy `src/components/ServerHealthCheck.tsx` - UI component for health check
3. Wrap your app with `<ServerHealthCheck>` in your main entry file
4. Configure `VITE_API_URL` in your `.env` file
