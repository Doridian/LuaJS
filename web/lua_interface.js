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

	var lua_execute = Module.cwrap("jslua_execute", "number", ["number", "string"]);
	var lua_call = Module.cwrap("jslua_call", "number", ["number", "number"]);

	var lua_pop_top = Module.cwrap("jslua_pop_top", "", ["number"]);
	var lua_empty_stack = Module.cwrap("jslua_empty_stack", "", ["number"]);
	var lua_get_type = Module.cwrap("jslua_get_type", "number", ["number"]);

	var lua_new_state = Module.cwrap("jslua_new_state", "number", []);
	var lua_delete_state = Module.cwrap("jslua_delete_state", "", ["number"]);

	var lua_pop_string = Module.cwrap("jslua_pop_string", "string", ["number"]);
	var lua_push_string = Module.cwrap("jslua_push_string", "", ["number", "string"]);
	var lua_pop_number = Module.cwrap("jslua_pop_number", "number", ["number"]);
	var lua_push_number = Module.cwrap("jslua_push_number", "", ["number", "number"]);
	
	var lua_settable = Module.cwrap("lua_settable", "", ["number", "number"]);

	var lua_pop_ref = Module.cwrap("jslua_pop_ref", "number", ["number"]);
	var lua_push_ref = Module.cwrap("jslua_push_ref", "", ["number", "number"]);
	var lua_unref = Module.cwrap("jslua_unref", "", ["number", "number"]);
	
	var luaTypes = {
		nil: 0,
		bool: 1,
		boolean: 1,
		lightuserdata: 2,
		number: 3,
		string: 4,
		table: 5,
		function: 6,
		userdata: 7,
		thread: 8,
		coroutine: 8
	};

	var MOD_PATH = {
		"lua": "/usr/local/share/lua/5.2/",
		"c": "/usr/local/lib/lua/5.2/",
	};

	for(var idx in MOD_PATH) {
		FS.createPath("/", MOD_PATH[idx].substr(1), true, true);
	}

	function decode_stack(state, stack_size) {
		var ret = [];
		for(var i = 0; i < stack_size; i++) {
			var val = null;
			switch(lua_get_type(state)) {
				case luaTypes.number:
					val = lua_pop_number(state);
					break;
				case luaTypes.string:
					val = lua_pop_string(state);
					break;
				case luaTypes.function:
					val = new LuaFunction(state, lua_pop_ref(state));
					break;
				default:
					val = new LuaReference(state, lua_pop_ref(state));
					break;
			}
			ret.unshift(val);
		}
		return ret;
	}
	
	function push_var(state, arg) {
		var type = typeof arg;
		if(type == "number")
			lua_push_number(state, arg);
		else if(type == "string")
			lua_push_string(state, arg);
		else if(arg instanceof LuaReference)
			arg.push(state);
		else
			return false;
		return true;
	}
	
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
	}

	LuaReference.prototype.close = function() {
		lua_unref(this.state, this.index);
	}

	LuaReference.prototype.push = function(state) {
		if(state && state != this.state)
			throw new Error("Wrong Lua state");
		lua_push_ref(this.state, this.index);
	}

	//LuaFunction
	function LuaFunction() {
		LuaReference.apply(this, arguments);
	}

	inherit(LuaFunction, LuaReference);

	LuaFunction.prototype.call = function(noreturn) {
		this.push(this.state);
		
		var validArgCount = 0;
		for(var i = 0; i < arguments.length; i++) {
			if(push_var(this.state, arguments[i]))
				validArgCount++;
		}
		
		var stack = lua_call(this.state, validArgCount);
		var ret = null;
		if(stack < 0 || !noreturn)
			ret = decode_stack(this.state, Math.abs(stack));
		lua_empty_stack();
		if (stack < 0) {
			throw new LuaError(ret[0]);
		}
		return ret;
	}
	
	//LuaTable
	function LuaTable() {
		LuaReference.apply(this, arguments);
	}
	
	LuaTable.prototype.set = function(key, value) {
		var type = typeof key;
		if(type == "number") {
		} else if(type == "string") {
		} else {
			this.push();
			push_var(this.state, key);
			push_var(this.state, value);
		}
		lua_settable(this.state, -3);
		lua_pop_top(this.state);
		
	}
	
	LuaTable.prototype.get = function(key) {
	}

	//LuaState
	function LuaState() {
		this.state = lua_new_state();
	}

	LuaState.prototype.close = function() {
		lua_delete_state(this.state);
	}

	LuaState.prototype.run = function(code, noreturn) {
		var stack = lua_execute(this.state, code);
		var ret = null;
		if(stack < 0 || !noreturn)
			ret = decode_stack(this.state, Math.abs(stack));
		lua_empty_stack();
		if (stack < 0) {
			throw new LuaError(ret[0]);
		}
		return ret;
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
			self.run(libname + ' = require"' + libname + '"', true);
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
		LuaReference: LuaReference
	};  
})();

for(var idx in exports) {
	if(exports.hasOwnProperty(idx))
		window[idx] = exports[idx];
}

