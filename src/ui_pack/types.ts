const ITEM = 'item';
const LIST = 'list';
const SETTLE = 'settle';
const UNISON_VERSION = '0.5';

export type FieldType = 'integer' | 'float' | 'string' | 'list' | 'item' | 'uuid' | 'boolean' | 'array(integer)' | 'array(float)' | 'array(string)' | 'settle' | 'date'
// TODO убрать
| 'nullType';

export type InitDataMeta = {[key: string]: any};

export type UnisonModelField = {
    get?: (item: UnisonItem) => any,
    set?: (item: UnisonItem) => void,
}

export type UnisonModel = {
    [key: string]: UnisonModelField | UnisonModel
};

export type InitData<T=DefaultFields> = {
    data?: Array<UnisonItem<T>|UnisonList<T>>;
    meta?: InitDataMeta;
    cascade?: {[key: string]: InitData<T>};
}

export type ComponentData = {[key: string]: InitData};

class NoFieldError extends Error {
    constructor(fieldName: string) {
        super(`There is no field "${fieldName}" in the schema.`);
    }
}

export type Field<T={[key: string]: any}> = {
    name: string;
    type: FieldType;
    schema?: Schema,
    codec?: object;
    meta?: T;
}

export type Schema<T={[key: string]: any}> = Field<T>[];

export type UnisonData<T={[key: string]: any}> = {
    item?: any[];
    list?: any[];
    schema: Schema;
    meta?: T;
    codec?: object;
}

export type UnisonResponseData = {
    data: UnisonData;
}

export type DefaultFields = {[key: string]: any};

export class ChangeItemEvent extends Event {
    item: UnisonItem;
    constructor(item: UnisonItem) {
        super('change', {bubbles: true});
        this.item = item;
    }
}


type UnisonListChanges = {
    added?: UnisonItem[],
    removed?: UnisonItem[],
    changed?: UnisonItem[],
}

export type Getter = (index: number, fieldName: string) => any;
export type CompactGetter = (index: number) => any;

export class ChangeListEvent extends Event {
    list: UnisonList;
    changes: UnisonListChanges;
    constructor(list: UnisonList, changes: UnisonListChanges) {
        super('change', {bubbles: true});
        this.list = list;
        this.changes = changes;
    }
}

export type UnisonListListener = (e: ChangeListEvent) => void;
export type UnisonItemListener = (e: ChangeItemEvent) => void;

export class UnisonCompactList<T> {
    data: T[];
    constructor(params: {data: T[]}) {
        this.data = params.data;
    }

    dataIterator(): Generator<CompactGetter> {
        return function*() {
            const dataGetter = this.rawDataGetter();

            let i = 0;
            while(i < this.count()) {
                yield dataGetter;
                i++;
            }
        }.bind(this)();
    }

    rawDataGetter(): CompactGetter {
        return (index: number): any => {
            return this.data[index];
        }
    }

    forEachIndex(fn: (i: number, fn: CompactGetter) => void): void {
        let i = 0;
        for (const dataGetter of this.dataIterator()) {
            fn(i, dataGetter);
            i++;
        }
    }

    max(): number {
        return Math.max.apply(null, this.data);
    }

    min(): number {
        return Math.min.apply(null, this.data);
    }

    count(): number {
        return this.data.length;
    }
}

abstract class Abstract<T=DefaultFields> {
    protected _listners: Function[];
    protected _eventNodes: HTMLElement[];
    protected _rawData: UnisonData;
    protected _keyField: string;

    constructor() {
        this._listners = [];
        this._eventNodes = [];
    }

    getEventNode(): HTMLElement {
        const node = document.createElement('div');
        this._eventNodes.push(node);
        return node;
    }

    dispatchEvent(event: Event) {
        this._listners.forEach((listner) => {
            listner(event);
        });

        //Данное решение необходимо для того, чтобы
        //1) не обрабатывать события если виджет удален из дом-дерева
        //2) дать возможность сборщику мусора удалить отработавший виджет
        //Соответственно повтороное добавления виджета в дом-дерево приведет к необходимости
        //перегененрировать эвент-ноды
        //Возможны 2 способа реализации
        //1) запрет повторной вставки удаленных виджетов
        //2) декларативный подход при работе с эвент-нодами
        //   это потребует запрета прямого использования connectedCallback и disconnectedCallback
        //   впрочем в первом случае это также необходимо
        this._eventNodes = this._eventNodes.filter((el) => el.isConnected);
        this._eventNodes.forEach((node) => {
            node.dispatchEvent(event);
        });
    }

    //TODO multiple events
    //TODO удалить, чтобы была возможна работа только через эвент-ноду
    addEventListener(_: string, fn: Function) {
        this._listners.push(fn);
    }

    removeEventListener(_: string, fn: Function) {
        this._listners = this._listners.filter(listener => fn !== listener);
    }

    getSchema(): Schema {
        return this._rawData.schema;
    }

    protected _getIndexOf(fieldName: string): number {
        return this._rawData.schema.findIndex((field: Field) => field.name === fieldName);
    }

    getKeyField(): string {
        return this._keyField || this.getSchema()[0].name;
    }

    getMeta(field?: string) {
        if (field) {
            const filedIndex = this._getIndexOf(field);
            if (filedIndex === -1) {
                throw new NoFieldError(field);
            }
            return this._rawData.schema[filedIndex].meta || {};
        } else {
            return this._rawData.meta || {};
        }
    }

    generateItem(data?: any[]|{[key: string]: any}): UnisonItem<T> {
        if (data instanceof Array) {
            return new UnisonItem<T>({data: {item: data || [], schema: this._rawData.schema}, keyField: this._keyField});
        } else {
            const item = new UnisonItem<T>({data: {item: [], schema: this._rawData.schema}, keyField: this._keyField});
            if (data) {
                Object.entries(data).forEach(([field, value]) => item.set(field, value));
            }
            return item;
        }
    }


    toJSON() {
        this.initData();
        return {...this._rawData, unison: UNISON_VERSION};
    }

    // TODO remove - оставить только toJSON
    dump(): string {
        return JSON.stringify(Object.assign({unison: UNISON_VERSION}, this._rawData));
    }

    // TODO remove - оставить только toJSON
    dumpJSON(): object {
        return JSON.parse(this.dump());
    }

    protected _getFieldByIndex(index: number): Field {
        return this._rawData.schema[index];
    }


    // при экспорте в JSON необходимо заполнять пустые объекты массивами
    // в соответствии со схемой
    abstract initData(): void;
}

export class UnisonItem<T=DefaultFields> extends Abstract<T> {

    protected _dataCache: {[key: string]: any};
    protected _fields: T;
    protected _w2ui: object;
    protected _w2ui_expanded: boolean;
    protected _w2ui_children: UnisonItem[];

    public static restore<T=DefaultFields>(data: string, keyField?: string): UnisonItem<T> {
        return new UnisonItem({data: JSON.parse(data) as UnisonData, keyField});
    }

    // TODO record data hash for fast equal
    public static isEqual(rec1: UnisonItem, rec2: UnisonItem): boolean {
        const fields1 = rec1.getSchema().map(field => field.name);
        const fields2 = rec2.getSchema().map(field => field.name);
        return fields1.length === fields2.length && fields1.every(field => {
            const val1 = rec1.get(field);
            const val2 = rec2.get(field);
            if (val1 instanceof UnisonItem && val2 instanceof UnisonItem) {
                return this.isEqual(val1, val2);
            }
            return rec1.get(field) === rec2.get(field)
        });
    }

    constructor(params: {data?: UnisonData, schema?: Schema, keyField?: string}) {
        super();
        this._w2ui = {};
        this._rawData = params.data ? params.data : {item: [], schema: params.schema || []};
        this._dataCache = {};
        this._keyField = params.keyField;
    }

    initData() {
        this._rawData.schema.forEach((field, index) => {
            if (field.type === 'list' || field.type === 'item') {
                const obj = this.get(field.name);
                obj.initData();
                if (this._rawData.item[index] == null) {
                    this.set(field.name, obj)
                }
            }
        })
    }

    getRawData() {
        return this._rawData.item;
    }

    dump(): string {
        return JSON.stringify(this._rawData);
    }

    clone(): UnisonItem<T> {
        return UnisonItem.restore<T>(this.dump());
    }

    get(fieldName: string, noSettle?: boolean): any {
        if (!this._dataCache[fieldName]) {
            const filedIndex = this._getIndexOf(fieldName);
            const field: Field = this._getFieldByIndex(filedIndex);
            if (field == null) {
                throw new NoFieldError(fieldName);
            }
            switch (field.type) {
                case SETTLE:
                    if (noSettle) {
                        throw new NoFieldError(fieldName);
                    } else {
                        this._dataCache[fieldName] = (field.meta as UnisonModelField).get(this);
                    }
                    break;
                case ITEM:
                    this._dataCache[fieldName] = new UnisonItem({data: {
                        item: this._rawData.item[filedIndex] || [],
                        schema: this._rawData.schema[filedIndex].schema
                    }});
                    break;
                case LIST:
                    this._dataCache[fieldName] = new UnisonList({data: {
                        list: this._rawData.item[filedIndex] || [],
                        schema: this._rawData.schema[filedIndex].schema
                    }});
                    break;

                default:
                    this._dataCache[fieldName] = this._rawData.item[filedIndex];
                    break;

            }
        }
        return this._dataCache[fieldName];
    }

    has(fieldName: string): boolean {
        const filedIndex = this._getIndexOf(fieldName);
        return filedIndex !== -1;
    }

    set(fieldName: string, value: any): boolean {
        const filedIndex = this._getIndexOf(fieldName);
        const field: Field = this._getFieldByIndex(filedIndex);
        if (field == null) {
            throw new NoFieldError(fieldName);
        }

        if (this._rawData.item[filedIndex] !== value) {
            switch (field.type) {
                case ITEM:
                    if (field.schema === value.getSchema()) {
                        this._dataCache[fieldName] = value;
                        this._rawData.item[this._getIndexOf(fieldName)] = value._rawData.item;
                    } else {
                        const newItem = this.get(field.name).generateItem();
                        newItem.getSchema().forEach((field: Field) => {
                            if (field.type !== SETTLE) {
                                newItem.set(field.name, value.get(field.name));
                            }
                        })
                        this._dataCache[fieldName] = newItem;
                        this._rawData.item[this._getIndexOf(fieldName)] = newItem._rawData.item;
                    }
                    break;
                case LIST:
                    // TODO validation
                    this._dataCache[fieldName] = value;
                    this._rawData.item[this._getIndexOf(fieldName)] = value._rawData.list;
                    break;

                default:
                    this._rawData.item[filedIndex] = value;
                    this._dataCache[fieldName] = value;
                    break;

            }
            this.updated();
        }
        return true;
    }

    set fields(values: T) {
        for (const [key, value] of Object.entries(values)) {
            this.set(key, value);
        }
    }

    get fields() {
        if (!this._fields) {
            this._fields = new Proxy<any>({}, {
                get: (_, name: string) => {
                    switch (name) {
                        case 'recid':
                            return this.get(this._keyField || this.getSchema()[0].name);
                        case 'w2ui':
                            return this._w2ui;
                        case 'w2ui.expanded':
                            return this._w2ui_expanded;
                        case 'expanded':
                            return this._w2ui_expanded;
                        case 'children':
                            return this._w2ui_children;
                        default:
                            return this.get(name);
                    }
                },
                set: (_, name: string, value) => {
                    switch (name) {
                        case 'recid':
                            return this.set(this._keyField || this.getSchema()[0].name, value);
                        case 'w2ui':
                            this._w2ui = value;
                            return true;
                        case 'w2ui.expanded':
                            this._w2ui_expanded = value;
                            return true;
                        case 'expanded':
                            this._w2ui_expanded = value;
                            return true;
                        case 'children':
                            this._w2ui_children = value;
                            return true;
                        default:
                            return this.set(name, value);
                    }
                }
            }) as T;
        }
        return this._fields;
    }

    getKey(): string {
        return this.get(this.getKeyField());
    }

    updated() {
        this.dispatchEvent(new ChangeItemEvent(this));
    }

    toggle(fieldName: string): void {
        this.set(fieldName, !this.get(fieldName));
    }

    toObject(): {[key: string]: any} {
        return this._rawData.schema.reduce((s, field) => {
            if (field.type == ITEM) {
                s[field.name] = this.get(field.name).toObject();
            } else if (field.type == LIST) {
                s[field.name] = this.get(field.name).map((el: UnisonItem) => el.toObject());
            } else {
                s[field.name] = this.get(field.name);
            }
            return s;
        }, {} as {[key: string]: any});
    }
}

export class Record extends UnisonItem {
}

export class UnisonList<T=DefaultFields> extends Abstract<T> {
    protected _rawData: UnisonData;
    protected _dataCache: UnisonItem<T>[];

    constructor(params: {data?: UnisonData, schema?: Schema, keyField?: string, _cache?: UnisonItem<T>[]}) {
        super();
        this._keyField = params.keyField;
        this._rawData = params.data ? params.data : {list: [], schema: params.schema || []};
        this._dataCache = params._cache || [];
    }

    initData() {
        this._rawData.schema.forEach((field, index) => {
            if ((field.type === 'list' || field.type === 'item')) {
                this._rawData.list.forEach((data, dataIndex) => {
                    const item = this.at(dataIndex);
                    const obj = item.get(field.name);
                    obj.initData();
                    if (data[index] == null) {
                        item.set(field.name, obj)
                    }
                });

            }
        });
    }

    public static restore<T2>(data: string): UnisonList<T2> {
        return new UnisonList<T2>({data: JSON.parse(data) as UnisonData});
    }

    clone(): UnisonList<T> {
        return UnisonList.restore<T>(this.dump());
    }

    cloneCollectionOnly(): UnisonList<T> {
        return new UnisonList<T>({
            data: {
                list: this._rawData.list.map((el) => el),
                schema: this._rawData.schema
            },
            _cache: this._dataCache.map((el) => el)
        });
    }

    filter(fn: Function): UnisonList {
        const res = [];
        let i = 0;
        for (const record of this.iterator()) {
            if (fn(record, i)) {
                res.push(JSON.parse(record.dump()).item);
            }
            i++;
        }
        const data = {
            list: res,
            schema: this._rawData?.schema
        }
        return new UnisonList({data});
    }

    forEach(fn: (el: UnisonItem<T>, i?: number) => void): void {
        let i = 0;
        for (const record of this.iterator()) {
            fn(record, i);
            i++;
        }
    }

    map(fn: (el: UnisonItem<T>, i?: number) => void): any[] {
        let i = 0;
        const res = [];
        for (const record of this.iterator()) {
            res.push(fn(record, i));
            i++;
        }
        return res;
    }

    reduce(fn: (s: any, el: UnisonItem<T>, i?: number) => void, s: any): any {
        let i = 0;
        for (const record of this.iterator()) {
            s = fn(s, record, i);
            i++;
        }
        return s;
    }

    max(field: string): number {
        const fieldIndex = this._getIndexOf(field)
        return this._rawData.list.reduce(((s, el) => Math.max(el[fieldIndex], s)), -Infinity);
    }

    min(field: string): number {
        const fieldIndex = this._getIndexOf(field)
        return this._rawData.list.reduce((s, el) => Math.min(el[fieldIndex], s), Infinity);
    }

    findIndex(fn: (el: UnisonItem<T>, i?: number) => boolean): number {
        let i: number = 0;
        for (const record of this.iterator()) {
            if (fn(record, i)) {
                return i;
            };
            i++;
        }
        return -1;
    }

    find(fn: (el: UnisonItem<T>, i?: number) => boolean): UnisonItem<T>|void {
        let i: number = 0;
        for (const record of this.iterator()) {
            if (fn(record, i)) {
                return record;
            };
            i++;
        }
    }

    findByField(field: string, value: any): UnisonItem<T>|void {
        return this.find((el: UnisonItem<T>) => el.get(field) === value);
    }

    at(index: number): UnisonItem<T> {
        if (!this._dataCache[index]) {
            if (this._rawData.list[index]) {
                this._dataCache[index] = new UnisonItem<T>({data: {item: this._rawData.list[index], schema: this._rawData.schema}, keyField: this._keyField});
            }
        }
        return this._dataCache[index];
    }

    add(item: UnisonItem<T>): UnisonItem {
        if (item.getSchema() === this.getSchema()) {
            const index = this._rawData.list.push(item.getRawData()) - 1;
            this._dataCache[index] = item;
            this.dispatchEvent(new ChangeListEvent(this, {added: [item]}));
            return item;
        } else {
            const newItem = this.generateItem();
            this.getSchema().forEach((field) => {
                if (field.type !== SETTLE) {
                    newItem.set(field.name, item.get(field.name));
                }
            })
            this.add(newItem);
            return newItem;
        }
    }

    insert(item: UnisonItem<T>, position = 0) {
        // TODO validate schema
        this._rawData.list.splice(position, 0, item.getRawData());
        this._dataCache.splice(position, 0, item);
        this.dispatchEvent(new ChangeListEvent(this, {added: [item]}));
    }

    remove(item: UnisonItem<T>) {
        // TODO validate schema
        const index = this._dataCache.findIndex((el) => el === item); ;
        this._rawData.list.splice(index, 1);
        this._dataCache.splice(index, 1);
        this.dispatchEvent(new ChangeListEvent(this, {removed: [item]}));
    }

    iterator(fn?: (el: UnisonItem<T>) => boolean): Generator<UnisonItem<T>> {
        return function*() {
            let i = 0;
            while(i < this.count()) {
                if (!fn || fn(this.at(i))) {
                    yield this.at(i);
                }
                i++;
            }
        }.bind(this)();
    }

    dataIterator(): Generator<Getter> {
        return function*() {
            const dataGetter = this.rawDataGetter();

            let i = 0;
            while(i < this.count()) {
                yield dataGetter;
                i++;
            }
        }.bind(this)();
    }

    rawDataGetter(): Getter {
        return (index: number, fieldName: string): any => {
            const fieldIndex = this._getIndexOf(fieldName);
            return this._rawData.list[index][fieldIndex];
        }
    }

    forEachIndex(fn: (i: number, fn: Getter) => void): void {
        let i = 0;
        for (const dataGetter of this.dataIterator()) {
            fn(i, dataGetter);
            i++;
        }
    }

    toArray(): UnisonItem<T>[] {
        return Array.from(this.iterator());
    }

    toObjectArray(): T[] {
        return this.map(el => el.toObject() as T);
    }

    get asProxy(): T[] {
        return this.map(el => el.fields);
    }

    count(): number {
        return this._rawData && this._rawData.list ? this._rawData.list.length : 0;
    }

    setModel(model: UnisonModel) {
        Object.entries(model).forEach(([key, value]) => {
            if (value.get || value.set) {
                this.getSchema().push({
                    name: key,
                    type: 'settle',
                    meta: value
                });
            } else {
                this._recursySetModel(this._getSchemaPart(key, this.getSchema()), value as UnisonModel)
            }
        });
    }

    protected _recursySetModel(schema: Schema, model: UnisonModel) {
        Object.entries(model).forEach(([key, value]) => {
            if (value.get || value.set) {
                schema.push({
                    name: key,
                    type: 'settle',
                    meta: value
                });
            } else {
                this._recursySetModel(this._getSchemaPart(key, schema), value as UnisonModel)
            }
        });
    }

    protected _getSchemaPart(key: string, schema: Schema) {
        return schema.find((field) => field.name === key)?.schema;
    }
}


export class RecordSet extends UnisonList {
}
