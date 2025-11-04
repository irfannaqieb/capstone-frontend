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

#### GET `/prompts/next`
Fetches the next prompt with 5 images for voting.

**Query Parameters:**
- `session_id`: Unique session identifier (UUID)

**Response:**
```json
{
  "done": false,
  "prompt_id": "123",
  "prompt_text": "A cat in space...",
  "images": [
    {
      "image_id": "uuid",
      "url": "https://...",
      "model": "kolors"
    },
    {
      "image_id": "uuid",
      "url": "https://...",
      "model": "flux1_krea"
    },
    {
      "image_id": "uuid",
      "url": "https://...",
      "model": "gemini25"
    },
    {
      "image_id": "uuid",
      "url": "https://...",
      "model": "flux1_dev"
    },
    {
      "image_id": "uuid",
      "url": "https://...",
      "model": "gpt5"
    }
  ],
  "index": 1,
  "total": 30,
  "chunk_id": "uuid"
}
```

#### POST `/votes`
Submits a vote for the selected image.

**Request Body:**
```json
{
  "session_id": "uuid",
  "prompt_id": "123",
  "winner_model": "gpt5", // or "tie"
  "reaction_time_ms": 1500
}
```

#### GET `/session/{id}/status`
Get session status and progress.

**Response:**
```json
{
  "session_id": "uuid",
  "status": "active",
  "total_votes": 5,
  "total_prompts": 30,
  "chunk_id": "uuid"
}
```

### Session Management

The app automatically generates and stores a unique session ID in localStorage (`hp_session_id`). This ID is sent with every API request to track user progress.
