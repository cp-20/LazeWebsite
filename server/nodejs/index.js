#!/usr/bin/env node

const express = require('express');
const { exec } = require('child_process');
const rimraf = require("rimraf");
const fs = require('fs');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = 80;

const accountsDir = '/media/usb/compilerserver/accounts/';

fs.mkdir(accountsDir + 'guest', (err) => {
  if(err){
    console.log(err);
  }
});
//socket.idをkey、アカウント名をvalueとしたmap
let users = new Map();
let usersDirectory = new Map();

//ディレクトリー読むための再帰関数
async function readDirectory(path, socket, result, callback)
{
  return new Promise((resolve, reject) => {
    fs.readdir(path, {withFileTypes: true},async (err, content)=>{
      if(err)
      {
        console.log('couldnt load project', 24);
        socket.emit('loadedProject', {
          value: 'Could not load folder ' + path,
          style: err
        });
      }
      else
      {
        let files = new Map();
        let folders = new Map();
        let fn = function processContent(element) {
          if(element.isFile())
          {
            files.set(element.name, {type: 'file', name : element.name});
            return {type: 'file', name : element.name};
          }
          else if(element.isDirectory())
          {
            return readDirectory(path + '/' + element.name, socket, {type: 'folder', name: element.name, folder: []}, (val) => {
              folders.set(element.name, val);
             return val;
            });
          }
        }
        
        let temp = await Promise.all(content.map(fn));
        let tempfolders = new Map([...folders].sort((a, b) => a[0] > b[0]));
        tempfolders.forEach(folder => {
          result.folder.push(folder);
        })
        let tempfiles = new Map([...files].sort((a, b) => a[0] > b[0]));
        tempfiles.forEach(file => {
          result.folder.push(file);
        }); 
      }
      resolve(result);
      return callback(result);
    });
  })
}

app.use('/', express.static('/home/pi/compilerserver/Compiler/'));
app.get('/', (req, res) => {
  res.sendFile('/home/pi/compilerserver/Compiler/index.html');
});

io.sockets.on('connection', socket => {
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
    console.log(socket.id);
    //usersのvalueをアカウント名にする
    let temp = users.get(socket.id);
    users.set(socket.id, input.accountName);
    usersDirectory.set(socket.id, accountsDir + input.accountName);
    if(input.accountName == 'admin')
    {
      // console.log('b');
      socket.emit('requestAdminPage', {});
      socket.emit('originalUsername', {
        originalName: temp
      });
    }
  });
  socket.on('adminexec', (input) => 
  {
    let words = input.command.split(' ');
    console.log(socket.id);
    if(words[0] == 'stop')
    {
      rimraf('/media/usb/compilerserver/accounts/guest', () => {
        exec('sudo systemctl stop compilerserver');
      });   
    }
    else if(words[0] == 'restart')
    {
      rimraf('/media/usb/compilerserver/accounts/guest', () => {
        exec('sudo systemctl restart compilerserver');
      }); 
    }
    else if(words[0] == 'list')
    {
      let output = '';
      // console.log(users);
      users.forEach(element => {
        // console.log('a');
        output = output.concat(element, '<br>');
      });
      // console.log(output);
      io.to(socket.id).emit('adminOutEmit', {
        value: output
      });
    }
  })
  socket.on('adminLogout', async input => {
    users.set(socket.id, input.originalName);
    usersDirectory.set(socket.id, accountsDir + input.originalName);
  })
  //すでに作られたProjectをロードする
  socket.on('loadProject', async input => 
  {
    let result = {type: 'folder', name: input.projectName, folder: []};
    // console.log(readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result));
    readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result, (val) => {
      console.log(val, '168');
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
    // console.log("a");
    if(users.get(socket.id) == 'guest')
    {
      fs.rmdir(usersDirectory.get(socket.id), (err) => {
        if(err)
          console.log('./' + usersDirectory.get(socket.id));
      });    
      users.delete(socket.id);    
    }
  })
});

http.listen(port, () => {
    console.log(`Compiler Server listening at http://rootlang.ddns.net`);
  });
  
