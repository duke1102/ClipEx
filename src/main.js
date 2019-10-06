import dotenv from "dotenv";
import TwitchClient from "twitch";
import fs from "fs";
import path from "path";
import axios from "axios";
import yargs from "yargs";

yargs
  .usage(
    "Usage: node $0 --user [string] (optional: --start [num] --token [string] --clientid [string] --help)"
  )
  .demandOption(["user"]);

dotenv.config();

const CLIP_TYPE = yargs.argv.game;

if (
  (yargs.argv.token == undefined || typeof yargs.argv.token == "boolean") &&
  (yargs.argv.clientid == undefined ||
    typeof yargs.argv.clientid == "boolean") &&
  (process.env.TWITCH_CLIENT_ID == "" || process.env.TWITCH_ACCESS_TOKEN == "")
) {
  console.error(
    "Error, no twitch authentication specified in args or .env file, see .env.example for help."
  );
  process.exit();
}

if (
  typeof yargs.argv.user == "boolean" ||
  typeof yargs.argv.user == "undefined" ||
  yargs.argv.user.length == 0
) {
  console.error("Error, no twitch channel or game specified.");
  process.exit();
}
const startAt = isNaN(yargs.argv.start) ? 0 : Math.abs(yargs.argv.start);
const clientId = yargs.argv.clientid || process.env.TWITCH_CLIENT_ID;
const clientSecret =
  yargs.argv.clientsecret || process.env.TWITCH_CLIENT_SECRET;
const refreshToken =
  yargs.argv.refreshtoken || process.env.TWITCH_REFRESH_TOKEN;
const accessToken = yargs.argv.accesstoken || process.env.TWITCH_ACCESS_TOKEN;
const limit = yargs.argv.limit || 100;
const startDate = yargs.argv.start || undefined;
const endDate = yargs.argv.end || undefined;

const downloadFile = async (url, fileName) => {
  const filePath = `./clips_${yargs.argv.user}/${fileName}`;
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream"
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

const clipex = async () => {
  await fs.mkdir(`./clips_${yargs.argv.user}`, err => {
    return err;
  });

  const twitchClient = await TwitchClient.withCredentials(
    clientId,
    accessToken,
    undefined,
    {
      clientSecret,
      refreshToken,
      onRefresh: token => {
        console.log("refresh token", token);
      }
    }
  );
  const user = !CLIP_TYPE
    ? await twitchClient.helix.users.getUserByName(yargs.argv.user)
    : await twitchClient.helix.games.getGameByName(yargs.argv.user);
  if (user == null) {
    console.error(
      `Error, couldn't find the user "${yargs.argv.user}" on Twitch.`
    );
    process.exit();
  }
  const request = !CLIP_TYPE
    ? await twitchClient.helix.clips.getClipsForBroadcaster(user.id, {
        limit: limit,
        startDate: startDate,
        endDate: endDate
      })
    : await twitchClient.helix.clips.getClipsForGame(user.id, {
        limit: limit,
        startDate: startDate,
        endDate: endDate
      });
  let clipser = await request;
  console.log(`Found ${clipser.data.length} clips.`);
  if (startAt > clipser.data.length) {
    console.error("Given start index greater than clips found, exiting.");
    process.exit();
  }

  for (let i = startAt; i < clipser.data.length; i++) {
    const element = clipser.data[i];
    let tmpUrl = element._data.thumbnail_url;
    tmpUrl = tmpUrl.replace(/-preview-.{1,}\.{1}.{1,}$/gim, ".mp4");
    let tmpName = element._data.id + ".mp4";
    const identifier = CLIP_TYPE
      ? element._data.broadcaster_name
      : yargs.argv.user;
    console.log(
      `Downloading ${i + 1}/${clipser.data.length} -> ${identifier}_${tmpName}`
    );
    await downloadFile(tmpUrl, `${identifier}_${tmpName}`).catch(err => {
      console.error(`Error downloading "${tmpName}"`);
    });
  }
};

clipex().catch(err => {
  console.error(err);
});
