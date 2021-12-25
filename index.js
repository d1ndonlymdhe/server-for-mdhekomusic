const express = require("express");
const Innertube = require("youtubei.js");
const app = express();
const fs = require("fs");
const EventEmitter = require("events");
class emmitter extends EventEmitter {}

async function start() {}

app.get("/", (req, res) => {
  res.send("server is working");
});

app.get("/song.mp3", (req, res) => {
  const stream = ytdl("https://www.youtube.com/watch?v=v73QW4UbeLg", {
    filter: "audioonly",
  });
  stream.pipe(res);
});

app.get("/search", (req, res) => {
  search(req.query.searchTerm);
  res.send;
});
// console.log(search("abcdef"));
// const resultArr = [];
//   for (let i = 0; i < 10; i++) {
//     const video = result.videos[i];
//     const title = video.title;
//     const videoUrl = video.url;
//     const channel = video.author;
//     const thumbnail = video.metadata.thumbnails[0];
//     resultArr.push({
//       title,
//       videoUrl,
//       channel,
//       thumbnail,
//     });
//     }
//   }

async function search(searchTerm) {
  const youtube = await new Innertube();
  const eventEmmitter = new emmitter();
  console.log(searchTerm);
  const result = await youtube.search(searchTerm);
  console.log(result);
  fs.writeFile("data.json", JSON.stringify(result), (err) => {
    if (err) {
      console.log(err);
    }
  });

  return result;
}
