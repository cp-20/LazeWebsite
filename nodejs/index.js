const express = require('express');
const { exec } = require('child_process');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = 80;

//socket.idをkey、アカウント名をvalueとしたmap
let users = new Map();

app.use('/', express.static('/home/pi/compilerserver/Compiler/'));
app.get('/', (req, res) => {
  res.sendFile('/home/pi/compilerserver/Compiler/index.html');
});

io.sockets.on('connection', socket => {
  var address = socket.handshake.address;
  console.log('New connection from ' + JSON.stringify(address) + socket.id);
  //defaultはguestとして入る
  users.set(socket.id, "guest");
  socket.on('compile', async input => {
    // コンパイル
    exec('echo \"' + input.value + '\" > ' + input.filename);
    exec('./compiler ' + input.filename, (err, stdout, stderr) =>
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
    //ファイルにセーブ
    exec('echo \"' + input.value + '\" > /media/usb/compilerserver/accounts/' + users.get(socket.id) + '/' + input.filename, (err, stdout, stderr) => {
      if(err) {
        socket.emit('output', {
          value: stderr + ' : Save not complete.',
          style : 'err'
        })
      }
      else
      {
        socket.emit('output', {
          value: 'Save complete.',
          style: 'info'
        })
      }
      return;
    });
  })
});

http.listen(port, () => {
    console.log(`Compiler Server listening at http://rootlang.ddns.net`);
  });
  
