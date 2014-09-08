var __luajs_push_var, __luajs_push_var_ref;

var _GLOBAL;
if(window)
	_GLOBAL = window;
else if(global)
	_GLOBAL = global;

exports = (function() {
	function inherit(childClass, parentClass) {
		childClass.prototype = Object.create(parentClass.prototype);
		childClass.prototype.constructor = childClass;
	}
	
	function ajaxPromise(url) {
		return new Promise(function(resolve, reject) {
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState==XMLHttpRequest.DONE) {
					if(xmlhttp.status == 200)
						resolve(xmlhttp.responseText);
					else
						reject(xmlhttp.status);
				}
			};
			xmlhttp.open("GET", url, true);
			xmlhttp.send();
		});
	}
	
	function importFromC(arr) {
		var target = {};
		var funcRegex = /^(js)?lua_/;
		arr.forEach(function(value) {
			target[value[0].replace(funcRegex, "")] = Module.cwrap(value[0], value[1], value[2]);
		});
		return target;
	}
	
	var luaNative = importFromC([
		["jslua_execute", "number", ["number", "string"]],
		["jslua_call", "number", ["number", "number"]],
		["lua_settop", "", ["number", "number"]],
		["lua_gettop", "number", ["number"]],
		["lua_type", "number", ["number", "number"]],
		["jslua_new_state", "number", []],
		["jslua_delete_state", "", ["number"]],
		["jslua_pop_string", "string", ["number"]],
		["jslua_push_string", "", ["number", "string"]],
		["jslua_pop_number", "number", ["number"]],
		["jslua_push_number", "", ["number", "number"]],
		["jslua_push_jsvar", "", ["number", "number", "number"]],
		["lua_gettable", "", ["number", "number"]],
		["lua_settable", "", ["number", "number"]],
		["jslua_toref", "number", ["number", "number"]],
		["jslua_push_ref", "", ["number", "number"]],
		["jslua_unref", "", ["number", "number"]],
		["lua_createtable", "", ["number"]],
		["lua_pushvalue", "", ["number", "number"]],
		["lua_pushnil", "", ["number"]],
		["lua_next", "", ["number", "number"]],
		["lua_tolstring", "string", ["number", "number", "number"]],
		["lua_tonumberx", "number", ["number", "number", "number"]],
		["lua_getmetatable", "number", ["number", "number"]],
		["lua_setmetatable", "number", ["number", "number"]],
		["lua_rawseti", "", ["number", "number"]],
		["lua_rawset", "", ["number", "number"]],
	]);
	
	
	var lua_state_tbl = {};
	
	luaNative.pop = function pop(state, n) {
		luaNative.settop(state, -n-1);
	}
	
	luaNative.pop_ref = function pop_ref(state) {
		var ref = luaNative.toref(state, -1);
		luaNative.pop(state, 1);
		return ref;
	}
	
	luaNative.tostring = function tostring(a, b) {
		return luaNative.tolstring(a, b, 0);
	}
	
	luaNative.tonumber = function tonumber(state, i) {
		return luaNative.tonumberx(state, i, 0);
	}
	
	var luaTypes = {
		nil:			0,
		bool:			1,
		boolean:		1,
		lightuserdata:	2,
		number:			3,
		string:			4,
		table:			5,
		function:		6,
		userdata:		7,
		thread:			8,
		coroutine:		8
	};
	
	var luaJSDataTypes = {
		unknown:		0,
		function: 		1,
		array:			2,
		object:			3
	};
	
	var luaConstants = {
		LUA_REGISTRYINDEX:	-10000,
		LUA_ENVIRONINDEX: 	-10001,
		LUA_GLOBALSINDEX:	-10002,
		LUA_RIDX_GLOBALS:	2
	};

	var MOD_PATH = {
		"lua": "/usr/local/share/lua/5.2/",
		"c": "/usr/local/lib/lua/5.2/",
	};

	for(var idx in MOD_PATH)
		FS.createPath("/", MOD_PATH[idx].substr(1), true, true);
	
	function decode_single(state, pos, convertArgs) {
		switch(luaNative.type(state, pos)) {
			case luaTypes.nil:
				return null;
			case luaTypes.number:
				return luaNative.tonumber(state, pos);
			case luaTypes.string:
				return luaNative.tostring(state, pos);
			case luaTypes.table:
				var tbl = new LuaTable(state, luaNative.toref(state, pos));
				if(convertArgs) {
					var ret = tbl.toObject(true, true);
					tbl.unref();
					return ret;
				}
				return tbl;
			case luaTypes.function:
				var ret = new LuaFunction(state, luaNative.toref(state, pos));
				if(convertArgs)
					return ret.getClosure();
				return ret;
			default:
				if(convertArgs)
					return null;
				return new LuaReference(state, luaNative.toref(state, pos));
		}
	}
	
	function decode_stack(state, stack_size, convertArgs) {
		var ret = [];
		for(var i = 0; i < stack_size; i++) {
			ret.unshift(decode_single(state, -1, convertArgs));
			luaNative.pop(state, 1);
		}
		return ret;
	}
	
	var luaLastRefIdx = -1;
	var luaPassedVars = {};
	luaPassedVars[-1] = [_GLOBAL, null, -1];
	
	function luaGetVarPtr(varObj, varRef) {
		if(varRef === undefined)
			varRef = null;
			
		for(var idx in luaPassedVars) {
			var ptr = luaPassedVars[idx];
			if(ptr[0] == varObj && ptr[1] == varRef) {
				ptr[2]++;
				return idx;
			}
		}
		
		luaPassedVars[++luaLastRefIdx] = [varObj, varRef, 1];
		return luaLastRefIdx;
	}
	
	function luaRemoveVarPtr(varPtr) {
		var refCounter = luaPassedVars[varPtr][2];
		
		if(refCounter > 1)
			luaPassedVars[varPtr][2]--;
		else if(refCounter >= 0)
			delete luaPassedVars[varPtr];
	}
	
	function push_var(state, arg, ref) {
		if(arg === null) {
			luaNative.pushnil(state);
			return;
		}
		switch(typeof arg) {
			case "undefined":
				luaNative.pushnil(state);
				break;
			case "boolean":
				luaNative.push_boolean(state, arg ? 1 : 0);
				break;
			case "number":
				luaNative.push_number(state, arg);
				break;
			case "string":
				luaNative.push_string(state, arg);
				break;
			case "function":
				luaNative.push_jsvar(state, luaGetVarPtr(arg, ref), luaJSDataTypes.function);
				break;
			case "object":
				if(arg instanceof LuaReference)
					arg.push(state);
				else if(arg instanceof Array)
					luaNative.push_jsvar(state, luaGetVarPtr(arg, ref), luaJSDataTypes.array);
				else
					luaNative.push_jsvar(state, luaGetVarPtr(arg, ref), luaJSDataTypes.object);
				break;
			default:
				throw new LuaError("Unhandled value push: " + arg);
		}
	}
	
	function __luajs_get_var_by_ref(index) {
		return luaPassedVars[index][0];
	}
	
	function luaCallFunction(func, funcThis, state, stack_size, convertArgs) {
		var variables = decode_stack(state, stack_size, convertArgs);
		push_var(state, func.apply(funcThis, variables));
	}
	
	function luaCallFunctionPointer(funcPtr, state, stack_size, convertArgs) {
		var varPtr = luaPassedVars[funcPtr];
		return luaCallFunction(varPtr[0], varPtr[1], state, stack_size, convertArgs);
	}
	
	Module.ccall("__jslua_set_fp", "", ["number", "number"], [Runtime.addFunction(luaCallFunctionPointer), Runtime.addFunction(luaRemoveVarPtr)]);
	
	
	//Everything below is OO
	
	//LuaError
	function LuaError(msg) {
		Error.apply(this, arguments);
		this.message = msg;
	}

	inherit(LuaError, Error);

	//LuaRerefence
	function LuaReference(state, index) {
		this.state = state;
		this.index = index;
		
		var oldRef = lua_state_tbl[state].refArray[index];
		if(oldRef)
			oldRef.unref();
		lua_state_tbl[state].refArray[index] = this;
	}

	LuaReference.prototype.unref = function() {
		luaNative.unref(this.state, this.index);
		delete lua_state_tbl[this.state].refArray[this.index];
		this.index = null;
		this.state = null;
	}

	LuaReference.prototype.push = function(state) {
		if(state && state != this.state)
			throw new Error("Wrong Lua state");
		luaNative.push_ref(this.state, this.index);
	}
	
	LuaReference.prototype.getmetatable = function() {
		this.push();
		luaNative.getmetatable(this.state, -1);
		var ret = decode_single(this.state, -1);
		luaNative.pop(this.state, 1);
		return ret;
	}
	
	LuaReference.prototype.setmetatable = function() {
		this.push();
		luaNative.setmetatable(this.state, -1);
		luaNative.pop(this.state, 1);
	}

	//LuaFunction
	function LuaFunction() {
		LuaReference.apply(this, arguments);
	}

	inherit(LuaFunction, LuaReference);

	LuaFunction.prototype.getClosure = function() {
		var func = this;
		return function() {
			LuaFunction.prototype.call.apply(func, arguments);
		};
	}

	LuaFunction.prototype.call = function() {
		this.push(this.state);
		
		for(var i = 0; i < arguments.length; i++) {
			try {
				push_var(this.state, arguments[i])
			} catch(e) {
				for(;i>=0;i--)
					luaNative.pop(this.state, 1);
				throw e;
			}
		}
		
		var stack = luaNative.call(this.state, arguments.length);
		var ret = decode_stack(this.state, Math.abs(stack));
		if (stack < 0)
			throw new LuaError(ret[0]);
		return ret;
	}
	
	//LuaTable
	function LuaTable() {
		LuaReference.apply(this, arguments);
	}
	
	inherit(LuaTable, LuaReference);
	
	LuaTable.prototype.set = function(key, value) {
		var type = typeof key;
		this.push();
		push_var(this.state, key);
		push_var(this.state, value);
		luaNative.settable(this.state, -3);
		luaNative.pop(this.state, 1);
		
	}
	
	LuaTable.prototype.get = function(key) {
		this.push();
		push_var(this.state, key);
		luaNative.gettable(this.state, -2);
		var ret = decode_single(this.state, -1);
		luaNative.pop(this.state, 2);
		return ret;
	}
	
	LuaTable.prototype.toObject = function(recurse, unrefAll, maxDepth) {
		this.push();
		luaNative.pushnil(this.state);
		var ret = {}
		while(luaNative.next(this.state, -2)) {
			luaNative.pushvalue(this.state, -2);
			var key = luaNative.tostring(this.state, -1);
			var value = decode_single(this.state, -2);
			ret[key] = value;
			luaNative.pop(this.state, 2);
		}
		luaNative.pop(this.state, 1);
		
		if(!maxDepth)
			maxDepth = 10;
		
		if(recurse) {
			maxDepth--;
			
			var ret_iter = ret.slice(0);
			for(var idx in ret_iter) {
				var val = ret[idx];
				if(val instanceof LuaTable && maxDepth > 0) {
					ret[idx] = val.toObject(true, unrefAll, maxDepth);
					val.unref();
				} else if(unrefAll && value instanceof LuaReference) {
					val.unref();
					delete ret[idx];
				}
			}
		}
		
		return ret;
	}

	//LuaState
	function LuaState() {
		this.state = luaNative.new_state();
		this.refArray = {};
		lua_state_tbl[this.state] = this;
	}
	
	LuaState.prototype.unrefAll = function() {
		for(idx in this.refArray) {
			var ref = this.refArray[idx];
			ref.unref();
		}
		this.refArray = {};
	}

	LuaState.prototype.close = function() {
		this.unrefAll();
		luaNative.delete_state(this.state);
		delete lua_state_tbl[this.state];
		this.state = null;
	}

	LuaState.prototype.run = function(code) {
		var stack = luaNative.execute(this.state, code);
		var ret = decode_stack(this.state, Math.abs(stack));
		if (stack < 0)
			throw new LuaError(ret[0]);
		return ret;
	}
	
	LuaState.prototype.getGlobalTable = function() {
		return new LuaTable(this.state, luaConstants.LUA_RIDX_GLOBALS);
	}
	
	LuaState.prototype.createTable = function() {
		luaNative.createtable(this.state, 0, 0);
		return new LuaTable(this.state, luaNative.pop_ref(this.state));
	}
	
	LuaState.prototype.require = function(libname, type) {
		var extension;
		if(type == "lua")
			extension = ".lua";
		else
			throw new Error("Unsupported type");
		
		var self = this;
		
		return ajaxPromise('modules/' + libname + extension).then(function(data) {
			FS.createDataFile(MOD_PATH[type], libname + extension, data, true, true);
			self.run(libname + ' = require"' + libname + '"');
		});
	}

	LuaState.prototype.loadDocumentScripts = function(doc) {
		var self = this;
		var xPathResult = document.evaluate( '//script[@type="text/lua"]', doc, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		var node;
		var scriptPromises = [];
		while(node = xPathResult.iterateNext()) {
			scriptPromises.push(ajaxPromise(node.src));
		}
		
		Promise.all(scriptPromises).then(function(scripts) {
			scripts.forEach(function(data) {
				self.run(data);
			});
		});
	}

	LuaState.prototype.listenForScripts = function(doc) {
		var self = this;
		var observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if(mutation.type == "childList") {
					Array.prototype.slice.call(mutation.addedNodes).forEach(function(node) {
						if(node instanceof HTMLScriptElement && node.type.toLowerCase() == "text/lua") {
							if(node.src)
								ajaxPromise(node.src).then(function(data) {
									self.run(data);
								});
							else
								self.run(node.textContent);
						}
					});
				}	
			});
		});    
		observer.observe(doc, {
			childList: true,
			subtree: true
		});		
	}
	
	return {
		LuaState: LuaState,
		LuaFunction: LuaFunction,
		LuaTable: LuaTable,
		LuaReference: LuaReference,
		
		__luajs_luaNative: luaNative,
		__luajs_push_var: push_var,
		__luajs_get_var_by_ref: __luajs_get_var_by_ref,
		__luajs_decode_single: decode_single
	};  
})();

for(var idx in exports) {
	if(exports.hasOwnProperty(idx))
		_GLOBAL[idx] = exports[idx];
}

