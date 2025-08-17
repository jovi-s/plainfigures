# Environment Configuration

This frontend application uses environment variables to configure the backend URL for different deployment scenarios.

## Environment Variables

### `VITE_BACKEND_URL`
The URL of the backend API server.

**Development**: `http://127.0.0.1:8080`
**Production**: Your deployed backend URL (e.g., `https://your-app.cloudfunctions.net` or `https://your-backend-domain.com`)

## Setup for Different Environments

### Local Development
Create a `.env.local` file in the frontend directory:
```bash
VITE_BACKEND_URL=http://127.0.0.1:8080
```

### Vercel Production Deployment
Set the environment variable in your Vercel dashboard:
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: Your deployed backend URL (e.g., `https://your-backend-url.com`)
   - **Environment**: Production (and Preview if needed)

### Build Process
The environment variables are processed at build time by Vite. Make sure to:
1. Set `VITE_BACKEND_URL` before running `npm run build`
2. The variable will be embedded in the built JavaScript files
3. Different builds can have different backend URLs

## Usage in Code
```typescript
// This will use the environment variable or fall back to localhost
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8080';
```

## Important Notes
- Environment variables prefixed with `VITE_` are exposed to the client-side code
- `.env.local` files are ignored by git for security
- For Vercel deployment, set the environment variable in the Vercel dashboard, not in code
