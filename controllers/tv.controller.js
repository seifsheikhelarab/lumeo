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

export async function tvIndexController(req, res) {
  const page = req.query.page || 1;
  const url =
    req.query.query
      ? `${tmdbUrl}/search/tv?query=${req.query.query}&page=${page}`
      : `${tmdbUrl}/discover/tv?page=1&sort_by=popularity.desc`;
  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      res.render("tv/index", {
        shows: json.results,
        page,
        lastPage: json.total_pages,
        query: req.query.query,
      });
    })
    .catch((err) => console.error(err));
}

export function tvDetailsController(req, res) {
  const id = req.params.id;
  const url = `${tmdbUrl}/tv/${id}?language=en-US`;
  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      res.render("tv/details", { show: json });
    })
    .catch((err) => console.error(err));
}

export function watchTvShow(req, res) {
  const id = req.params.id;
  const season = req.params.season;
  const episode = req.params.episode;
  res.render("tv/watch", { id, season, episode });
}

