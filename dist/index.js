"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
//@ts-ignore
// import Innertube from "youtubei.js";
const youtubei_1 = require("youtubei");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
// import { Stream } from "stream";
const fs_1 = __importDefault(require("fs"));
const youtube = new youtubei_1.Client();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
let abcd = fs_1.default.readFileSync("./recentCache/cacheInfo.json", {
    encoding: "utf-8",
});
let cacheInfo = JSON.parse(fs_1.default.readFileSync("./recentCache/cacheInfo.json", {
    encoding: "utf-8",
}));
const cacheState = [];
const maxCacheItems = 10;
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get("/song", (req, res) => {
    const url = req.query.url;
    const id = youtube_parser(url);
    let foundInCache = false;
    console.log("searching");
    for (let i = 0; i < cacheInfo.totalItems; i++) {
        console.log(cacheInfo.data[i].name, `${id}.mp3`, cacheInfo.data[i].name == `${id}.mp3`);
        if (cacheInfo.data[i].name == `${id}.mp3`) {
            const stream = fs_1.default.createReadStream(`./recentCache/${id}.mp3`);
            stream.pipe(res);
            console.log("playing from cache");
            foundInCache = !foundInCache;
        }
    }
    console.log(foundInCache);
    if (typeof url == "string" && !foundInCache) {
        const stream = (0, ytdl_core_1.default)(url, {
            filter: "audioonly",
        });
        const writeStream = fs_1.default.createWriteStream(`./recentCache/${id}.mp3`, {});
        writeStream.on("finish", () => {
            console.log("finished");
            if (cacheInfo.totalItems === 0) {
                cacheInfo.data.push({
                    position: cacheInfo.totalItems + 1,
                    name: `${id}.mp3`,
                });
                cacheInfo.totalItems = cacheInfo.data.length;
                cacheInfo.firstItem = cacheInfo.data[0].name;
            }
            else if (cacheInfo.totalItems < maxCacheItems) {
                cacheInfo.totalItems = cacheInfo.totalItems + 1;
                cacheInfo.firstItem = cacheInfo.data[0].name;
                cacheInfo.data.push({
                    position: cacheInfo.totalItems + 1,
                    name: `${id}.mp3`,
                });
            }
            else {
                fs_1.default.unlink(`./recentCache/${cacheInfo.firstItem}`, (err) => {
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
            fs_1.default.writeFile(`./recentCache/cacheInfo.json`, JSON.stringify(cacheInfo), (err) => {
                if (err) {
                    console.log(err);
                }
            });
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
app.get("/search", (req, res) => {
    const searchTerm = req.query.searchTerm;
    const resArr = [];
    search(searchTerm)
        .then((results) => {
        const length = results.length < 10 ? results.length : 10;
        for (let i = 0; i < length; i++) {
            const title = results[i].title;
            const thumbnails = results[i].thumbnails;
            const thumbnail = {
                url: thumbnails[0].url,
                height: thumbnails[0].height,
                width: thumbnails[0].width,
            };
            const videoUrl = `https://www.youtube.com/watch?v=${results[i].id}`;
            //@ts-ignore
            const channel = results[i].channel;
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
async function search(query) {
    const result = await youtube.search(query, {
        type: "video",
    });
    return result;
}
function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return match && match[7].length == 11 ? match[7] : false;
}
