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
  socket.on('compile', async input => {
    // コンパイル
    exec('./home/pi/compilerserver/Compiler/compiler3/compiler test.lang', (err, stdout, stderr) =>
    {
      // 出力
        if(err) {
          socket.emit('output', {
            success: false,
            value: err
          });
          return;
        }else {
          socket.emit('output', {
            success: true,
            value: err
          })
        }
    }
    );

  })
});

app.listen(port, () => {
<<<<<<< HEAD
    console.log(`Compiler Server listening at http://rootlang.ddns.net`);
  });
  
=======
  console.log(`Compiler Server listening at http://rootlang.ddns.net`);
});
>>>>>>> 67fa7cca256ec406aed5760a3759244b903b55ca
