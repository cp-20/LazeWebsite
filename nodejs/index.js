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
        console.log(stdout);
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
    exec('rm -f ' + input.filename + ' .' + input.filename);

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
      exec('echo \"' + input.value + '\" > /media/usb/compilerserver/accounts/' + users.get(socket.id) + '/' + input.filename, (err, stdout, stderr) => {
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
    }
  })
});

http.listen(port, () => {
    console.log(`Compiler Server listening at http://rootlang.ddns.net`);
  });
  
