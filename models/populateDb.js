require("dotenv").config();
const { Client } = require("pg");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getGames() {
  const url = "https://api.igdb.com/v4/games";
  const options = {
    method: "POST",
    mode: "cors",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    },
    body: `fields cover, genres, name, rating, involved_companies;
            where rating > 90 & first_release_date > 1420099200;
            limit 100;`,
  };
  const response = await fetch(url, options);
  const data = await response.json();

  async function getCompanyId(involved_company) {
    const response = await fetch("https://api.igdb.com/v4/involved_companies", {
      method: "POST",
      mode: "cors",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      },
      body: `fields id, company;
            where id = ${involved_company};`,
    });
    const json = await response.json();
    const company_id = json[0].company;
    return company_id;
  }

  for (const game of Array.from(data)) {
    const companyIds = [];
    if (game.involved_companies == undefined) continue;
    for (const involved_company of Array.from(game.involved_companies)) {
      let company_id;
      await sleep(250).then(async () => {
        company_id = await getCompanyId(involved_company);
      });
      companyIds.push(company_id);
    }

    game.companies = Array.from(new Set(companyIds));
  }

  return data;
}

async function insertGame(client, game) {
  async function getCoverUrl() {
    const cover_url_response = await fetch("https://api.igdb.com/v4/covers", {
      method: "POST",
      mode: "cors",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      },
      body: `fields url;
            where id = ${game.cover};`,
    });
    const cover_url_json = await cover_url_response.json();
    if (cover_url_json[0].url == undefined) {
      console.log(game);
      return;
    }
    const cover_url = cover_url_json[0].url.slice(2);
    return cover_url;
  }

  const cover_url = await getCoverUrl();

  await client.query("INSERT INTO games VALUES ($1, $2, $3, $4)", [
    game.id,
    game.name,
    cover_url,
    game.rating,
  ]);

  if (game.genres != undefined) {
    for (const genre of game.genres) {
      await client.query("INSERT INTO game_genres VALUES ($1, $2)", [
        game.id,
        genre,
      ]);
    }
  }

  if (game.companies != undefined) {
    for (const company of game.companies) {
      await client.query("INSERT INTO game_developers VALUES ($1, $2)", [
        game.id,
        company,
      ]);
    }
  }
}

async function insertGenres(client) {
  const response = await fetch("https://api.igdb.com/v4/genres", {
    method: "POST",
    mode: "cors",
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    },
    body: `fields id, name;
          limit 500;`,
  });
  const json = await response.json();
  return Promise.all(
    Array.from(json).map((genre) =>
      client.query("INSERT INTO genres VALUES " + `($1, $2)`, [
        genre.id,
        genre.name,
      ])
    )
  );
}

async function insertCompanies(client, companyIds) {
  async function getCompany(company) {
    response = await fetch("https://api.igdb.com/v4/companies", {
      method: "POST",
      mode: "cors",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
      },
      body: `fields id, name;
            where id = ${company};`,
    });
    json = await response.json();
    return json;
  }

  const seen = new Set();
  for (const company of companyIds) {
    if (seen.has(company)) continue;
    seen.add(company);

    let json;
    await sleep(250).then(async () => {
      json = await getCompany(company);
    });

    await client.query("INSERT INTO developers VALUES " + `($1, $2)`, [
      json[0].id,
      json[0].name,
    ]);
  }
}

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS games (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    cover_img VARCHAR(1023),
    rating NUMERIC(5, 2)
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
  await client.query(CREATE_TABLES);

  console.log("Getting games...");
  gamesData = await getGames();

  console.log("Getting genres...");
  await insertGenres(client);

  console.log("Getting companies...");
  let companies = [];
  Array.from(gamesData).forEach((game) => {
    if (game.companies == undefined) return;
    companies = companies.concat(Array.from(game.companies));
  });
  await insertCompanies(client, companies);

  console.log("Inserting games...");
  for (const game of gamesData) {
    await sleep(250).then(async () => {
      await insertGame(client, game);
    });
  }

  await client.end();
  console.log("done");
}
main();
