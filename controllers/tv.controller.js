import dotenv from "dotenv";
dotenv.config();

export async function tvIndexController(req, res) {

  const page = req.query.page || 1;
  const query = req.query.query || '';
  const response = await fetch(`https://moviesapi.to/api/discover/tv?direction=desc&page=${page}&query=${query}`);
  const data = await response.json();

  if (data.result === true) {
    res.render("tv/index", { shows: data.data, page, lastPage: data.last_page, query });
  } else {
    res.render("tv/index", { shows: [], page, lastPage: 0, query });
  }
}

export function tvDetailsController(req, res) {

  let id = req.params.id;
  const url = `https://api.themoviedb.org/3/tv/${id}?language=en-US`;
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.TMDB_RAT}`
    }
  };

  fetch(url, options)
    .then(res => res.json())
    .then(json => {
      res.render("tv/details", { show: json });
    })
    .catch(err => console.error(err));
}

export function watchTvShow(req, res) {

  let id = req.params.id;
  let season = req.params.season;
  let episode = req.params.episode;
  res.render("tv/watch", { id, season, episode });
}