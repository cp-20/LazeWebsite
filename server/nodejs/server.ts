import { ExpressionStatement } from "typescript";

import express from 'express';
import fs from 'fs';
import http from 'http';
const path = require('path');
const {exec} = require('child_process');
const app: express.Express = express();
const server: http.Server = new http.Server(app);
const io = require('socket.io')(http);
const port : number = 80;

const accountsDir: string = '/media/usb/compilerserver/accounts';
const rootDir: string = path.resolve(__dirname, '../../');

//request時に実行するmiddleware function
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction)
{
    console.log('Request URL: ', req.originalUrl);
    next();
}

app.use(express.static(rootDir));
app.use(authenticate);

app.get('/', (req: express.Request, res: express.Response) => {
    res.sendFile('client/index.html', {root: rootDir});
})

app.get('/login', (req: express.Request, res: express.Response) => {
    res.sendFile('client/login.html', {root: rootDir});
})

app.get('/editor', (req: express.Request, res: express.Response) => {
    res.sendFile('client/editor.html', {root: rootDir});
})

app.get('/docs', (req: express.Request, res: express.Response) => {
    res.sendFile('client/docs.html', {root: rootDir});
})

app.get('/admin', (req: express.Request, res: express.Response) => {
    res.sendFile('client/admin.html', {root: rootDir});
})

let users = new Map();
let usersDirectory = new Map();

async function readDirectory(path: string, socket: any, result: dirObject)
{
  return fs.readdir(path, {withFileTypes: true},(err, content)=>{
    if(err)
    {
      socket.emit('loadedProject', {
        value: 'Could not load folder ' + path,
        style: err
      });
    }
    else
    {

      let files = new Map();
      let folders = new Map();
      content.forEach(async element => {
        if(element.isFile()){
          files.set(element.name, {type: 'file', name: element.name});
        }
        else if(element.isDirectory()){
          // console.log('a');
          // let val = await readDirectory(path + '/' + element.name, socket, {type: 'folder', name: element.name, folder: []});
          console.log(await readDirectory(path + '/' + element.name, socket, {type: 'folder', name: element.name, folder: []}));
          folders.set(element.name, await readDirectory(path + '/' + element.name, socket, {type: 'folder', name: element.name, folder: []}));
        }
      })
      let tempfolders = new Map([...folders].sort((a, b) => a[0] > b[0]));
      tempfolders.forEach(folder => {
        console.log(folder);
        result.folder.push(folder);
      })
      let tempfiles = new Map([...files].sort((a, b) => a[0] > b[0]));
      tempfiles.forEach(file => {
        console.log(result.folder.push(file));
      }); 
    }
    console.log(result);
    return result;
  });
}