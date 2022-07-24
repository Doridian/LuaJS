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

local __js_Object_keys = js.global.Object.keys
local __js_Symbol_iterator = js.global.Symbol.iterator

function js.__mt_js_object:__pairs()
	local js_iterator = self[__js_Symbol_iterator]
	if js_iterator then
        local js_iterator_instance = js_iterator(self)
		return function(tbl, idx)
            local res = js_iterator_instance:next()
			if (not res.value) and (res.done) then
				return
			end
            return res.value
        end
	end

	local tbl = self
	local arr = __js_Object_keys(nil, tbl)
	local arrInv = {}
	for k, v in pairs(arr) do
		arrInv[v] = k
	end
	local _next = pairs(arr)
	return function(_, lastIdx)
		local nextIdx, nextValue = _next(arrInv[lastIdx])
		if nextIdx then
			return nextValue, tbl[nextValue]
		end
		return nil
	end
end

package.path = "/lua/modules/?.lua"
package.cpath = "/lua/modules/?.so"
