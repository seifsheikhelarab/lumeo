import dotenv from "dotenv";
dotenv.config();

const tmdbUrl = "https://api.themoviedb.org/3";
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_RAT}`,
  },
};

export async function movieIndexController(req, res) {
  const page = req.query.page || 1;
  const url = req.query.query
    ? `${tmdbUrl}/search/movie?query=${req.query.query}&page=${page}`
    : `${tmdbUrl}/discover/movie?include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc`;

  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      res.render("movies/index", {
        movies: json.results,
        page,
        lastPage: json.total_pages,
        query: req.query.query,
      });
    })
    .catch((err) => console.error(err));
}

export function movieDetailsController(req, res) {
  const id = req.params.id;
  const url = `${tmdbUrl}/movie/${id}?language=en-US`;

  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      res.render("movies/details", { movie: json });
    })
    .catch((err) => console.error(err));
}

export function watchMovie(req, res) {
  const id = req.params.id;
  res.render("movies/watch", { id });
}

