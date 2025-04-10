/***************
 *    DOM      *
 ***************/
export declare function ready(cb: () => void): void;
export declare class btn {
    el: Element | null;
    constructor(id: string, content: string);
    onClick(cb: (ev: Event) => void): void;
}
export declare class form {
    el: Element | null;
    constructor(id: string);
    byID(id: string): this;
    onChange(cb: (ev: Event) => void): void;
}
export declare class el {
    el: HTMLElement | null;
    constructor({ id, type, content, }: {
        id: string;
        type: string;
        content?: any;
    });
    child(ch: HTMLElement): this;
    inner(content: any): this;
    src(url: string): this;
    style(style: Object | string): this;
    onClick(cb: (ev: Event) => void): this;
    listen(event: string, cb: (ev: Event) => void): this;
}
export declare class params {
    params: URLSearchParams;
    constructor();
    set(p: Object): this;
    toString(): string;
}
export declare const ls: {
    get(k: string): string | null;
    set(k: string, v: any): void;
};
