import express from "express";
import Innertube from "youtubei.js";
import ytdl from "ytdl-core";
import { Stream } from "stream";
import fs from "fs";
const app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/song", (req, res) => {
  const url = req.query.url;
  if (typeof url == "string") {
    const stream = ytdl(url, {
      filter: "audioonly",
    });
    stream.pipe(res);
  }
});

app.get("/", (req, res) => {
  res.send("server is working");
});

app.get("/search", (req, res) => {
  const searchTerm = req.query.searchTerm;
  if (typeof searchTerm == "string") {
    const result: any = search(searchTerm);
    result.then((data: any) => {
      console.log(data);
      const resultArr: object[] = [];
      for (let i = 0; i < 10; i++) {
        const video = data.videos[i];
        const title = video.title;
        const videoUrl = video.url;
        const channel = video.author;
        const thumbnail = video.metadata.thumbnails[0];

        resultArr.push({ title, videoUrl, channel, thumbnail });
      }
      res.send(resultArr);
    });
  }
});

app.listen(4000, () => {
  console.log("listening on 4000");
});

async function search(query: string) {
  const youtube = await new Innertube();
  const result: any = await youtube.search(query);
  //   const resultArr: object[] = [];
  //   for (let i = 0; i < 10; i++) {
  //     const video = result.videos[i];
  //     const title = video.title;
  //     const videoUrl = video.url;
  //     const channel = video.author;
  //     const thumbnail = video.metadata.thumbnails[0];

  //     resultArr.push({ title, videoUrl, channel, thumbnail });
  //   }
  // return resultArr;
  return result;
}
