const { Router } = require("express");
const {
  getCategory,
  getGamesOfGenre,
  getGamesOfDeveloper,
} = require("../models/queries");
const categoryRouter = Router();

function cleanData(data) {
  let cleaned_data = [];
  let map = new Map();
  let i = 0;
  for (game of Array.from(data)) {
    if (!map.has(game.id)) {
      cleaned_data.push({
        ...game,
        genre: [game.genre],
        developer: [game.developer],
      });
      map.set(game.id, i);
      i++;
    } else {
      let j = map.get(game.id);
      cleaned_data[j] = {
        ...cleaned_data[j],
        genre: Array.from(new Set([...cleaned_data[j].genre, game.genre])),
        developer: Array.from(
          new Set([...cleaned_data[j].developer, game.developer])
        ),
      };
    }
  }
  return cleaned_data;
}

categoryRouter.use("/genres/:genre", async (req, res) => {
  const data = await getGamesOfGenre(req.params.genre);

  res.render("itemList", {
    data: cleanData(data),
  });
});

categoryRouter.use("/developers/:developer", async (req, res) => {
  const data = await getGamesOfDeveloper(req.params.developer);

  res.render("itemList", {
    data: cleanData(data),
  });
});

categoryRouter.use("/genres", async (req, res) => {
  const data = await getCategory("genres");
  res.render("category", {
    category: "Genres",
    data: Array.from(data.map((e) => e.genre)),
  });
});

categoryRouter.use("/developers", async (req, res) => {
  const data = await getCategory("developers");
  res.render("category", {
    category: "Developers",
    data: Array.from(data.map((e) => e.developer)),
  });
});

module.exports = categoryRouter;
