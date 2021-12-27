import express from "express";
//@ts-ignore
import Innertube from "youtubei.js";
import { ChannelCompact, Client, Thumbnails, VideoCompact } from "youtubei";
import ytdl from "ytdl-core";
// import { Stream } from "stream";
// import fs from "fs";
const youtube = new Client();
const app = express();
const port = process.env.PORT || 4000;
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

type forResArr = {
  title: string;
  thumbnail: Thumbnails;
  videoUrl: string;
  channel: ChannelCompact;
};

app.get("/search", (req, res) => {
  const searchTerm: string = <string>req.query.searchTerm;
  const resArr: forResArr[] = [];
  search(searchTerm)
    .then((results) => {
      const length: number = results.length < 10 ? results.length : 10;
      for (let i = 0; i < length; i++) {
        const title = <string>results[i].title;
        const thumbnail = <Thumbnails>results[i].thumbnails;
        const videoUrl = `https://www.youtube.com/watch?v=${results[i].id}`;
        //@ts-ignore
        const channel: ChannelCompact = results[i].channel;
        resArr.push({ title, thumbnail, videoUrl, channel });
      }
      res.send(resArr);
    })
    .catch((err) => {
      if (err) {
        console.log(err);
      }
    });
});

app.listen(port, () => {
  console.log("listening on ", port);
});

async function search(query: string) {
  const result = await youtube.search(query, {
    type: "video",
  });
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
