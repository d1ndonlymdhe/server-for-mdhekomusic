"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
//@ts-ignore
const node_cmd_1 = __importDefault(require("node-cmd"));
const cors_1 = __importDefault(require("cors"));
const cmd = node_cmd_1.default;
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const fs_1 = __importDefault(require("fs"));
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
app.use((0, cors_1.default)());
app.get("/getQueue", (req, res) => {
    console.log("getting Queue");
    const videoUrl = req.query.url;
    const id = youtube_parser(videoUrl);
    const length = parseInt(req.query.length, 10);
    const retArr = [];
    const oldQueueIds = (JSON.parse(req.query.data).oldQueueIds);
    for (let i = 0; i < length; i++) {
        let a = 0;
        let next;
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
function resultToForResArr(res) {
    return {
        title: res.title,
        thumbnail: res.thumbnail,
        videoUrl: `https://www.youtube.com/watch?v=${res.id}`,
        channel: res.channel,
    };
}
function getNext2(id, index) {
    const next = runPy("getNext", [id, `${index}`]);
    console.log(next);
    return next;
}
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
    const results = runPy("search", [searchTerm]);
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
function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return match && match[7].length == 11 ? match[7] : false;
}
function runPy(func, arrOfArgs) {
    let runThis = `${py} ${pyFile} ${func}`;
    arrOfArgs.forEach((arg) => {
        runThis = runThis.concat(` ${arg}`);
    });
    console.log(runThis);
    return JSON.parse(cmd.runSync(runThis).data).data;
}
