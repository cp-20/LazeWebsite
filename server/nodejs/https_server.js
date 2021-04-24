#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var fs_1 = __importDefault(require("fs"));
var path = require('path');
var exec = require('child_process').exec;
var app = express_1.default();
//https settings
var rootDir = path.resolve(__dirname, '../../');
var https = require('https');
var privateKey = fs_1.default.readFileSync(path.resolve(rootDir, 'server/nodejs/privkey.pem'), 'utf8');
var certificate = fs_1.default.readFileSync(path.resolve(rootDir, 'server/nodejs/fullchain.pem'), 'utf8');
var credentials = { key: privateKey, cert: certificate };
//http to https auto redirection
var http = require('http');
http.createServer((express_1.default()).all("*", function (request, response) {
    response.redirect("https://" + request.hostname + request.url);
})).listen(80);
var httpsServer = https.createServer(credentials, app);
var io = require('socket.io')(httpsServer);
var port = 443;
//log function
function LOG(log, title) {
    if (typeof log === 'object' && log != null)
        console.log(title + "(" + JSON.stringify(log) + ")`");
    else
        console.log(title + "(" + log + ")`");
}
//mount usb
var accountsDir = '/media/usb/compilerserver/accounts/';
fs_1.default.access(accountsDir, function (err) {
    if (err && err.code == 'ENOENT') {
        fs_1.default.access('/media/pi/A042-416A', function (err) {
            if (!err) {
                exec('sudo umount /media/pi/A042-416A', function () {
                    exec('sudo mount /dev/sda1 /media/usb', function () {
                        LOG('mounted usb', 'mounted usb');
                    });
                });
            }
            else {
                exec('sudo mount /dev/sda1 /media/usb', function () {
                    LOG('mounted usb', 'mounted usb');
                });
            }
        });
    }
});
//ip filter
var ipList;
fs_1.default.readFile('/home/pi/ipBlacklist.json', function (err, data) {
    if (err) {
        LOG('Could not read blacklist.', 'Could not read blacklist.');
    }
    else {
        var blacklistData = JSON.parse(data.toString() || "null");
        ipList = blacklistData.value;
        LOG(ipList.length + " blocked ip addresses.", ipList.length + " blocked ip addresses.");
    }
});
// const ipfilter = require('express-ipfilter').IpFilter;
fs_1.default.watchFile('/home/pi/ipBlacklist.json', function (curr, prev) {
    fs_1.default.readFile('/home/pi/ipBlacklist.json', function (err, data) {
        if (err) {
            LOG('Could not read ipBlacklist.', 'Could not read ipBlacklist.');
        }
        else {
            var blacklistData = JSON.stringify(data.toString() || "null");
            ipList = blacklistData.value;
            LOG(ipList.length + " blocked ip addresses.", ipList.length + " blocked ip addresses.");
            // app.use(ipfilter(ipList));
        }
    });
});
//database (mongoose)
var mongoose_1 = __importDefault(require("mongoose"));
var User = require('./database');
mongoose_1.default.connect('mongodb+srv://coder6583:curvingchicken@compilerserver.akukg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(function () { LOG('connected to database', 'connected to database'); });
mongoose_1.default.Promise = global.Promise;
//passport
var passport_1 = __importDefault(require("passport"));
var LocalStrategy = require('passport-local').Strategy;
passport_1.default.use(new LocalStrategy({ usernameField: 'loginId', passwordField: 'loginPassword' }, function (username, password, done) {
    LOG('Login Attempt', 'Login Attempt');
    User.findOne({ email: username }).then(function (user) {
        if (!user) {
            User.findOne({ username: username }).then(function (user_) {
                if (!user_) {
                    LOG('account not found', 'account not found');
                    return done(null, false, { message: 'That email is not registered' });
                }
                bcrypt_1.default.compare(password, user_.password, function (err, isMatch) {
                    if (err)
                        LOG(err, 'login error');
                    if (isMatch) {
                        LOG('logged in!', 'logged in!');
                        return done(null, user_);
                    }
                    else {
                        return done(err, false, { message: 'password incorrect' });
                    }
                });
            });
            return;
        }
        bcrypt_1.default.compare(password, user.password, function (err, isMatch) {
            if (err)
                LOG(err, 'login error');
            if (isMatch) {
                LOG('logged in!', 'logged in!');
                return done(null, user);
            }
            else {
                return done(err, false, { message: 'password incorrect' });
            }
        });
    });
}));
passport_1.default.serializeUser(function (user, done) {
    done(null, user.id);
});
passport_1.default.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
//Login with Google
var GoogleStrategy = require('passport-google-oauth20').Strategy;
passport_1.default.use(GoogleStrategy);
//bcrypt = hash function
var bcrypt_1 = __importDefault(require("bcrypt"));
var rootdirectory = path.resolve(rootDir, 'client');
//express session
var express_session_1 = __importDefault(require("express-session"));
var express_socket_io_session_1 = __importDefault(require("express-socket.io-session"));
//request時に実行するmiddleware function
function everyRequest(req, res, next) {
    if (ipList.includes(req.socket.remoteAddress)) {
        LOG("Blacklisted ip tried to access. IP: " + req.socket.remoteAddress, 'banned ip tried to access');
        res.send('banned L');
        res.end();
    }
    else {
        LOG("Request URL: " + decodeURI(req.originalUrl) + "\nIP: " + req.socket.remoteAddress, 'request url');
        next();
    }
}
app.use(express_1.default.static(rootdirectory));
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var sessionMiddleware = express_session_1.default({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
});
app.use(sessionMiddleware);
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(everyRequest);
app.get('/', function (req, res) {
    res.sendFile('index.html', { root: rootdirectory });
});
app.get('/login', function (req, res) {
    res.sendFile('login.html', { root: rootdirectory });
});
app.post('/login', function (req, res, next) {
    passport_1.default.authenticate('local', {
        successRedirect: '/editor',
        failureRedirect: '/login'
    })(req, res, next);
});
app.get('/editor', function (req, res) {
    LOG(req.user, 'user data');
    res.sendFile('editor.html', { root: rootdirectory });
});
app.get('/docs', function (req, res) {
    res.sendFile('docs.html', { root: rootdirectory });
});
app.get('/admin', function (req, res) {
    res.sendFile('admin.html', { root: rootdirectory });
});
app.get('/register', function (req, res) {
    res.sendFile('register.html', { root: rootdirectory });
});
app.post('/register', function (req, res) {
    var _a = req.body, id = _a.id, username = _a.username, email = _a.email, password = _a.password, passwordCheck = _a.passwordCheck;
    var newUser = new User({
        email: email,
        username: id,
        displayName: username || id,
        password: password
    });
    fs_1.default.mkdir(path.resolve(accountsDir, id), function () {
        LOG('created account folder', 'created account folder');
    });
    bcrypt_1.default.genSalt(10, function (err, salt) {
        bcrypt_1.default.hash(newUser.password, salt, function (err, hash) {
            if (err)
                LOG('Error hashing password.', 'Error hashing password.');
            newUser.password = hash;
            newUser.save().then(function (value) {
                LOG(value, 'register user');
                res.redirect('/login');
            });
        });
    });
});
app.get('/pass_reset', function (req, res) {
    res.sendFile('pass_reset.html', { root: rootdirectory });
});
app.get('/register_check/id', function (req, res) {
    if (req.query.id) {
        var userId = req.query.id;
        LOG(userId, 'id register check');
        User.findOne({ username: userId }).exec(function (err, user) {
            if (user) {
                LOG('there is already an account', 'there is already an account');
                res.json({ success: false });
            }
            else {
                res.json({ success: true });
            }
        });
    }
});
app.get('/register_check/email', function (req, res) {
    if (req.query.email) {
        var emailAddress = req.query.email;
        LOG(emailAddress, 'email register check');
        User.findOne({ email: emailAddress }).exec(function (err, user) {
            if (user) {
                res.json({ success: false });
            }
            else {
                res.json({ success: true });
            }
        });
    }
});
app.get('/node_modules/jquery-resizable-dom/src/jquery-resizable.js', function (req, res) {
    LOG('get node modules', 'get node modules');
    res.sendFile('/node_modules/jquery-resizable-dom/src/jquery-resizable.js', { root: rootDir });
});
app.get('/avatar/id', function (req, res) {
    LOG('avatar debug', 'avatar debug');
    var avatarPath = path.resolve("" + accountsDir + req.query.id, 'avatar.png');
    fs_1.default.access(avatarPath, function (err) {
        if (err) {
            res.sendFile(path.resolve('/home/pi/Compiler/client/assets/icons', 'guest.png'));
        }
        else {
            res.sendFile(avatarPath);
        }
    });
});
var users = new Map();
var usersDirectory = new Map();
var usersProjectDirectory = new Map();
//ディレクトリー読むための再帰関数
function readDirectory(path, socket, result, callback) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    fs_1.default.readdir(path, { withFileTypes: true }, function (err, content) { return __awaiter(_this, void 0, void 0, function () {
                        var files_1, folders_1, fn, temp, tempfolders, tempfiles;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!err) return [3 /*break*/, 1];
                                    LOG(err, 'could not load project');
                                    socket.emit('loadedProject', {
                                        value: 'Could not load folder ' + path,
                                        style: 'err'
                                    });
                                    return [3 /*break*/, 3];
                                case 1:
                                    files_1 = new Map();
                                    folders_1 = new Map();
                                    fn = function processContent(element) {
                                        if (element.isFile()) {
                                            files_1.set(element.name, { type: 'file', name: element.name });
                                            return { type: 'file', name: element.name };
                                        }
                                        else if (element.isDirectory()) {
                                            return readDirectory(path + '/' + element.name, socket, { type: 'folder', name: element.name, value: [] }, function (val) {
                                                folders_1.set(element.name, val);
                                                return val;
                                            });
                                        }
                                    };
                                    return [4 /*yield*/, Promise.all(content.map(fn))];
                                case 2:
                                    temp = _a.sent();
                                    tempfolders = new Map(__spread(folders_1).sort(function (a, b) { return Number(a[0] > b[0]); }));
                                    tempfolders.forEach(function (folder) {
                                        if (result.value)
                                            result.value.push(folder);
                                    });
                                    tempfiles = new Map(__spread(files_1).sort(function (a, b) { return Number(a[0] > b[0]); }));
                                    tempfiles.forEach(function (file) {
                                        if (result.value)
                                            result.value.push(file);
                                    });
                                    _a.label = 3;
                                case 3:
                                    resolve(result);
                                    return [2 /*return*/, callback(result)];
                            }
                        });
                    }); });
                })];
        });
    });
}
io.use(express_socket_io_session_1.default(sessionMiddleware, {}));
io.sockets.on('connection', function (socket) {
    var address = socket.handshake.address;
    LOG("New connection from " + JSON.stringify(address) + " " + socket.id, 'new connection');
    //defaultはguestとして入る
    users.set(socket.id, "guest");
    fs_1.default.mkdir(accountsDir + 'guest/' + socket.id, function (err) {
        if (err) {
            LOG("could not create " + accountsDir + "guest/" + socket.id, 'could not create guest folder');
        }
    });
    usersDirectory.set(socket.id, accountsDir + 'guest/' + socket.id);
    var userId;
    if (!(socket.handshake.session.passport === undefined))
        userId = socket.handshake.session.passport.user;
    else
        userId = 'guest';
    User.findOne({ _id: userId }).exec(function (err, user) {
        LOG(user, 'user data');
        if (err) {
            socket.emit('login', {
                id: 'guest',
                username: 'ゲスト',
                avatar: ''
            });
            users.set(socket.id, 'guest');
            usersDirectory.set(socket.id, path.resolve(accountsDir, 'guest'));
            usersProjectDirectory.set(socket.id, path.resolve(usersDirectory.get(socket.id), 'none'));
        }
        else {
            socket.emit('login', {
                id: user.username,
                username: user.displayName,
                avatar: ''
            });
            users.set(socket.id, user.username);
            usersDirectory.set(socket.id, path.resolve(accountsDir, user.username));
            usersProjectDirectory.set(socket.id, path.resolve(usersDirectory.get(socket.id), 'none'));
        }
    });
    socket.on('compile', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // コンパイル
            exec('echo \"' + input.value + '\" > ' + usersDirectory.get(socket.id) + '/' + input.filename, function (err, stdout, stderr) {
                if (err) {
                    socket.emit('output', {
                        value: stderr,
                        style: 'err'
                    });
                }
                exec('./compiler ' + input.filename + ' ' + usersDirectory.get(socket.id) + '/', function (err, stdout, stderr) {
                    // 出力
                    LOG(stdout + "\n" + stderr, 'Compile');
                    if (err) {
                        socket.emit('output', {
                            value: stderr,
                            style: 'err'
                        });
                        exec('sudo rm -f ' + input.filename + ' .' + input.filename);
                    }
                    else {
                        if (stdout) {
                            socket.emit('output', {
                                value: stdout,
                                style: 'log'
                            });
                        }
                        if (stderr) {
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
            return [2 /*return*/];
        });
    }); });
    socket.on('save', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            //ファイルにセーブ
            if (users.get(socket.id) == 'guest') {
                socket.emit('saved', {
                    value: 'If you want to save a file, please create an account.',
                    style: 'err',
                    success: false
                });
            }
            else {
                if (usersProjectDirectory.get(socket.id) == path.resolve(usersDirectory.get(socket.id), 'none')) {
                    socket.emit('saved', {
                        value: 'Load a project first.',
                        style: 'err',
                        success: false
                    });
                }
                else {
                    exec('echo \"' + input.value + '\" > ' + usersProjectDirectory.get(socket.id) + '/' + input.filename, function (err, stdout, stderr) {
                        if (err) {
                            socket.emit('saved', {
                                value: stderr + ' : Save not complete.',
                                style: 'err',
                                success: false
                            });
                        }
                        else {
                            socket.emit('saved', {
                                value: 'Save complete.',
                                style: 'info',
                                success: true
                            });
                        }
                        return;
                    });
                }
            }
            ;
            return [2 /*return*/];
        });
    }); });
    //すでに作られたProjectをロードする
    socket.on('loadProject', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            if (users.get(socket.id) != 'guest') {
                result = { type: 'folder', name: input.projectName, value: [] };
                readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result, function () { }).then(function (val) {
                    socket.emit('loadedProject', {
                        value: val,
                        style: 'log'
                    });
                });
            }
            else {
                socket.emit('loadedProject', {
                    value: 'Sign in to load a project.',
                    style: 'log'
                });
            }
            return [2 /*return*/];
        });
    }); });
    //Projectを作る
    socket.on('newProject', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (users.get(socket.id) != 'guest') {
                fs_1.default.mkdir(usersDirectory.get(socket.id) + '/' + input.projectName, function (err) {
                    if (err) {
                        socket.emit('newProjectCreated', {
                            value: 'Could not create project ' + input.projectName,
                            style: 'err'
                        });
                    }
                    else {
                        socket.emit('newProjectCreated', {
                            value: 'Created project ' + input.projectName,
                            style: 'log'
                        });
                    }
                });
                usersProjectDirectory.set(socket.id, usersDirectory.get(socket.id) + '/' + input.projectName);
            }
            else {
                socket.emit('newProjectCreated', {
                    value: 'Sign in to create a new project',
                    style: 'err'
                });
            }
            return [2 /*return*/];
        });
    }); });
    //disconnectしたとき
    socket.on('disconnect', function () {
        LOG("user disconnected", 'user disconnected');
        if (users.get(socket.id) == 'guest') {
            if (usersDirectory.get(socket.id)) {
                fs_1.default.rmdir((usersDirectory.get(socket.id)), function (err) {
                    LOG(usersDirectory.get(socket.id) + " deleted", 'user connection deleted');
                });
            }
        }
    });
});
// 404
app.use(function (req, res, next) {
    res.status(404);
    res.sendFile('err404.html', { root: rootdirectory });
});
httpsServer.listen(port, function () {
    LOG('Server at https://rootlang.ddns.net', 'Server at https://rootlang.ddns.net');
});
