import express from "express";
import { indexController } from "./controllers/main.controller.js";
import {
  movieDetailsController,
  watchMovie,
  movieIndexController,
} from "./controllers/movie.controller.js";
import {
  tvDetailsController,
  tvIndexController,
  watchTvShow,
} from "./controllers/tv.controller.js";

export const router = express.Router();

router.get("/", indexController);

router.get("/movies", movieIndexController);
router.get("/movies/:id", movieDetailsController);
router.get("/movies/:id/watch", watchMovie);

router.get("/tvshows", tvIndexController);
router.get("/tvshows/:id", tvDetailsController);
router.get("/tvshows/:id/season/:season/episode/:episode", watchTvShow);
