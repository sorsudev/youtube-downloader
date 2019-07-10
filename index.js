const url = 'https://youtube.com/watch?v=';
const got = require('got');
const cheerio = require('cheerio');
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const ytdl = require('ytdl-core');

function processVideo(id){
  let finalUrl = `${url}${id}`;
  console.log(finalUrl);
  return new Promise( (resolve, reject) => {
    ytdl.getInfo(id, (err, info) => {
      if (err) throw err;
      const output = path.resolve(__dirname, `${info.title}.mp4`);
      const video = ytdl(finalUrl);
      let starttime;

      video.pipe(fs.createWriteStream(output));

      video.once('response', () => {
        starttime = Date.now();
      });

      video.on('progress', (chunkLength, downloaded, total) => {
        const percent = downloaded / total;
        const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded`);
        process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
        process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
        process.stdout.write(`, estimated time left: ${(downloadedMinutes / percent - downloadedMinutes).toFixed(2)}minutes `);
        readline.moveCursor(process.stdout, 0, -1);
      });

      video.on('end', () => {
        process.stdout.write('\n\n');
        resolve();
      });

    });
  });
}

got('https://www.youtube.com/playlist?list=PL1PXwlmbNk-qEx7YWPaAggUjEp-LLLtqX').then( res => {
  const $ = cheerio.load(res.body);
  const videoObjects = $('tr');
  let videoIds = [];
  videoObjects.map( (key, videoData) => {
    videoIds.push(videoData['attribs']['data-video-id']);
  });

  let lastId = videoIds[videoIds.length - 1];
  let index = 0;

  function getInfo(id){
    if (id === lastId)
      return processVideo(id).then( ()=> {});

    return processVideo(id).then( ()=> {
      index+=1;
      getInfo(videoIds[index]);
    });
  }

  getInfo(videoIds[index]);
});
