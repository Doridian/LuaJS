export interface LuaReference {
    unref(): void;

    push(state?: number): void
    getmetatable(): void

    setmetatable(): void;
}

interface LuaFunction extends LuaReference {}
export class LuaFunction implements LuaReference {
    getClosure(): (...args: unknown[]) => Promise<unknown[]>;

    call(...args: unknown[]): Promise<unknown>;
}

interface LuaTable extends LuaReference {}
export class LuaTable implements LuaReference {
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

export function newState(): Promise<LuaState>;
