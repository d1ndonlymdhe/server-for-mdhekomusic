import express from "express";
//@ts-ignore
import commandline from "node-cmd";
import cors from "cors";
const cmd = commandline;

import ytdl from "ytdl-core";
import fs from "fs";
const app = express();
const port = process.env.PORT || 4000;
let py = "python3";
let pyFile = "dist/index.py";
if (port == 4000) {
  py = "py";
  pyFile = "index.py";
}

type cacheStateType = {
  position: number;
  name: string;
};

type cacheInfo = {
  totalItems: number;
  firstItem: string;
  data: cacheStateType[];
};

let cacheInfo: cacheInfo = JSON.parse(
  fs.readFileSync("./recentCache/cacheInfo.json", {
    encoding: "utf-8",
  })
);
const cacheState: cacheStateType[] = [];
const maxCacheItems = 10;
const queueLength = 10;

app.use(cors());

app.get("/getQueue", (req, res) => {
  console.log("getting Queue");
  const videoUrl = <string>req.query.url;
  const id = <string>youtube_parser(videoUrl);
  const length = parseInt(<string>req.query.length, 10);
  const retArr: forResArr[] = [];
  const oldQueueIds: string[] = <string[]>(
    JSON.parse(<string>req.query.data).oldQueueIds
  );
  for (let i = 0; i < length; i++) {
    let a = 0;
    let next: result;
    do {
      next = getNext2(id, a);
      a++;
    } while (oldQueueIds.includes(next.id));
    a = 0;
    oldQueueIds.push(next.id);
    retArr.push(resultToForResArr(next));
  }
  res.send(retArr);
});
function resultToForResArr(res: result): forResArr {
  return {
    title: res.title,
    thumbnail: res.thumbnail,
    videoUrl: `https://www.youtube.com/watch?v=${res.id}`,
    channel: res.channel,
  };
}
function getNext2(id: string, index: number) {
  // const runThis = `${py} ${pyFile} "${id}" getNext`;
  const next: result = runPy("getNext", [id, `${index}`]);
  console.log(next);
  return next;
}

app.get("/song", (req, res) => {
  try {
    const url = <string>req.query.url;
    const id = <string>youtube_parser(url);
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
  } catch (err) {
    if (err) {
      res.send("err");
    }
  }
});

app.get("/", (req, res) => {
  res.send("server is working");
});

type forResArr = {
  title: string;
  thumbnail: Thumbnail;
  videoUrl: string;
  channel: string;
};
type result = {
  id: string;
  title: string;
  thumbnail: Thumbnail;
  channel: string;
};
type Thumbnail = {
  url: string;
  width: number;
  height: number;
};
app.get("/search", (req, res) => {
  const searchTerm = <string>req.query.searchTerm;
  const resArr: forResArr[] = [];
  // const runThis = `${py} ${pyFile} "${searchTerm}" search`;
  // console.log(runThis);
  const results: result[] = runPy("search", [searchTerm]);
  // console.log(results);
  const length: number = results.length < 10 ? results.length : 10;
  console.log(length, results.length);
  for (let i = 0; i < length; i++) {
    const title = results[i].title;
    const thumbnail = {
      url: results[i].thumbnail.url,
      height: results[i].thumbnail.height,
      width: results[i].thumbnail.width,
    };
    const videoUrl = `https://www.youtube.com/watch?v=${results[i].id}`;
    const channel = results[i].channel;
    resArr.push({ title, thumbnail, videoUrl, channel });
  }
  res.send(resArr);
});

app.listen(port, () => {
  console.log("listening on ", port);
});

type queueEl = {
  id: string;
  videoUrl: string;
  thumbnail: Thumbnail;
  title: string;
  channel: string;
};

function youtube_parser(url: string) {
  var regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return match && match[7].length == 11 ? match[7] : false;
}
function runPy(func: string, arrOfArgs: string[]) {
  let runThis = `${py} ${pyFile} ${func}`;
  arrOfArgs.forEach((arg) => {
    runThis = runThis.concat(` ${arg}`);
  });
  console.log(runThis);
  return JSON.parse(cmd.runSync(runThis).data).data;
}
