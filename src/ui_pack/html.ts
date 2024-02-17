// TODO move to ui_pack
import State from './State';

export type TagChildren = Array<Element|string|CustomElement|DocumentFragment>;

export class CustomElement extends HTMLElement {
    protected _state: State;
    protected _contentTag: DocumentFragment|HTMLElement;
    inited: boolean;

    constructor() {super();}

    appendOnTop(element: Element|DocumentFragment) {
        if (this.children[0]) {
            this.insertBefore(element, this.children[0]);
        } else {
            this.append(element);
        }
        // after init hook
    }

    getState(): State {
        if (!this._state) {
            this._state = new State();
        }
        return this._state;
    }

    connectedCallback() {
        if (!this.inited) {
            this._firstConnect();
            this.inited = true;
        }
    }

    protected _firstConnect() {
    }
};

export class SwitchArea extends CustomElement {
    set params(params: {page: string, data: any}) {
        this.getState().setValue('page', params.page);
        this.getState().setValue('data', params.data);
    }

    connectedCallback() {
        this.appendOnTop(
            this.getState().render((state) => {
                return createTagFormString(state.getValue('page'), [], state.getValue('data'));
            }, {
                on: ['page', 'data']
            })
        );
    }
}
window.customElements.define('switch-area', SwitchArea);

const events: string[] = [
    'abort',
    'afterprint',
    'beforeonload',
    'beforeprint',
    'blur',
    'canplay',
    'canplaythrough',
    'change',
    'click',
    'contextmenu',
    'dblclick',
    'drag',
    'dragend',
    'dragenter',
    'dragleave',
    'dragover',
    'dragstart',
    'drop',
    'durationchange',
    'emptied',
    'ended',
    'error',
    'focus',
    'formchange',
    'forminput',
    'haschange',
    'input',
    'invalid',
    'keydown',
    'keypress',
    'keyup',
    'load',
    'loadeddata',
    'loadedmetadata',
    'loadstart',
    'message',
    'mousedown',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'mousewheel',
    'offline',
    'line',
    'online',
    'pagehide',
    'pageshow',
    'pause',
    'play',
    'playing',
    'popstate',
    'progress',
    'ratechange',
    'readystatechange',
    'redo',
    'resize',
    'scroll',
    'seeked',
    'seeking',
    'select',
    'stalled',
    'storage',
    'submit',
    'suspend',
    'timeupdate',
    'undo',
    'unload',
    'volumechange',
    'waiting',
]

const commonProperties: string[] = [
    'checked',
    'params',
    'value',
]

export const createExtendedTagFromString = <T=Element>(baseTag: string, tagName: string, children?: TagChildren, options?: object): T => {
    const tag = document.createElement(baseTag, {is: tagName});
    return configTag(tag, children, options) as T;
}

export const createTagFormString = <T=Element>(tagName: string, children?: TagChildren, options?: object, properties?: string[]): T => {
    const tag = document.createElement(tagName);
    return configTag(tag, children, options, properties) as T;
}

export const configTag = (tag: HTMLElement, children?: TagChildren, options?: object, properties?: string[]): unknown => {
    if (children) {
        children.forEach((child) => {
            try {
                if (typeof child === 'string') {
                    tag.appendChild(document.createTextNode(child as string));
                } else {
                    tag.appendChild(child as Element);
                }
            } catch (error) {
                console.log(error);
            }
        });
    }
    if (options) {
        for (const [key, value] of Object.entries(options)) {
            if (key === 'on') {
                for (const [event, fn] of Object.entries(value as {[key: string]: () => any})) {
                    tag.addEventListener(event, fn);
                }
            } else {
                if (!events.includes(key)) {
                    if (!commonProperties.includes(key) && (!properties || !properties.includes(key))) {
                        if (value !== undefined) {
                            tag.setAttribute(key, value);
                        }
                    } else {
                        (tag as any)[key] = value;
                    }
                } else {
                    tag.addEventListener(key, value);
                }
            }
        }
    }
    return tag;
}

export const createTag = (tag: Element, children?: TagChildren, options?: object, properties?: string[]): Element => {
    if (children) {
        children.forEach((child) => {
            try {
                if (typeof child === 'string') {
                    tag.appendChild(document.createTextNode(child as string));
                } else {
                    tag.appendChild(child as Element);
                }
            } catch (error) {
                console.log(error);
            }
        });
    }
    if (options) {
        for (const [key, value] of Object.entries(options)) {
            if (!events.includes(key)) {
                if (!commonProperties.includes(key) && (!properties || !properties.includes(key))) {
                    if (value !== undefined) {
                        tag.setAttribute(key, value);
                    }
                } else {
                    (tag as any)[key] = value;
                }
            } else {
                tag.addEventListener(key, value);
            }
        }
    }
    return tag;
}

export const Tag = {
    d: (children?: TagChildren, options?: object): HTMLDivElement => {
        return createTagFormString('div', children, options);
    },
    div: (children?: TagChildren, options?: object): HTMLDivElement => {
        return createTagFormString('div', children, options);
    },
    span: (children?: TagChildren, options?: object): HTMLSpanElement => {
        return createTagFormString('span', children, options);
    },
    sub: (children?: TagChildren, options?: object): HTMLElement => {
        return createTagFormString('sub', children, options);
    },
    textarea: (children?: TagChildren, options?: object): HTMLTextAreaElement => {
        return createTagFormString('textarea', children, options);
    },
    a: (children?: TagChildren, options?: object): HTMLAnchorElement => {
        return createTagFormString('a', children, options);
    },
    button: (children?: TagChildren, options?: object): HTMLButtonElement => {
        return createTagFormString('button', children, options);
    },
    switchArea: (children?: TagChildren, options?: object): SwitchArea => {
        return createTagFormString('switch-area', children, options);
    },
    select: (children?: TagChildren, options?: object): HTMLSelectElement => {
        const tag = createTagFormString('select', children, options) as HTMLSelectElement;
        if (options && Object.keys(options).includes('value')) {
            tag.value = (options as {value: string}).value;
        }
        return tag;

    },
    option: (children?: TagChildren, options?: object): HTMLOptionElement => {
        return createTagFormString('option', children, options);
    },
    img: (options?: object): HTMLImageElement => {
        return createTagFormString('img', null, options);
    },
    input: (options?: object): HTMLInputElement => {
        return createTagFormString('input', null, options);
    },
    label: (children?: TagChildren, options?: object): HTMLLabelElement => {
        return createTagFormString('label', children, options);
    },
    pre: (children?: TagChildren, options?: object): HTMLPreElement => {
        return createTagFormString('pre', children, options);
    },
    svg: (text: string, options?: object): SVGElement => {
        const t = document.createElement('div');
        t.innerHTML = text;
        const tag = t.firstChild as SVGElement;
        if (options) {
            for (const [key, value] of Object.entries(options)) {
                if (!events.includes(key)) {
                    if (value !== undefined) {
                        tag.setAttribute(key, value);
                    }
                } else {
                    tag.addEventListener(key, value);
                }
            }
        }
        return tag;
    }
}

export const Fragment = (children: TagChildren): DocumentFragment => {
    const fragment = new DocumentFragment();
    children.forEach((child) => {
        try {
            if (typeof child === 'string') {
                fragment.appendChild(document.createTextNode(child as string));
            } else {
                fragment.appendChild(child as Element);
            }
        } catch (error) {
            console.log(error);
        }
    });
    return fragment;
}

// TODO удалить?
export const DOMmodify = {
    clearChildren: (el: Element): void => {
        while(el.firstChild) el.removeChild(el.lastChild);
    }
}

