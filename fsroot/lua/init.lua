--Making these local makes the script faster
local js = js
local global = js.global

local function __jsmt_addrecurse(tbl)
	local tbl_toTable = tbl.toTable

	 function tbl:toTable(recursive, maxDepth)
		local ret = tbl_toTable(self)
		if not recursive then
			return ret
		end

		maxDepth = (maxDepth or 10) - 1
		if maxDepth <= 0 then
			return nil
		end

		for k,v in next, ret do
			if v and type(v) == 'userdata' and v.__isJavascript and v:__isJavascript() and v.toTable then
				ret[k] = v:toTable(true, maxDepth)
			end
		end

		return ret
	 end
end
__jsmt_addrecurse(js.__mt_js_object)
__jsmt_addrecurse(js.__mt_js_array)

local __js_Object_entries = global.Object.entries
local __js_Symbol_iterator = global.Symbol.iterator
local __js_Map_prototype = global.Map.prototype
local __js_Object_get_prototype = global.Object.getPrototypeOf
local unpack = table.unpack

function js.__mt_js_object:get_prototype()
	return __js_Object_get_prototype(nil, self)
end

function js.__mt_js_object:iterator()
	local js_iterator = self[__js_Symbol_iterator]
	if not js_iterator then
		return
	end

	local js_iterator_instance = js_iterator(self)
	local js_iterator_done = false
	return function()
		if js_iterator_done then
			return
		end

		local res = js_iterator_instance:next()
		if not res then
			return
		end

		js_iterator_done = res.done

		return res.value
	end
end

function js.__mt_js_object:entries_iterator()
	local it = self:iterator()
	if not it then
		it = __js_Object_entries(nil, self):iterator()
	end
	return function()
		local res = it()
		if res then
			return unpack(res)
		end
	end
end

function js.__mt_js_object:__pairs()
	local proto = self:get_prototype()
	if proto == __js_Map_prototype then
		return self:entries_iterator()
	end

	local it = self:iterator()
	if it then
		return it
	end

	return self:entries_iterator()
end


---@param url string
---@param options { [string] : string }?
---@return boolean ok, string text
local function fetch_text(url, options)
	local req = global:fetch(url, options)
	if not req then
		error("failed to fetch")
	end

	local file = js.await(req)
	if not file.ok then
		if file.status == 404 then
			return nil
		end
		error("failed to fetch: " .. file.status)
	end
	return js.await(file:text())
end

---Creates a searcher function that fetches modules from the web server
---@param extension string
---@param is_native boolean
---@return fun(module: string): function | string
local function fetch_searcher(extension, is_native)
	return function(module)
		-- TODO: When there is `require` in the loaded module, it will try to load it from the web server
		-- we need to prepend the module require with the url to make it work in the case of multiple files
		-- if module:find("^https://") then
		-- 	local ok, err = fetch_text(module, {
		-- 		method = "GET",
		-- 		mode = "cors",
		-- 	})

		-- 	if ok then
		-- 		local ok, err = load(err, "@"..module)
		-- 		return ok or ("Could not load: "..(err or "Unknown error"))
		-- 	else
		-- 		return "Failed to fetch: "..err
		-- 	end
		-- end
		local search_path = (is_native and package.cpath or package.path):gsub("%.so", extension):gsub("%.lua", extension)
		local module_path = module:gsub("%.", "/")

		---@type string[]
		local checked_paths = {}
		for path in search_path:gmatch("[^;]+") do
			local test_path = path:gsub("%?", module_path)
			local text = fetch_text(test_path)
			if text then
				if is_native then
					error("Cannot load native modules from the web yet")
					-- return package.loadlib(test_path, "luaopen_"..module:gsub("%.", "_"))
				else
					local ok, err = load(text, "@"..test_path)
					if not ok then
						error("Could not load: "..(err or "Unknown error"))
					end

                    return ok
                end
			end

			table.insert(checked_paths, test_path)
		end

		return "Could not find module: " ..
		module.." on web server (checked paths: \n\t\t - "..table.concat(checked_paths, "\n\t\t - ")
	end
end

table.insert(package.searchers, fetch_searcher(".lua", false))
table.insert(package.searchers, fetch_searcher(".so", true))
table.insert(package.searchers, fetch_searcher(".wasm", true))
