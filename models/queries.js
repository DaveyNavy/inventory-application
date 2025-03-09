require("dotenv").config();
const { Client } = require("pg");

async function getCategory(category) {
  const client = new Client({
    connectionString: `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@localhost:5432/video_games_inventory`,
  });
  await client.connect();

  const data = (await client.query("SELECT * FROM " + category)).rows;

  await client.end();

  return data;
}

async function getGamesOfGenre(subcategory) {
  const client = new Client({
    connectionString: `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@localhost:5432/video_games_inventory`,
  });
  await client.connect();

  const data = (
    await client.query(
      `SELECT subquery.id, name, cover_img, rating, genre, developer
      FROM 
      (SELECT games.id AS id, name, cover_img, rating FROM games 
      JOIN game_genres ON games.id = game_genres.game_id 
      JOIN genres ON genres.id = game_genres.genre_id       
      WHERE genre = $1) subquery
      JOIN game_genres ON subquery.id = game_genres.game_id 
      JOIN game_developers ON subquery.id = game_developers.game_id
      JOIN genres ON genres.id = game_genres.genre_id 
      JOIN developers ON developers.id = game_developers.developer_id;
      `,
      [subcategory]
    )
  ).rows;
  await client.end();

  return data;
}

async function getGamesOfDeveloper(subcategory) {
  const client = new Client({
    connectionString: `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@localhost:5432/video_games_inventory`,
  });
  await client.connect();

  const data = (
    await client.query(
      `SELECT subquery.id, name, cover_img, rating, genre, developer
    FROM 
    (SELECT games.id AS id, name, cover_img, rating FROM games 
    JOIN game_developers ON games.id = game_developers.game_id 
    JOIN developers ON developers.id = game_developers.developer_id       
    WHERE developer = $1) subquery
    JOIN game_genres ON subquery.id = game_genres.game_id 
    JOIN game_developers ON subquery.id = game_developers.game_id
    JOIN genres ON genres.id = game_genres.genre_id 
    JOIN developers ON developers.id = game_developers.developer_id;
    `,
      [subcategory]
    )
  ).rows;

  await client.end();

  return data;
}

module.exports = {
  getCategory,
  getGamesOfGenre,
  getGamesOfDeveloper,
};
