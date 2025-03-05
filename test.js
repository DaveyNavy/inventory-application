require("dotenv").config();

const URL = `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_API_KEY}&grant_type=client_credentials`;

async function getData() {
  const response = await fetch(URL, { method: "POST", mode: "cors" });
  const json = await response.json();
  console.log(json);
}

getData();
