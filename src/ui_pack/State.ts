// TODO
// stateFields
// state.fields - аналогично unisonItem.fields
// const state = new State<Fields>();
// state.render((stateFields) => H.d([...
// state.render((sf) => H.d([...
//
// TODO
// const state = new State();
// state.render((state) => H.d([
//       // подрендер - при рендере верхнего рендера
//       // все подрендеры должны удаляться
//       state.render(...),
//
//       // если подрендер привязан к отличному от рендера стейту
//       // то для удаления подрендеров необходимо указать parentState
//       state1.render(...,
//           {
//               on: ...
//               parentState: state
//           }
//       ),
//   ]),
//   on: ['key1', 'key2', 'key3'],
// )
//
// TODO
// state.modify(H.input(), elm => elm.value = state.getValue('someValue'), {on: ['someValue']})
// state.modify(H.input(), {
//   someValue: elm => elm.value = state.getValue('someValue'),
//   otherValue: elm => elm.classList.toggleValue(state.getValue('someValue')),
// })
//
// TODO убрать
// StorageState.local.render(() => ...,
// {
//   on: ['key1', 'key2', 'key3'],
// });
//
// TODO убрать
// StorageState.session.render(() => ...,
// {
//   on: ['key1', 'key2', 'key3'],
// });
//
// возвращает root
// state.collections.col1.render(() => ...,
// {
//   container: () => ...,
//   root: H.d()
// })
//

import { ChangeItemEvent, ChangeListEvent, UnisonItem, UnisonList } from './types';
import { Tag as H } from './html';

type RenderFunction<T=State> = (object: T) => Element;
type CollectionRenderFunction<T=State> = (object: T, container?: Element) => Element|void;
type RenderOptions = {
    on?: string[];
}

export default class State {
    collectionBindings: Array<{collection: CollectionBinding, key: string}>;
    collections: {[key: string]: CollectionBinding};
    storages: {[key: string]: GlobalStorage};
    stateBindings: StateBinding<object>[];
    state: {[key: string]: any};
    updateHooks: Function[];

    constructor(defaultState?: {[key: string]: any}) {
        this.collections = {};
        this.collectionBindings = [];
        this.storages = {};
        this.state = defaultState || {};
        this.stateBindings = [];
        this.updateHooks = [];
    }

    initCollection(name: string, items: Array<object|UnisonItem>|UnisonList, key?: string): CollectionBinding {
        this.collections[name] = new CollectionBinding(items);
        if (key) {
            this.collectionBindings.push({collection: this.collections[name], key})
        }
        return this.collections[name];
    }

    /**
     * The base class for controls that can be rendered.
     *
     * @deprecated Use standart state instead.
     */
    initStorage(type: string) {
        this.storages[type] = new GlobalStorage(type);
    }

    render(fn: RenderFunction, options: RenderOptions): Element {
        const binding = new StateBinding<object>(this);
        this.stateBindings.push(binding);
        return binding.render(fn, options);
    }

    forseRender() {
        this._update();
    }

    toggleValue(k: string) {
        this.state[k] = !this.state[k];
        this._update(k)
    }

    setValue(k: string, v: any) {
        if (this.state[k] !== v) {
            this.state[k] = v;
            this._update(k);
        }
    }

    setValues(obj: {[key: string]: any}) {
        Object.assign(this.state, obj);
        this._update();
    }

    getValue(k: string): any {
        return this.state[k];
    }

    onUpdate(fn: (state?: State, k?: string) => void): void {
        this.updateHooks.push(fn);
    }

    //TODO _throttledUpdate
    protected _update(k?: string) {
        this.stateBindings.forEach((binding) => {
            binding.update(this, k);
        });
        this.collectionBindings.forEach((cb) => {
            if (k === cb.key) {
                cb.collection.update(this.getValue(cb.key));
            }
        });
        this.updateHooks.forEach((fn) => {
            fn(this.state, k);
        });
    }
}

type CollectionRenderOptions = {
    container?: Function;
    root: Element;
    after?: (item?: UnisonItem|any, el?: Element) => void;
    afterAdd?: (item?: UnisonItem|any, el?: Element) => void;
    afterUpdate?: (item?: UnisonItem|any, el?: Element) => void;
    afterRemove?: (item?: UnisonItem|any, el?: Element) => void;
    noItemsUpdate?: boolean;
    //TODO itemsUpdateOn - и не обновлять без указания конкретных опций
}

// TODO multiply renders
class CollectionBinding {
    items: Array<object|UnisonItem>|UnisonList;
    elements: Element[];
    options: CollectionRenderOptions;
    renderFn: CollectionRenderFunction<UnisonItem>;
    constructor(items: Array<object|UnisonItem>|UnisonList) {
        this.items = items;
        this.elements = [];
        if (this.items instanceof UnisonList) {
            this.items.addEventListener('change', (e: ChangeListEvent) => {
                this.update(e.list);
            });
        }
    }
    update(newItems: any[] | UnisonList): void {
        const tElements: any[] = [];
        newItems.forEach((item, i) => {
            const oldI = this.items instanceof UnisonList
                ? this.items.findIndex((em: UnisonItem) => UnisonItem.isEqual(em, item))
                : this.items.findIndex((em) => em === item);
            if (oldI !== -1 && this.elements[oldI]) {
                tElements[i] = this.elements[oldI];
                this.elements[oldI] = null;
            } else {
                tElements[i] = this._renderItem(this.renderFn, item, i, this.options);
                if (this.options.after) this.options.after(item, tElements[i]);
                if (this.options.afterAdd) this.options.afterAdd(item, tElements[i]);
            }
        });

        // TODO destroy elements and components
        this.elements.forEach((el) => {
            if (el) {
                this.options.root.removeChild(el);
                if (this.options.after) this.options.after();
                if (this.options.afterRemove) this.options.afterRemove();
            }
        });

        // TODO with order
        // TODO sort algorithm
        // tElements.forEach((el) => {
        //     if (el) {
        //         this.options.root.removeChild(el);
        //     }
        // });
        // tElements.forEach((el) => {
        //     if (el) {
        //         this.options.root.appendChild(el);
        //     }
        // });

        if (newItems instanceof UnisonList) {
            this.items = newItems.cloneCollectionOnly();
        } else {
            this.items = newItems;
        }
        this.elements = tElements;
    }
    render(fn: CollectionRenderFunction<UnisonItem>, options: CollectionRenderOptions): Element|DocumentFragment {
        this.options = options;
        this.renderFn = fn;

        this.items.forEach((item, i) => {
            this.elements[i] = this._renderItem(fn, item, i, options);
            if (options.after) options.after(item, this.elements[i]);
            if (options.afterAdd) options.afterAdd(item, this.elements[i]);
        });

        // if (options.root) {
        // if (options.after) options.after();
        // return options.root;
        // } else {
        //     const root = new DocumentFragment();
        //     this.elements.forEach((element, i) => {
        //         root.append(element);
        //         if (options.after) options.after(this.items.at(i), element);
        //     });
        //     return root;
        // }

        return this.options.root;
    }

    _renderItem(fn: CollectionRenderFunction<UnisonItem>, item: object|UnisonItem, _: number, options: CollectionRenderOptions): Element {
        const binding = new CollectionStateBinding<UnisonItem>(item);
        const container = options.container ? options.container(item) : H.d();
        options.root.append(container);
        const el = binding.render(fn, container, options);
        if (el && !container.hasChildNodes(el)) {
            container.append(el);
        }

        //TODO destroy (remove listener)
        if (item instanceof UnisonItem) {
            (item as UnisonItem).addEventListener('change', (e: ChangeItemEvent) => {
                if (!options.noItemsUpdate) {
                    binding.update(e.item);
                }
                if (options.after) options.after(item, container);
                if (options.afterUpdate) options.afterUpdate(item, container);
            });
        }
        return container
    }
}


class GlobalStorage {
    stateBindings: StateBinding<Storage>[];
    storage: Storage;
    constructor(type: string) {
        this.stateBindings = [];
        this.storage = type === 'local' ? localStorage : sessionStorage;
        //TODO render only on needeed state
        window.addEventListener('storage', () => {
            this.stateBindings.forEach((binding) => {
                binding.update(this.storage);
            });
        });
    }
    render(fn: RenderFunction<Storage>, options: object): Element {
        const binding = new StateBinding<Storage>(this.storage);
        this.stateBindings.push(binding);
        return binding.render(fn, options);
    }
}


abstract class AbstractStateBinding<T> {

    options?: {on?: string[]};

    stateObject: T;

    protected _updateStarted: boolean = false;

    constructor(obj: any) {
        this.stateObject = obj;
    }

    update(stateObject: T, key?: string): void {
        if (this.options.on && key && !this.options.on.includes(key)) {
            return;
        }
        if (!this._updateStarted) {
            this._updateStarted = true;
            setTimeout(() => this._update(stateObject), 1);
        }
    }

    abstract _update(stateObject: T): void;
}


// TODO destroy
// TODO on (update on)
// TODO parent
class StateBinding<T> extends AbstractStateBinding<T> {

    element: Element

    renderFn: RenderFunction<T>;

    _update(stateObject: T): void {
        if (this.renderFn) {
            const newElement = this.renderFn(stateObject);
            if (this.element.parentNode) {
                this.element.parentNode.replaceChild(newElement, this.element);
            }
            this.element = newElement;
        }
        this._updateStarted = false;
    }

    render(fn: RenderFunction<T>, options?: object): Element {
        this.renderFn = fn;
        this.options = options;
        const newElement = this.renderFn(this.stateObject);
        this.element = newElement;
        return newElement;
    }
}

export class CollectionStateBinding<T> extends AbstractStateBinding<T> {

    container: Element;

    element: Element|void;

    renderFn: CollectionRenderFunction<T>;

    _update(stateObject: T): void {
        if (this.renderFn) {
            const newElement = this.renderFn(stateObject, this.container);
            if (this.element && newElement) {
                this.container.replaceChild(newElement, this.element);
                this.element = newElement;
            } else if (newElement && !this.element) {
                this.container.appendChild(newElement);
                this.element = newElement;
            } else {
                while(this.container.firstChild) this.container.removeChild(this.container.lastChild);
                delete this.element;
            }
        }
        this._updateStarted = false;
    }

    render(fn: CollectionRenderFunction<T>, container: HTMLElement, options?: object): Element|void {
        this.renderFn = fn;
        this.options = options;
        this.element = this.renderFn(this.stateObject, container);
        this.container = container;
        return this.element;
    }

}
