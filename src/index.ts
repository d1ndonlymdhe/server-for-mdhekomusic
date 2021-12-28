import express from "express";
//@ts-ignore
// import Innertube from "youtubei.js";
import { ChannelCompact, Client, Thumbnails, VideoCompact } from "youtubei";
import ytdl from "ytdl-core";
// import { Stream } from "stream";
import fs from "fs";
const youtube = new Client();
const app = express();
const port = process.env.PORT || 4000;

type cacheStateType = {
  position: number;
  name: string;
};

type cacheInfo = {
  totalItems: number;
  firstItem: string;
  data: cacheStateType[];
};
let abcd = fs.readFileSync("./recentCache/cacheInfo.json", {
  encoding: "utf-8",
});
let cacheInfo: cacheInfo = JSON.parse(
  fs.readFileSync("./recentCache/cacheInfo.json", {
    encoding: "utf-8",
  })
);
const cacheState: cacheStateType[] = [];
const maxCacheItems = 10;
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/song", (req, res) => {
  const url = <string>req.query.url;
  const id = youtube_parser(url);
  let foundInCache = false;
  console.log("searching");

  for (let i = 0; i < cacheInfo.totalItems; i++) {
    console.log(
      cacheInfo.data[i].name,
      `${id}.mp3`,
      cacheInfo.data[i].name == `${id}.mp3`
    );
    if (cacheInfo.data[i].name == `${id}.mp3`) {
      const stream = fs.createReadStream(`./recentCache/${id}.mp3`);
      stream.pipe(res);
      console.log("playing from cache");
      foundInCache = !foundInCache;
    }
  }
  console.log(foundInCache);
  if (typeof url == "string" && !foundInCache) {
    const stream = ytdl(url, {
      filter: "audioonly",
    });
    const writeStream = fs.createWriteStream(`./recentCache/${id}.mp3`, {});
    writeStream.on("finish", () => {
      console.log("finished");
      if (cacheInfo.totalItems === 0) {
        cacheInfo.data.push({
          position: cacheInfo.totalItems + 1,
          name: `${id}.mp3`,
        });
        cacheInfo.totalItems = cacheInfo.data.length;
        cacheInfo.firstItem = cacheInfo.data[0].name;
      } else if (cacheInfo.totalItems < maxCacheItems) {
        cacheInfo.totalItems = cacheInfo.totalItems + 1;
        cacheInfo.firstItem = cacheInfo.data[0].name;
        cacheInfo.data.push({
          position: cacheInfo.totalItems + 1,
          name: `${id}.mp3`,
        });
      } else {
        fs.unlink(`./recentCache/${cacheInfo.firstItem}`, (err) => {
          console.log(`deleted ${cacheInfo.firstItem}`);
        });
        let newCacheData = cacheInfo.data;
        newCacheData.reverse().pop();
        newCacheData.reverse();
        newCacheData = newCacheData.map((e) => {
          e.name = e.name;
          e.position = e.position - 1;
          return e;
        });
        cacheInfo.data = newCacheData;
        cacheInfo.firstItem = cacheInfo.data[0].name;
        cacheInfo.totalItems = 10;
        cacheInfo.data.push({
          position: 10,
          name: `${id}.mp3`,
        });
      }
      fs.writeFile(
        `./recentCache/cacheInfo.json`,
        JSON.stringify(cacheInfo),
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    });
    if (cacheState.length == maxCacheItems) {
    }
    stream.pipe(writeStream);
    console.log("writing");
    stream.pipe(res);
  }
});

app.get("/", (req, res) => {
  res.send("server is working");
});

type forResArr = {
  title: string;
  thumbnail: Thumbnail;
  videoUrl: string;
  channel: ChannelCompact;
};
type Thumbnail = {
  url: string;
  width: number;
  height: number;
};
app.get("/search", (req, res) => {
  const searchTerm: string = <string>req.query.searchTerm;
  const resArr: forResArr[] = [];
  search(searchTerm)
    .then((results) => {
      const length: number = results.length < 10 ? results.length : 10;
      for (let i = 0; i < length; i++) {
        const title = <string>results[i].title;
        const thumbnails = <Thumbnails>results[i].thumbnails;
        const thumbnail = {
          url: thumbnails[0].url,
          height: thumbnails[0].height,
          width: thumbnails[0].width,
        };
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

  return result;
}

function youtube_parser(url: string) {
  var regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return match && match[7].length == 11 ? match[7] : false;
}
