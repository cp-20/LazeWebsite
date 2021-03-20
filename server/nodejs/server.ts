import { ExpressionStatement } from "typescript";

import express from 'express';
import fs from 'fs';
import exec from 'child_process';
// const {exec} = require('child_process');
// const fs = require('fs');
const app: express.Express = express();
const http = require('http').Server(app);
const socketIo = require('socket.io')(http);
const port = 80;

const accountsDir: string = '/media/usb/compilerserver/accounts';

app.use()

