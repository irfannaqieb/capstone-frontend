# Human Preference Frontend

A Nuxt 3 application for collecting human preferences on AI-generated images.

## Features

- Side-by-side image comparison
- Progress tracking
- Session management with localStorage
- Real-time voting system
- Responsive design

## Setup

### 1. Install Dependencies

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
BACKEND_URL=http://localhost:8000/api
```

Update the `BACKEND_URL` to point to your backend API server.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Backend Integration

### API Endpoints

The application expects the following backend endpoints:

#### GET `/pair/next`
Fetches the next image pair for voting.

**Query Parameters:**
- `session_id`: Unique session identifier (UUID)

**Response:**
```json
{
  "done": false,
  "pair_id": "a1b2c3d4-1234-5678-90ab-cdef12345678",
  "prompt_id": "prompt_001",
  "prompt_text": "A sunset over mountains",
  "left": {
    "url": "https://example.com/image1.jpg",
    "model": "gpt5"
  },
  "right": {
    "url": "https://example.com/image2.jpg",
    "model": "gemini25"
  },
  "total_pairs": 20,
  "pairs_completed": 1,
  "pairs_remaining": 19
}
```

#### POST `/votes`
Submits a vote for an image pair.

**Request Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "pair_id": "a1b2c3d4-1234-5678-90ab-cdef12345678",
  "winner_model": "gpt5" // or "gemini25" or "tie"
}
```

### Session Management

The app automatically generates and stores a unique session ID in localStorage (`hp_session_id`). This ID is sent with every API request to track user progress.
