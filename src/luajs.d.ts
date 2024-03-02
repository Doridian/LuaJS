export class LuaReference {
    unref(): void;
    push(state?: number): void
    getmetatable(): void
    setmetatable(): void;
}

export class LuaFunction extends LuaReference {
    getClosure(): (...args: unknown[]) => Promise<unknown[]>;
    call(...args: unknown[]): Promise<unknown>;
}

export class LuaTable extends LuaReference {
    set(key: unknown, value:unknown): void;
    get(key: unknown): unknown;
    toObject(recurse: boolean, unrefAll: boolean, maxDepth?: number): Record<string, unknown> | unknown[];
}

export class LuaState {
    open(): Promise<void>;
    getTop(): void;
    unrefAll(): void;
    close():void;
    run(code: string, blockName?: string): Promise<unknown[]>;
    getGlobalTable(): LuaTable;
    createTable(): LuaTable;
    loadDocumentScripts(doc: Document): Promise<void>;
    listenForScripts(doc: Document): void;
    enableLuaScriptTags(doc: Document): Promise<void>;
}

export class LuaJS {
    newState(): Promise<LuaState>;
}

export default function(module?: Partial<LuaJS>): Promise<LuaJS>;
