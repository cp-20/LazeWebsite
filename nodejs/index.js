const express = require('express')
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = 80

app.use('/', express.static('/home/pi/compilerserver/Compiler/'))
app.get('/', (req, res) => {
  res.sendFile('/home/pi/compilerserver/Compiler/index.html');
})

app.listen(port, () => {
  console.log(`Compiler Server listening at http://rootlang.ddns.net`)
})