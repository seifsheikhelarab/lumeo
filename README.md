<div align="center">
  <img src="/lumeo/public/favicon.ico" alt="Lumeo Logo" width="80" height="80" />
  <h1>Lumeo</h1>
  <p>A cinematic, content-first streaming discovery platform.</p>
</div>

---

Lumeo is a modern streaming discovery application built with **React Router 7**, **React 19**, and **TailwindCSS 4**. It provides a refined, theater-like experience for browsing movies and TV shows, with features like real-time search, watch-together rooms, and detailed content information powered by TMDB.

> [!IMPORTANT]
> This project is for educational and personal use only. It demonstrates modern web development patterns and integrations with external content providers.

## Features

- **Cinematic Discovery**: Browse trending movies and TV shows with a focus on high-quality posters and metadata.
- **Detailed Information**: View comprehensive details including cast, seasons, episodes, and similar content.
- **Watch Together**: Real-time synchronized watch rooms using Socket.IO.
- **Responsive Design**: Optimized for a seamless experience across mobile, tablet, and desktop devices.
- **Refined UI**: A dark-mode primary interface with smooth transitions and purposeful animations.

## Tech Stack

- **Framework**: [React Router 7](https://reactrouter.com/) (formerly Remix)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Typography**: [Outfit](https://fonts.google.com/specimen/Outfit)
- **Data Provider**: [TMDB API](https://www.themoviedb.org/documentation/api)
- **Real-time**: [Socket.IO](https://socket.io/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [TMDB API Key](https://www.themoviedb.org/settings/api) (Read Access Token)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lumeo-app.git
   cd lumeo-app/lumeo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `lumeo` directory and add your TMDB token:
   ```env
   VITE_TMDB_TOKEN=your_tmdb_read_access_token_here
   ```

### Development

Run the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```text
app/
├── components/     # Reusable UI components
├── routes/         # Page components and routing logic
├── services/       # API and external service integrations
├── types/          # TypeScript definitions
├── root.tsx        # Application root and global layout
└── routes.ts       # Route configuration
```

## Production

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```
