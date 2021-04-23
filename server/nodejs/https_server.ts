#!/usr/bin/env node

import { ExpressionStatement } from "typescript";

import express from 'express';
import fs from 'fs';
import { Stream } from "stream";
const path = require('path');
const {exec} = require('child_process');
const app: express.Express = express();
//https settings
const rootDir: string = path.resolve(__dirname, '../../');
const https = require('https');
const privateKey = fs.readFileSync(path.resolve(rootDir, 'server/nodejs/privkey.pem'), 'utf8');
const certificate = fs.readFileSync(path.resolve(rootDir, 'server/nodejs/fullchain.pem'), 'utf8');
const credentials = {key: privateKey, cert: certificate};
//http to https auto redirection
const http = require('http');
http.createServer((express()).all("*", function (request, response) {
  response.redirect(`https://${request.hostname}${request.url}`);
})).listen(80);
const httpsServer = https.createServer(credentials, app);
const io = require('socket.io')(httpsServer);
const port : number = 443;
//log function
function LOG(log: any, title: string)
{
  if(typeof log === 'object' && log != null)
    console.log(`${title}(${JSON.stringify(log)})\``);
  else
  console.log(`${title}(${log})\``);
}
//mount usb
const accountsDir: string = '/media/usb/compilerserver/accounts/';
fs.access(accountsDir, (err) => {
  if(err && err.code == 'ENOENT')
  {
    fs.access('/media/pi/A042-416A', (err) => {
      if(!err)
      {
        exec('sudo umount /media/pi/A042-416A', () => {
          exec('sudo mount /dev/sda1 /media/usb', () => {
            LOG('mounted usb', 'status');
          })
        });
      }
      else
      {
        exec('sudo mount /dev/sda1 /media/usb', () => {
          LOG('mounted usb', 'status');
        });
      }
    })
  }
})
//ip filter
var ipList: Array<string>;
fs.readFile('/home/pi/ipBlacklist', (err, data) => {
  if(err)
  {
    LOG('Could not read blacklist.', 'status');
  }
  else
  {
    let blacklistData: string = data.toString();
    ipList = blacklistData.split(';\n');
    LOG(`${ipList.length} blocked ip addresses.`, 'status');
  }
});
// const ipfilter = require('express-ipfilter').IpFilter;
fs.watchFile('/home/pi/ipBlacklist', (curr: any, prev: any) => {
  fs.readFile('/home/pi/ipBlacklist', (err, data) => {
    if(err)
    {
      LOG('Could not read ipBlacklist.', 'status');
    }
    else
    {
      let blacklistData: string = data.toString();
      ipList = blacklistData.split(';\n');
      LOG(`${ipList.length} blocked ip addresses.`, 'status');
      // app.use(ipfilter(ipList));
    }
  });
})
//database (mongoose)
import mongoose from 'mongoose';
const User: mongoose.Model<any, any> = require('./database');
mongoose.connect('mongodb+srv://coder6583:curvingchicken@compilerserver.akukg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {LOG('connected to database', 'status');});

mongoose.Promise = global.Promise;
//passport
import passport from 'passport';
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy( 
  {usernameField: 'loginId', passwordField: 'loginPassword'}, (username: string, password: string, done: any) => {
    LOG('Login Attempt', 'login');
    User.findOne({email: username}).then((user: any) => {
      if(!user)
      {
        User.findOne({username: username}).then((user_: any) => {
          if(!user_)
          {
            LOG('account not found', 'login');
            return done(null, false, {message: 'That email is not registered'});
          }
          bcrypt.compare(password, user_.password, (err, isMatch) => {
            if(err) LOG(err, 'login');
            if(isMatch)
            {
              LOG('logged in!', 'login');
              return done(null, user_);
            }
            else 
            {
              return done(err, false, {message: 'password incorrect'});
            }
          })
        })
        return;
      }
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if(err) LOG(err, 'login');
        if(isMatch)
        {
          LOG('logged in!', 'login');
          return done(null, user);
        }
        else 
        {
          return done(err, false, {message: 'password incorrect'});
        }
      })
    })
  }
));
passport.serializeUser((user: any, done) => {
  done(null, user.id);
})
passport.deserializeUser((id, done) => {
  User.findById(id, (err: any, user: any) => {
    done(err, user);
  })
})

//Login with Google
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(GoogleStrategy);

//bcrypt = hash function
import bcrypt from 'bcrypt';
const rootdirectory: string = path.resolve(rootDir, 'client');
//express session
import session from 'express-session';
import sharedSession from 'express-socket.io-session';

//request時に実行するmiddleware function
function everyRequest(req: express.Request, res: express.Response, next: express.NextFunction)
{
    if(ipList.includes(req.socket.remoteAddress!))
    {
      LOG(`Blacklisted ip tried to access. IP: ${req.socket.remoteAddress}`, 'ip');
      res.send('banned L');
      res.end();
    }
    else
    {
      LOG(`Request URL: ${decodeURI(req.originalUrl)}\nIP: ${req.socket.remoteAddress}`, 'ip');
      next();
    }
}

app.use(express.static(rootdirectory));

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
var sessionMiddleware = session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(everyRequest);


app.get('/', (req: express.Request, res: express.Response) => {
    res.sendFile('index.html', {root: rootdirectory});
})

app.get('/login', (req: express.Request, res: express.Response) => {
    res.sendFile('login.html', {root: rootdirectory});
})

app.post('/login', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  passport.authenticate('local', {
    successRedirect: '/editor',
    failureRedirect: '/login'
  })(req,res,next);
})

app.get('/editor', (req: express.Request, res: express.Response) => {
    LOG(req.user, 'user');
    res.sendFile('editor.html', {root: rootdirectory});
})

app.get('/docs', (req: express.Request, res: express.Response) => {
    res.sendFile('docs.html', {root: rootdirectory});
})

app.get('/admin', (req: express.Request, res: express.Response) => {
    res.sendFile('admin.html', {root: rootdirectory});
})

app.get('/register', (req: express.Request, res: express.Response) => {
  res.sendFile('register.html', {root: rootdirectory});
})

app.post('/register', (req: express.Request, res: express.Response) => {
  const {id, username, email, password, passwordCheck} = req.body;

  const newUser = new User({
    email: email,
    username: id,
    displayName: username || id,
    password: password 
  });
  fs.mkdir(path.resolve(accountsDir, id), () => {
    LOG('created account folder', 'status');
  })
  bcrypt.genSalt(10, (err: Error, salt) => {
    bcrypt.hash(newUser.password, salt,(err: Error, hash) => {
      if(err) LOG('Error hashing password.', 'status');
      newUser.password = hash;
      newUser.save().then((value: any) => {
        LOG(value, 'login');
        res.redirect('/login');
      });
    });
  });
})

app.get('/pass_reset', (req: express.Request, res: express.Response) => {
  res.sendFile('pass_reset.html', {root: rootdirectory});
})

app.get('/register_check/id', (req: express.Request, res: express.Response) => {
  if(req.query.id)
  {
    let userId : any = req.query.id;
    LOG(userId, 'register');
    User.findOne({username: userId}).exec((err: any, user: any) => {
      if(user)
      {
        LOG('there is already an account', 'register');
        res.json({success: false});
      }
      else
      {
        res.json({success: true});
      }
    });
  }
});

app.get('/register_check/email', (req: express.Request, res: express.Response) => {
  if(req.query.email)
  {
    let emailAddress : any = req.query.email;
    LOG(emailAddress, 'register');
    User.findOne({email: emailAddress}).exec((err: any, user: any) => {
      if(user)
      {
        res.json({success: false});
      }
      else
      {
        res.json({success: true});
      }
    });
  }
});


app.get('/node_modules/jquery-resizable-dom/src/jquery-resizable.js', (req: express.Request, res: express.Response) => {
  LOG('get node modules', 'node_modules');
  res.sendFile('/node_modules/jquery-resizable-dom/src/jquery-resizable.js', {root: rootDir});
});

app.get('/avatar/id', (req: express.Request, res: express.Response) => {
  LOG('avatar debug', 'avatar debug');
  let avatarPath = path.resolve(`${accountsDir}${req.query.id}`, 'avatar.png');
  fs.access(avatarPath, (err) => {
		if(err){
			res.sendFile(path.resolve('/home/pi/Compiler/client/assets/icons', 'guest.png'));
		}
		else{
			res.sendFile(avatarPath);
		}
	})
})

let users: Map<string, string> = new Map();
let usersDirectory: Map<string, string> = new Map();
let usersProjectDirectory: Map<string, string> = new Map();

//ディレクトリー読むための再帰関数
async function readDirectory(path: string, socket: any, result: dirObject, callback: Function)
{
  return new Promise((resolve, reject) => {
    fs.readdir(path, {withFileTypes: true},async (err: NodeJS.ErrnoException | null, content: fs.Dirent[])=>{
      if(err)
      {
        LOG(`couldnt load project\n${err}`, 'status');
        socket.emit('loadedProject', {
          value: 'Could not load folder ' + path,
          style: 'err'
        });
      }
      else
      {
        let files: Map<string, dirObject> = new Map();
        let folders: Map<string, dirObject> = new Map();
        let fn = function processContent(element: fs.Dirent) {
          if(element.isFile())
          {
            files.set(element.name, {type: 'file', name : element.name});
            return {type: 'file', name : element.name};
          }
          else if(element.isDirectory())
          {
            return readDirectory(path + '/' + element.name, socket, {type: 'folder', name: element.name, value: []}, (val: dirObject) => {
              folders.set(element.name, val);
             return val;
            });
          }
        }
        
        let temp = await Promise.all(content.map(fn));
        let tempfolders: Map<string, dirObject> = new Map([...folders].sort((a, b) => Number(a[0] > b[0])));
        tempfolders.forEach(folder => {
          if(result.value)
            result.value.push(folder);
        })
        let tempfiles: Map<string, dirObject> = new Map([...files].sort((a, b) => Number(a[0] > b[0])));
        tempfiles.forEach(file => {
          if(result.value)
            result.value.push(file);
        }); 
      }
      resolve(result);
      return callback(result);
    });
  })
}
io.use(sharedSession(sessionMiddleware, {

}));
io.sockets.on('connection', (socket:any) => {
    var address = socket.handshake.address;
    LOG(`New connection from ${JSON.stringify(address)} ${socket.id}`, 'ip');
    //defaultはguestとして入る
    users.set(socket.id, "guest");
    fs.mkdir(accountsDir + 'guest/' + socket.id, (err) => {
      if(err)
      {
        LOG(`could not create ${accountsDir}guest/${socket.id}`, 'status');
      }
    });
    usersDirectory.set(socket.id, accountsDir + 'guest/' + socket.id);
    let userId;
    if(!(socket.handshake.session.passport === undefined))
      userId = socket.handshake.session.passport.user;
    else
      userId = 'guest';
    User.findOne({_id: userId}).exec((err: any, user: any) => {
      LOG(user, 'user');
      if(err)
      {
        socket.emit('login', {
          id: 'guest',
          username: 'ゲスト',
          avatar: ''
        });
        users.set(socket.id, 'guest');
        usersDirectory.set(socket.id, path.resolve(accountsDir, 'guest'));
        usersProjectDirectory.set(socket.id, path.resolve(usersDirectory.get(socket.id), 'none'));
      }
      else
      {
        socket.emit('login', {
          id: user.username,
          username: user.displayName,
          avatar: ''
        });
        users.set(socket.id, user.username);
        usersDirectory.set(socket.id, path.resolve(accountsDir, user.username));
        usersProjectDirectory.set(socket.id, path.resolve(usersDirectory.get(socket.id), 'none'));
      }
    })
    socket.on('compile', async (input: compileData) => {
      // コンパイル
      exec('echo \"' + input.value + '\" > ' + usersDirectory.get(socket.id) + '/' + input.filename, (err: NodeJS.ErrnoException| null, stdout: Stream, stderr: Stream) => {
        if(err)
        {
          socket.emit('output', {
            value: stderr,
            style: 'err'
          })
        }
        exec('./compiler ' + input.filename + ' ' + usersDirectory.get(socket.id) + '/', (err: NodeJS.ErrnoException| null, stdout: Stream, stderr: Stream) =>
        {
          // 出力
          LOG(`${stdout}\n${stderr}`, 'Compile');
          if(err) {
            socket.emit('output', {
              value: stderr,
              style: 'err'
            });
            exec('sudo rm -f ' + input.filename + ' .' + input.filename);
          }else {
            if(stdout)
            {
              socket.emit('output', {
                value: stdout,
                style: 'log'
              });
            }
            if(stderr)
            {
              socket.emit('output', {
                value: stderr,
                style: 'log'
              });
            }
            exec('sudo rm -f ' + input.filename + ' .' + input.filename);
          }
          return;
        });
      });
      
  
    })
    socket.on('save', async (input: saveData) => {
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
        if(usersProjectDirectory.get(socket.id) == path.resolve(usersDirectory.get(socket.id), 'none'))
        {
          socket.emit('saved', {
            value: 'Load a project first.',
            style: 'err',
            success: false
          })
        }
        else
        {
          exec('echo \"' + input.value + '\" > ' + usersProjectDirectory.get(socket.id) + '/' + input.filename, 
          (err: NodeJS.ErrnoException| null, stdout: Stream, stderr: Stream) => {
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
      };
    });
    //すでに作られたProjectをロードする
    socket.on('loadProject', async (input: loadProjectData) => 
    {
      if(users.get(socket.id) != 'guest')
      {
        let result: dirObject = {type: 'folder', name: input.projectName, value: []};
        readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result, () => {}).then((val) => {
          socket.emit('loadedProject', {
            value: val,
            style: 'log'
          });
        });
      }
      else
      {
        socket.emit('loadedProject', {
          value: 'Sign in to load a project.',
          style: 'log'
        });
      }
    });
    //Projectを作る
    socket.on('newProject', async (input: createProjectData) => {
      if(users.get(socket.id) != 'guest')
      {
        fs.mkdir(usersDirectory.get(socket.id) + '/' + input.projectName, (err) => {
          if(err)
          {
            socket.emit('newProjectCreated', {
              value: 'Could not create project '+ input.projectName,
              style: 'err'
            })
          }
          else
          {
            socket.emit('newProjectCreated', {
              value: 'Created project ' + input.projectName,
              style: 'log'
            })
          }
        });
        usersProjectDirectory.set(socket.id, usersDirectory.get(socket.id) + '/' + input.projectName);
      }
      else
      {
        socket.emit('newProjectCreated', {
          value: 'Sign in to create a new project',
          style: 'err'
        })
      }
    })
    //disconnectしたとき
    socket.on('disconnect', () => {
      LOG("user disconnected", 'user');
      if(users.get(socket.id) == 'guest')
      {
        if(usersDirectory.get(socket.id))
        {
          fs.rmdir((usersDirectory.get(socket.id)!), (err: NodeJS.ErrnoException | null) => {
            LOG(`${usersDirectory.get(socket.id)} deleted`, 'user');
          });        
        }
      }
    })
  });
  
// 404
app.use((req :express.Request, res :express.Response, next) => {
  res.status(404);
  res.sendFile('err404.html', {root: rootdirectory});
});

  httpsServer.listen(port, () => {
    LOG('Server at https://rootlang.ddns.net', 'status');
  })