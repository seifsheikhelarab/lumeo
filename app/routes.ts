import { type RouteConfig, index, route, layout, prefix } from "@react-router/dev/routes";

export default [
  route("api/ably-auth", "routes/api/ably-auth.tsx"),
  route("api/room", "routes/api/room.tsx"),
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("movies", "routes/movies/movies.tsx"),
    route("movies/:id", "routes/movies/movies.$id.tsx"),
    route("movies/:id/watch", "routes/movies/movies.$id.watch.tsx"),
    route("tv", "routes/tv/tv.tsx"),
    route("tv/:id", "routes/tv/tv.$id.tsx"),
    route("tv/:id/season/:season/episode/:episode", "routes/tv/tv.$id.season.$season.episode.$episode.tsx"),
    route("together", "routes/together/together.tsx"),
    route("together/:roomId", "routes/together/together.$roomId.tsx"),
  ]),
] satisfies RouteConfig;
