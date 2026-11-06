/* Static MP3 packaging check; requires ffprobe (part of ffmpeg). */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const {execFileSync} = require('child_process');
const folder=path.resolve(__dirname,'../assets/audio');
const files=['wind','water_ambience','plant','water','harvest','build','canal','coin','click','upgrade','collect','error','quest'];
for (const key of files) {
  const file=path.join(folder,key+'.mp3');
  assert(fs.existsSync(file),'Missing '+file);
  assert(fs.statSync(file).size>1000,'Suspiciously empty audio '+file);
  const result=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_name,channels,sample_rate,duration','-of','json',file],{encoding:'utf8'}));
  const stream=result.streams&&result.streams[0];
  assert(stream,'Missing audio track: '+key);
  assert.strictEqual(stream.codec_name,'mp3');
  assert.strictEqual(stream.channels,1);
  assert.strictEqual(Number(stream.sample_rate),24000);
  assert(Number(stream.duration)>=.12,'Very short clip: '+key);
  execFileSync('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-i',file,'-f','null','-']);
}
console.log('PASS assets: all 13 MP3 files exist, decode, are 24kHz mono, and have nonzero duration');
