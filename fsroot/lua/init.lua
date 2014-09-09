local function __jsmt_addrecurse(tbl)
	local tbl_toTable = tbl.toTable
	 function tbl:toTable(recursive, maxDepth)
		local ret = tbl_toTable(self)
		if not recursive then return ret end
		maxDepth = (maxDepth or 10) - 1
		if maxDepth <= 0 then return nil end
		local k,v
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

function js.__mt_js_object:__pairs()
	local _tbl = self
	local _arr = __js_Object_keys(nil, _tbl)
	local _arrInv = {}
	for k, v in ipairs(_arr) do
		_arrInv[v] = k
	end
	local _next = ipairs(_arr)
	return function(_, lastIdx)
		local nextIdx, nextValue = _next(_arrInv[lastIdx])
		if nextIdx then
			return nextValue, _tbl[nextValue]
		end
		return nil
	end
end

package.path = "/lua/modules/?.lua"
package.cpath = "/lua/modules/?.so"
