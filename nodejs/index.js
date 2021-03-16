#!/usr/bin/env node

const express = require('express');
const { exec } = require('child_process');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = 80;

app.use('/', express.static('/home/pi/compilerserver/Compiler/'));
app.get('/', (req, res) => {
  res.sendFile('/home/pi/compilerserver/Compiler/index.html');
});

io.sockets.on('connection', socket => {
  var address = socket.handshake.address;
  console.log('New connection from ' + JSON.stringify(address));
  socket.on('compile', async input => {
    // コンパイル
    exec('echo \"' + input + '\" > test.lang');
    exec('./compiler test.lang', (err, stdout, stderr) =>
    {
      // 出力
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

  })
  socket.on('save', async input => {
    exec('echo \"' + input + '\" > /media/usb/compilerserver/testsavefile.lang');
    socket.emit('output', {
      value: 'Successfully saved!',
      style: 'info'
    });
  })
});

http.listen(port, () => {
    console.log(`Compiler Server listening at http://rootlang.ddns.net`);
  });
  
