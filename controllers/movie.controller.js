import dotenv from "dotenv";
dotenv.config();

export async function movieIndexController(req, res) {
  const page = req.query.page || 1;
  const query = req.query.query || "";

  const response = await fetch(
    `https://moviesapi.to/api/discover/movie?direction=desc&page=${page}&query=${query}`
  );
  const data = await response.json();

  if (data.result === true) {
    res.render("movies/index", {
      movies: data.data,
      page,
      lastPage: data.last_page,
      query,
    });
  } else {
    res.render("movies/index", { movies: [], page, lastPage: 0, query });
  }
}

export function movieDetailsController(req, res) {
  let id = req.params.id;
  const url = `https://api.themoviedb.org/3/movie/${id}?language=en-US`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_RAT}`,
    },
  };

  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      res.render("movies/details", { movie: json });
    })
    .catch((err) => console.error(err));
}

export function watchMovie(req, res) {
  let id = req.params.id;
  res.render("movies/watch", { id });
}
