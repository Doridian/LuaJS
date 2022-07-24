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

local __js_Object_entries = js.global.Object.entries
local __js_Symbol_iterator = js.global.Symbol.iterator

function js.__mt_js_object:iterator()
	local js_iterator = self[__js_Symbol_iterator]
	if not js_iterator then
		return
	end

	local js_iterator_instance = js_iterator(self)
	return function()
		local res = js_iterator_instance:next()
		if (not res.value) and (res.done) then
			return
		end
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
	local it = self:iterator()
	if it then
		return it
	end

	return self:entries_iterator()
end

package.path = "/lua/modules/?.lua"
package.cpath = "/lua/modules/?.so"
