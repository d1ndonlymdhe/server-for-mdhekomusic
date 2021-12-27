const express = require("express");
const Innertube = require("youtubei.js");
const {Client} = require("youtubei")
const app = express();
const fs = require("fs");
const EventEmitter = require("events");
class emmitter extends EventEmitter {}

async function start() {}
const youtube = new Client();
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
// search()


search2().then(data=>{
  console.log(data[0].title)
})

async function search(searchTerm) {
  const youtube = await new Innertube();
  const details = youtube.getDetails("yo4pmauhugo")
  const eventEmmitter = new emmitter();
  console.log(searchTerm);
  const result = await youtube.search("Hello");
  console.log(details);
  fs.writeFile("data.json", JSON.stringify(details), (err) => {
    if (err) {
      console.log(err);
    }
  });

  return result;
}
// getDetails("yP6JMJje1ak")
async function getDetails(id){
  const youtube = await new Innertube();
  const details = youtube.getDetails("https://www.youtube.com/watch?v=yo4pmauhugo");
  console.log(details);
  fs.writeFile("data.json",JSON.stringify(details),(err)=>{
    if(err){
      console.log(err)
    }
  })
}


async function search2(){
  const videos = await youtube.search("hello",{
    type:"video"
  })
  console.log(typeof videos)
  for(let i=0;i<videos.length;i++){
    const title = videos[i].title;
    const thumbnail = videos[i].thumbnails;
    const url = `https://www.youtube.com/watch?v=${videos[i].id}`
    const channel = videos[i].channel;
    // console.log(title,thumbnail,url)
  }
  fs.writeFile("data.json",JSON.stringify(videos),(err)=>{
  console.log(err)})
  return videos;
}