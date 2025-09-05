export function indexController(req, res) {
  res.render("index");
}

export function errorController(req, res) {
  res.status(404).render("error", { error: "Page not found" });
}
