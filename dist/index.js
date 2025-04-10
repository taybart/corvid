var __webpack_require__ = {};
(()=>{
    __webpack_require__.d = (exports, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports, '__esModule', {
            value: true
        });
    };
})();
var dom_namespaceObject = {};
__webpack_require__.r(dom_namespaceObject);
__webpack_require__.d(dom_namespaceObject, {
    btn: ()=>btn,
    el: ()=>el,
    form: ()=>dom_form,
    ls: ()=>ls,
    params: ()=>params,
    ready: ()=>ready
});
var style_namespaceObject = {};
__webpack_require__.r(style_namespaceObject);
__webpack_require__.d(style_namespaceObject, {
    cssVar: ()=>cssVar,
    gradient: ()=>gradient,
    isDarkMode: ()=>isDarkMode,
    onDarkMode: ()=>onDarkMode,
    switchTheme: ()=>switchTheme
});
var utils_namespaceObject = {};
__webpack_require__.r(utils_namespaceObject);
__webpack_require__.d(utils_namespaceObject, {
    bytesToHuman: ()=>bytesToHuman,
    genID: ()=>genID,
    request: ()=>request
});
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
function ready(cb) {
    window.addEventListener('DOMContentLoaded', cb);
}
class btn {
    onClick(cb) {
        var _this_el;
        null == (_this_el = this.el) || _this_el.addEventListener('click', cb);
    }
    constructor(id, content){
        _define_property(this, "el", void 0);
        this.el = null;
        if (id) {
            this.el = document.getElementById(id);
            if (this.el && content) this.el.innerHTML = content;
        }
    }
}
class dom_form {
    byID(id) {
        this.el = document.getElementById(id);
        return this;
    }
    onChange(cb) {
        var _this_el;
        null == (_this_el = this.el) || _this_el.addEventListener('change', cb);
    }
    constructor(id){
        _define_property(this, "el", void 0);
        this.el = null;
        if (id) this.el = document.getElementById(id);
    }
}
class el {
    child(ch) {
        var _this_el;
        null == (_this_el = this.el) || _this_el.appendChild(ch);
        return this;
    }
    inner(content) {
        if (this.el) this.el.innerHTML = content;
        return this;
    }
    src(url) {
        if (this.el instanceof HTMLIFrameElement) this.el.src = url;
        return this;
    }
    style(style) {
        if (this.el) {
            if ('string' == typeof style) this.el.style = style;
            else if ('object' == typeof style) {
                let s = '';
                Object.entries(style).forEach(([k, v])=>s += `${k}:${v};`);
                this.el.style = s;
            }
        }
        return this;
    }
    onClick(cb) {
        var _this_el;
        null == (_this_el = this.el) || _this_el.addEventListener('click', cb);
        return this;
    }
    listen(event, cb) {
        var _this_el;
        null == (_this_el = this.el) || _this_el.addEventListener(event, cb);
        return this;
    }
    constructor({ id, type, content }){
        _define_property(this, "el", void 0);
        if (id) this.el = document.getElementById(id);
        else if (type) this.el = document.createElement(type);
        else throw new Error('no id or type provided');
        if (this.el && content) this.el.innerHTML = content;
    }
}
class params {
    set(p) {
        for (let [k, v] of Object.entries(p))this.params.set(k, v);
        return this;
    }
    toString() {
        return this.params.toString();
    }
    constructor(){
        _define_property(this, "params", void 0);
        this.params = new URLSearchParams();
    }
}
const ls = {
    get (k) {
        return localStorage.getItem(k);
    },
    set (k, v) {
        localStorage.setItem(k, v);
    }
};
function switchTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}
function cssVar(name) {
    const style = window.getComputedStyle(document.body);
    return style.getPropertyValue(name);
}
function isDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
function onDarkMode(cb) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (ev)=>{
        cb(ev.matches);
    });
}
function gradient(start, end, value) {
    value = Math.max(0, Math.min(100, value));
    const red = Math.round(start.red + (end.red - start.red) * value / 100);
    const green = Math.round(start.green + (end.green - start.green) * value / 100);
    const blue = Math.round(start.blue + (end.blue - start.blue) * value / 100);
    const alpha = Math.round(start.alpha + (end.alpha - start.alpha) * value / 100);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
function utils_define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
function bytesToHuman(bytes, options = {}) {
    const { useSI = false, decimals = 2, includeUnits = true, targetUnit = null } = options;
    const unit = useSI ? 1000 : 1024;
    const units = useSI ? [
        'B',
        'kB',
        'MB',
        'GB',
        'TB',
        'PB',
        'EB',
        'ZB',
        'YB'
    ] : [
        'B',
        'KiB',
        'MiB',
        'GiB',
        'TiB',
        'PiB',
        'EiB',
        'ZiB',
        'YiB'
    ];
    if (null === targetUnit) {
        let val = parseInt(bytes, 10);
        if (Math.abs(val) < unit) return `${bytes} B`;
        let u = 0;
        while(Math.abs(val) >= unit && u < units.length - 1){
            val /= unit;
            u++;
        }
        if (includeUnits) return `${val.toFixed(decimals)} ${units[u]}`;
        return `${val.toFixed(decimals)}`;
    }
    const targetUnitIndex = units.indexOf(targetUnit);
    if (-1 === targetUnitIndex) throw new Error(`Invalid unit: ${targetUnit}. Valid units are: ${units.join(', ')}`);
    let val = parseInt(bytes, 10);
    for(let i = 0; i < targetUnitIndex; i++)val /= unit;
    if (includeUnits) return `${val.toFixed(decimals)} ${targetUnit}`;
    return `${val.toFixed(decimals)}`;
}
function genID(len = 15, alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') {
    return [
        ...crypto.getRandomValues(new Uint8Array(len))
    ].map((value)=>alphabet[Math.floor(value / 255 * alphabet.length)]).join('');
}
class request {
    auth(token) {
        this.opts.headers.Authorization = `Bearer ${token}`;
        return this;
    }
    body(body) {
        this.opts.body = body;
        return this;
    }
    async do({ path, overrideBody, overrideSuccess }) {
        if (this.opts.auth) this.opts.headers.Authorization = `Bearer ${this.opts.auth}`;
        const body = overrideBody || this.opts.body;
        const res = await fetch(`${this.opts.url}${path}`, {
            method: this.opts.method,
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                ...this.opts.headers
            },
            body: JSON.stringify(body)
        });
        const success = overrideSuccess || this.opts.success;
        if (res.status !== success) {
            const body = await res.json();
            throw new Error(`bad response ${res.status} !== ${this.opts.success}, body: ${body}`);
        }
        return await res.json();
    }
    constructor(opts){
        utils_define_property(this, "opts", void 0);
        if (opts.type && 'json' !== opts.type) throw new Error('this class only provides json requests');
        this.opts = opts;
        if (!this.opts.success) this.opts.success = 200;
        if (!this.opts.headers) this.opts.headers = {};
    }
}
export { dom_namespaceObject as dom, style_namespaceObject as style, utils_namespaceObject as utils };
