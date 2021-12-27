"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const youtubei_1 = require("youtubei");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
// import { Stream } from "stream";
// import fs from "fs";
const youtube = new youtubei_1.Client();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get("/song", (req, res) => {
    const url = req.query.url;
    if (typeof url == "string") {
        const stream = (0, ytdl_core_1.default)(url, {
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
    const resArr = [];
    search(searchTerm)
        .then((results) => {
        const length = results.length < 10 ? results.length : 10;
        for (let i = 0; i < length; i++) {
            const title = results[i].title;
            const thumbnail = results[i].thumbnails;
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
