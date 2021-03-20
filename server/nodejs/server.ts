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

let users: Map<string, string> = new Map();
let usersDirectory: Map<string, string> = new Map();

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
      let tempfolders = new Map([...folders].sort((a, b) => Number(a[0] > b[0])));
      tempfolders.forEach(folder => {
        console.log(folder);
        result.folder.push(folder);
      })
      let tempfiles = new Map([...files].sort((a, b) => Number(a[0] > b[0])));
      tempfiles.forEach(file => {
        console.log(result.folder.push(file));
      }); 
    }
    console.log(result);
    return result;
  });
}

io.sockets.on('connection', (socket:any) => {
    var address = socket.handshake.address;
    console.log('New connection from ' + JSON.stringify(address) + socket.id);
    //defaultはguestとして入る
    users.set(socket.id, "guest");
    fs.mkdir(accountsDir + 'guest/' + socket.id, (err) => {
      if(err)
      {
        console.log('could not create ' + accountsDir + 'guest/' + socket.id);
      }
    });
    usersDirectory.set(socket.id, accountsDir + 'guest/' + socket.id);
    socket.on('compile', async input => {
      // コンパイル
      exec('echo \"' + input.value + '\" > ' + usersDirectory.get(socket.id) + '/' + input.filename);
      exec('./compiler ' + input.filename + ' ' + usersDirectory.get(socket.id) + '/', (err, stdout, stderr) =>
      {
        // 出力
          console.log(err, stdout, stderr);
          if(err) {
            socket.emit('output', {
              value: stderr,
              style: 'err'
            });
          }else {
            socket.emit('output', {
              value: stdout,
              style: 'log'
            })
          }
          return;
      }
      );
      exec('sudo rm -f ' + input.filename + ' .' + input.filename);
  
    })
    socket.on('save', async input => {
      //ファイルにセーブ
      if(users.get(socket.id) == 'guest')
      {
        socket.emit('saved', {
          value: 'If you want to save a file, please create an account.',
          style: 'err',
          success: false
        })
      }
      else{
        exec('echo \"' + input.value + '\" > ' + usersDirectory.get(socket.id) + '/' + input.projectName + '/' + input.filename, (err, stdout, stderr) => {
          if(err) {
            socket.emit('saved', {
              value: stderr + ' : Save not complete.',
              style : 'err',
              success: false
            })
          }
          else
          {
            socket.emit('saved', {
              value: 'Save complete.',
              style: 'info',
              success: true
            })
          }
          return;
        });
      };
    });
    //loginシステム
    socket.on('login', async input => 
    {
      //usersのvalueをアカウント名にする
      users.set(socket.id, input.accountName);
      usersDirectory.set(socket.id, accountsDir + input.accountName);
    });
    //すでに作られたProjectをロードする
    socket.on('loadProject', async input => 
    {
      let result = {type: 'folder', name: input.projectName, folder: []};
      // console.log(readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result));
      readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result).then((val) => {
        socket.emit('loadedProject', {
          value: val,
          style: 'log'
        });
      });
    });
    //Projectを作る
    socket.on('createProject', async input => {
      fs.mkdir(usersDirectory.get(socket.id) + '/' + input.projectName, (err) => {
        if(err)
        {
          socket.emit('createdProject', {
            value: 'Could not create project '+ input.projectName,
            style: 'err'
          })
        }
        else
        {
          socket.emit('createdProject', {
            value: 'Created project ' + input.projectName,
            style: 'log'
          })
        }
      });
    })
    //disconnectしたとき
    socket.on('disconnect', () => {
      console.log("a");
      if(users.get(socket.id) == 'guest')
      {
        fs.rmdir(usersDirectory.get(socket.id), (err) => {
          console.log(usersDirectory.get(socket.id));
        });        
      }
    })
  });
  