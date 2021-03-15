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

io.on('connection', socket => {
  console.log('connected!');
  socket.on('compile', async input => {
    // コンパイル
    exec('./compiler test.lang', (err, stdout, stderr) =>
    {
      // 出力
        if(err) {
          socket.emit('output', {
            success: false,
            value: stderr
          });
        }else {
          socket.emit('output', {
            success: true,
            value: stdout
          })
        }
        return;
    }
    );

  })
});

http.listen(port, () => {
  console.log(`Compiler Server listening at http://rootlang.ddns.net`);
});
