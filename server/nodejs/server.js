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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var fs_1 = __importDefault(require("fs"));
var http_1 = __importDefault(require("http"));
var path = require('path');
var exec = require('child_process').exec;
var app = express_1.default();
var server = new http_1.default.Server(app);
var io = require('socket.io')(http_1.default);
var port = 80;
var accountsDir = '/media/usb/compilerserver/accounts';
var rootDir = path.resolve(__dirname, '../../');
//request時に実行するmiddleware function
function authenticate(req, res, next) {
    console.log('Request URL: ', req.originalUrl);
    next();
}
app.use(express_1.default.static(rootDir));
app.use(authenticate);
app.get('/', function (req, res) {
    res.sendFile('client/index.html', { root: rootDir });
});
app.get('/login', function (req, res) {
    res.sendFile('client/login.html', { root: rootDir });
});
app.get('/editor', function (req, res) {
    res.sendFile('client/editor.html', { root: rootDir });
});
app.get('/docs', function (req, res) {
    res.sendFile('client/docs.html', { root: rootDir });
});
app.get('/admin', function (req, res) {
    res.sendFile('client/admin.html', { root: rootDir });
});
var users = new Map();
var usersDirectory = new Map();
function readDirectory(path, socket, result) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, fs_1.default.readdir(path, { withFileTypes: true }, function (err, content) {
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
                        var tempfolders = new Map(__spreadArrays(folders_1).sort(function (a, b) { return Number(a[0] > b[0]); }));
                        tempfolders.forEach(function (folder) {
                            console.log(folder);
                            result.folder.push(folder);
                        });
                        var tempfiles = new Map(__spreadArrays(files_1).sort(function (a, b) { return Number(a[0] > b[0]); }));
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
