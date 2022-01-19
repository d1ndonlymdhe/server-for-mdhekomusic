"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
//@ts-ignore
// import Innertube from "youtubei.js";
const node_cmd_1 = __importDefault(require("node-cmd"));
const cmd = node_cmd_1.default;
const index_1 = require("../youtubei/dist/index");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
// import { Stream } from "stream";
const fs_1 = __importDefault(require("fs"));
// import { nextTick } from "process";
const youtube = new index_1.Client();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
let py = "python3";
let pyFile = "dist/index.py";
if (port == 4000) {
    py = "py";
    pyFile = "index.py";
}
let cacheInfo = JSON.parse(fs_1.default.readFileSync("./recentCache/cacheInfo.json", {
    encoding: "utf-8",
}));
const cacheState = [];
const maxCacheItems = 10;
const queueLength = 10;
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get("/getQueue", (req, res) => {
    const url = req.query.url;
    // const oldQueue = <queueEl>JSON.parse(<string>req.query.data).oldQueue;
    let queue = [];
    getNext(url, queueLength, []).then((data) => {
        queue = data;
        res.send(queue);
    });
    const queueData = cmd.runSync(`py `);
});
app.get("/getNext", (req, res) => {
    const url = req.query.url;
    const oldQueueIds = JSON.parse(req.query.data).oldQueueIds;
    const length = parseInt(req.query.length);
    let queue = [];
    getNext(url, length, oldQueueIds).then((data) => {
        queue = data;
        // res.setHeader({ type: "cors" });
        res.send(queue);
    });
});
app.get("/song", (req, res) => {
    try {
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
    }
    catch (err) {
        if (err) {
            res.send("err");
        }
    }
});
app.get("/", (req, res) => {
    res.send("server is working");
});
app.get("/search", (req, res) => {
    const searchTerm = req.query.searchTerm;
    const resArr = [];
    const runThis = `${py} ${pyFile} "${searchTerm}" search`;
    console.log(runThis);
    const results = JSON.parse(cmd.runSync(runThis).data).data;
    // console.log(results);
    const length = results.length < 10 ? results.length : 10;
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
async function search(query) {
    const result = await youtube.search(query, {
        type: "video",
    });
    return result;
}
async function getNext(id, length, oldQueueIds) {
    console.log(oldQueueIds);
    const q = [];
    let a = 0;
    for (let i = 0; i < length; i++) {
        const video = await youtube.getVideo(id);
        let next;
        do {
            next = getRelated(video, a);
            // console.log(video.related[a]);
            // console.log(next.id);
            a++;
        } while (q.map((el) => el.id).includes(next.id) ||
            oldQueueIds.includes(next.id));
        a = 0;
        const nextID = next.id;
        const nextUrl = `https://www.youtube.com/watch?v=${nextID}`;
        // console.log(video);
        id = nextID;
        const nextTitle = next.title;
        const nextThumbnail = next.thumbnails[0];
        const nextChannel = next.channel?.name;
        q.push({
            id: nextID,
            videoUrl: nextUrl,
            title: nextTitle,
            thumbnail: nextThumbnail,
            channel: nextChannel,
        });
    }
    return q;
}
function getRelated(video, a) {
    let next;
    // try {
    next = video?.related[a];
    // } catch (err) {
    //   console.log("error");
    //   next = getRelated(video, a);
    // }
    return next;
}
function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return match && match[7].length == 11 ? match[7] : false;
}
