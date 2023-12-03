'use strict';

const path = require('path');

const OLD_CWD = process.cwd();
const LUA_JS_DIR = path.join(__dirname, '/../dist');
process.chdir(LUA_JS_DIR);
module.exports = require('../dist/luajs.js');
process.chdir(OLD_CWD);
