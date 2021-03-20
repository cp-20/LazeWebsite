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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require('express');
var exec = require('child_process').exec;
var fs = require('fs');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 80;
var accountsDir = '/media/usb/compilerserver/accounts/';
//socket.idをkey、アカウント名をvalueとしたmap
var users = new Map();
var usersDirectory = new Map();
//ディレクトリー読むための再帰関数
function readDirectory(path, socket, result) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, fs.readdir(path, { withFileTypes: true }, function (err, content) {
                    if (err) {
                        socket.emit('loadedProject', {
                            value: 'Could not load folder ' + path,
                            style: err
                        });
                    }
                    else {
                        var files_1 = new Map();
                        var folders_1 = new Map();
                        content.forEach(function (element) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, _b, _c, _d, _e;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0:
                                        if (!element.isFile()) return [3 /*break*/, 1];
                                        files_1.set(element.name, { type: 'file', name: element.name });
                                        return [3 /*break*/, 4];
                                    case 1:
                                        if (!element.isDirectory()) return [3 /*break*/, 4];
                                        // console.log('a');
                                        // let val = await readDirectory(path + '/' + element.name, socket, {type: 'folder', name: element.name, folder: []});
                                        _b = (_a = console).log;
                                        return [4 /*yield*/, readDirectory(path + '/' + element.name, socket, { type: 'folder', name: element.name, folder: [] })];
                                    case 2:
                                        // console.log('a');
                                        // let val = await readDirectory(path + '/' + element.name, socket, {type: 'folder', name: element.name, folder: []});
                                        _b.apply(_a, [_f.sent()]);
                                        _d = (_c = folders_1).set;
                                        _e = [element.name];
                                        return [4 /*yield*/, readDirectory(path + '/' + element.name, socket, { type: 'folder', name: element.name, folder: [] })];
                                    case 3:
                                        _d.apply(_c, _e.concat([_f.sent()]));
                                        _f.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); });
                        var tempfolders = new Map(__spreadArrays(folders_1).sort(function (a, b) { return a[0] > b[0]; }));
                        tempfolders.forEach(function (folder) {
                            console.log(folder);
                            result.folder.push(folder);
                        });
                        var tempfiles = new Map(__spreadArrays(files_1).sort(function (a, b) { return a[0] > b[0]; }));
                        tempfiles.forEach(function (file) {
                            console.log(result.folder.push(file));
                        });
                    }
                    console.log(result);
                    return result;
                })];
        });
    });
}
app.use('/', express.static('/home/pi/compilerserver/Compiler/'));
app.get('/', function (req, res) {
    res.sendFile('/home/pi/compilerserver/Compiler/index.html');
});
io.sockets.on('connection', function (socket) {
    var address = socket.handshake.address;
    console.log('New connection from ' + JSON.stringify(address) + socket.id);
    //defaultはguestとして入る
    users.set(socket.id, "guest");
    fs.mkdir(accountsDir + 'guest/' + socket.id, function (err) {
        if (err) {
            console.log('could not create ' + accountsDir + 'guest/' + socket.id);
        }
    });
    usersDirectory.set(socket.id, accountsDir + 'guest/' + socket.id);
    socket.on('compile', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // コンパイル
            exec('echo \"' + input.value + '\" > ' + usersDirectory.get(socket.id) + '/' + input.filename);
            exec('./compiler ' + input.filename + ' ' + usersDirectory.get(socket.id) + '/', function (err, stdout, stderr) {
                // 出力
                console.log(err, stdout, stderr);
                if (err) {
                    socket.emit('output', {
                        value: stderr,
                        style: 'err'
                    });
                }
                else {
                    socket.emit('output', {
                        value: stdout,
                        style: 'log'
                    });
                }
                return;
            });
            exec('sudo rm -f ' + input.filename + ' .' + input.filename);
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
                exec('echo \"' + input.value + '\" > ' + usersDirectory.get(socket.id) + '/' + input.projectName + '/' + input.filename, function (err, stdout, stderr) {
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
            ;
            return [2 /*return*/];
        });
    }); });
    //loginシステム
    socket.on('login', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            //usersのvalueをアカウント名にする
            users.set(socket.id, input.accountName);
            usersDirectory.set(socket.id, accountsDir + input.accountName);
            return [2 /*return*/];
        });
    }); });
    //すでに作られたProjectをロードする
    socket.on('loadProject', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            result = { type: 'folder', name: input.projectName, folder: [] };
            // console.log(readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result));
            readDirectory(usersDirectory.get(socket.id) + '/' + input.projectName, socket, result).then(function (val) {
                socket.emit('loadedProject', {
                    value: val,
                    style: 'log'
                });
            });
            return [2 /*return*/];
        });
    }); });
    //Projectを作る
    socket.on('createProject', function (input) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            fs.mkdir(usersDirectory.get(socket.id) + '/' + input.projectName, function (err) {
                if (err) {
                    socket.emit('createdProject', {
                        value: 'Could not create project ' + input.projectName,
                        style: 'err'
                    });
                }
                else {
                    socket.emit('createdProject', {
                        value: 'Created project ' + input.projectName,
                        style: 'log'
                    });
                }
            });
            return [2 /*return*/];
        });
    }); });
    //disconnectしたとき
    socket.on('disconnect', function () {
        console.log("a");
        if (users.get(socket.id) == 'guest') {
            fs.rmdir(usersDirectory.get(socket.id), function (err) {
                console.log(usersDirectory.get(socket.id));
            });
        }
    });
});
io.sockets.on('disconnect', function (socket) {
    console.log('a');
});
http.listen(port, function () {
    console.log("Compiler Server listening at http://rootlang.ddns.net");
});
