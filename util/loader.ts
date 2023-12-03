import path from 'path';

const OLD_CWD = process.cwd();
const LUA_JS_DIR = path.join(__dirname, '/../dist');
process.chdir(LUA_JS_DIR);
export default require('../dist/luajs.js');
process.chdir(OLD_CWD);
