require("dotenv").config();
const { Client } = require("pg");

async function getGames() {
  const url = "https://api.igdb.com/v4/games";
  const options = {
    method: "POST",
    mode: "cors",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: "Bearer 1w8al5dg8nmr2cog74bwktn3ez809q",
    },
    body: `fields cover, genres, name, rating, involved_companies;
            where rating > 75;
            limit 500;`,
  };
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
}

const SQL = `
CREATE TABLE IF NOT EXISTS games (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    cover_img VARCHAR(1023),
    rating NUMERIC(4, 2)
);

CREATE TABLE IF NOT EXISTS genres (
    id INT PRIMARY KEY,
    genre VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS developers (
    id INT PRIMARY KEY,
    developer VARCHAR(255)
);


CREATE TABLE IF NOT EXISTS game_genres (
    game_id INT,
    genre_id INT,
    PRIMARY KEY (game_id, genre_id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (genre_id) REFERENCES genres(id)
);

CREATE TABLE IF NOT EXISTS game_developers (
    game_id INT,
    developer_id INT,
    PRIMARY KEY (game_id, developer_id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (developer_id) REFERENCES developers(id)
);

`;

async function main() {
  console.log("seeding...");
  const client = new Client({
    connectionString: `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@localhost:5432/video_games_inventory`,
  });
  await client.connect();
  await client.query(SQL);
  await client.end();
  console.log("done");
}

main();
