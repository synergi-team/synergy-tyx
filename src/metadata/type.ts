import { Class, ObjectType, Prototype } from '../types/core';
import { DesignMetadata } from './method';
import { Metadata } from './registry';

export class ID extends String { }
export class Int extends Number { }
export class Float extends Number { }
export class Any extends Object { }

export type Scalar =
  (new () => String)
  | (new () => ID)
  | (new () => Boolean)
  | (new () => Int)
  | (new () => Float)
  | (new () => Object)
  | (new () => Any)
  | (new () => Date);

export type ClassRef<T> = (type?: any) => (ObjectType<T> | [ObjectType<T>]);
export type ScalarRef<T = Scalar> = (type?: any) => (Scalar | [Scalar]);
export type VarType<T = any> = Scalar | [Scalar] | ScalarRef<T> | ClassRef<T> | EnumMetadata;
export type InputType<T = any> = VarType<T> | [undefined] | ((ref?: any) => IEnumMetadata);
export type ResultType<T = any> = VarType<T>;

export type Select<T = any> = {
  // tslint:disable-next-line:prefer-array-literal
  [P in keyof T]?: T[P] extends Array<infer U>
  ? (Select<U> | true | false | 1 | 2)
  : T[P] extends ReadonlyArray<infer U>
  ? (Select<U> | true | false | 1 | 2)
  : (Select<T[P]> | true | false | 1 | 2)
};

export enum GraphKind {
  ID = 'ID',
  Int = 'Int',
  Float = 'Float',
  String = 'String',
  // Option = 'String',
  Boolean = 'Boolean',
  Date = 'Date',
  DateTime = 'DateTime',
  Timestamp = 'Timestamp',
  Email = 'Email',
  Object = 'JSON',
  ANY = 'ANY',
  // Complex
  Array = 'Array',
  Enum = 'Enum',
  // Roots
  Metadata = 'Metadata',
  Input = 'Input',
  Type = 'Type',
  Entity = 'Entity',
  // Ref
  Ref = '#REF',
  // Void
  Void = '#VOID',
}

export namespace GraphKind {
  export function toJS(type: GraphKind | string): string {
    switch (type) {
      case GraphKind.ID:
      case GraphKind.String:
      case GraphKind.Email:
        return 'string';
      case GraphKind.Int:
      case GraphKind.Float:
        return 'number';
      case GraphKind.Boolean:
        return 'boolean';
      case GraphKind.Date:
      case GraphKind.DateTime:
      case GraphKind.Timestamp:
        return 'Date';
      case GraphKind.Object:
      case GraphKind.ANY:
        return 'any';
      case GraphKind.Void:
        return 'void';
      default:
        return null;
    }
  }
  export function toVar(type: GraphKind | string): VarType {
    switch (type) {
      case GraphKind.ID:
        return ID;
      case GraphKind.String:
      case GraphKind.Email:
        return String;
      case GraphKind.Int:
        return Int;
      case GraphKind.Float:
        return Float;
      case GraphKind.Boolean:
        return Boolean;
      case GraphKind.Date:
      case GraphKind.DateTime:
      case GraphKind.Timestamp:
        return Date;
      case GraphKind.Object:
        return Object;
      case GraphKind.ANY:
        return Any;
      case GraphKind.Void:
        return [undefined];
      default:
        return null;
    }
  }
  export function isScalar(type: GraphKind | string) {
    switch (type) {
      case GraphKind.ID:
      case GraphKind.Int:
      case GraphKind.Float:
      case GraphKind.String:
      case GraphKind.Boolean:
      case GraphKind.Date:
      case GraphKind.DateTime:
      case GraphKind.Timestamp:
      case GraphKind.Email:
      case GraphKind.Object:
      case GraphKind.ANY:
      case GraphKind.Void:
        return true;
      default:
        return false;
    }
  }
  export function isStruc(type: GraphKind | string) {
    switch (type) {
      case GraphKind.Metadata:
      case GraphKind.Input:
      case GraphKind.Type:
      case GraphKind.Entity:
        return true;
      default:
        return false;
    }
  }
  export function isEnum(type: GraphKind | string) {
    return type === GraphKind.Enum;
  }
  export function isMetadata(type: GraphKind | string) {
    return type === GraphKind.Metadata;
  }
  export function isEntity(type: GraphKind | string) {
    return type === GraphKind.Entity;
  }
  export function isRef(type: GraphKind | string) {
    return type === GraphKind.Ref;
  }
  export function isArray(type: GraphKind | string) {
    return type === GraphKind.Array;
  }
  export function isVoid(type: GraphKind | string) {
    return type === GraphKind.Void;
  }
  export function isInput(type: GraphKind | string) {
    return type === GraphKind.Input;
  }
  export function isType(type: GraphKind | string) {
    return type === GraphKind.Type;
  }

  export function of(type: any) {
    switch (type) {
      case null:
      case undefined: return GraphKind.ANY;
      case String: return GraphKind.String;
      case ID: return GraphKind.ID;
      case Boolean: return GraphKind.Boolean;
      case Int: return GraphKind.Int;
      case Number: return GraphKind.Float;
      case Float: return GraphKind.Float;
      case Object: return GraphKind.Object;
      case Date: return GraphKind.Date;
      case Any: return GraphKind.ANY;
      default: return GraphKind.Ref;
    }
  }
}

export interface IVarMetadata {
  kind: GraphKind;
  item?: IVarMetadata;
  ref?: Class;
  build?: IVarMetadata;
  def?: string;
  js?: string;
}

export abstract class VarMetadata {
  public kind: GraphKind;
  public item?: VarMetadata;
  public ref?: Class;
  public build?: VarMetadata;
  public def?: string;
  public js?: string;

  public static readonly DESIGN_TYPES: any[] = [String, Number, Boolean, Date];

  public static on(meta: IVarMetadata) {
    return meta && Object.setPrototypeOf(meta, VarMetadata.prototype);
  }

  public static of(item: VarType | InputType | ResultType, design?: boolean): VarMetadata {
    let type = item;
    if (design && !this.DESIGN_TYPES.includes(type)) return undefined;
    let list = false;
    if (Array.isArray(type)) {
      type = type[0];
      if (type === undefined) return { kind: GraphKind.Void };
      list = true;
    }
    const gt = GraphKind.of(type);
    const ref = GraphKind.isRef(gt);

    let meta: IVarMetadata;
    if (type instanceof EnumMetadata) meta = { kind: GraphKind.Ref, ref: () => type };
    else if (list && !ref) meta = { kind: GraphKind.Array, item: { kind: gt } };
    else if (list && ref) meta = { kind: GraphKind.Array, item: { kind: GraphKind.Ref, ref: type } };
    else if (ref) meta = { kind: GraphKind.Ref, ref: type };
    else meta = { kind: gt };
    return VarMetadata.on(meta);
  }
}

export interface IInputMetadata extends IVarMetadata {
  build: IVarMetadata;
}

export class InputMetadata implements IInputMetadata {
  public kind: GraphKind = undefined;
  public item?: VarMetadata = undefined;
  public ref?: Class = undefined;
  public build: VarMetadata = undefined;

  public static of(def: InputType): InputMetadata;
  public static of(obj: IInputMetadata): InputMetadata;
  public static of(defOrObj: IInputMetadata | InputType): InputMetadata {
    let obj = undefined;
    if (defOrObj === undefined) {
      obj = VarMetadata.of(undefined);
    } else if (defOrObj instanceof Function || defOrObj instanceof EnumMetadata || Array.isArray(defOrObj)) {
      obj = VarMetadata.of(defOrObj);
    } else if (defOrObj.kind) {
      obj = defOrObj;
    } else {
      throw new TypeError('Internal metadata error');
    }
    return obj && Object.setPrototypeOf(obj, InputMetadata.prototype);
  }
}

export interface IResultMetadata extends IVarMetadata {
  build: IVarMetadata;
}

export class ResultMetadata implements IResultMetadata {
  public kind: GraphKind = GraphKind.Type;
  item?: VarMetadata = undefined;
  ref?: Class = undefined;
  build: VarMetadata = undefined;

  public static of(def: ResultType): ResultMetadata;
  public static of(obj: IResultMetadata): ResultMetadata;
  public static of(defOrObj: IResultMetadata | ResultType): ResultMetadata {
    let obj = undefined;
    if (defOrObj === undefined) {
      obj = VarMetadata.of(undefined);
    } else if (defOrObj instanceof Function || defOrObj instanceof EnumMetadata || Array.isArray(defOrObj)) {
      obj = VarMetadata.of(defOrObj);
    } else if (defOrObj.kind) {
      obj = defOrObj;
    } else {
      throw new TypeError('Internal metadata error');
    }
    return obj && Object.setPrototypeOf(obj, ResultMetadata.prototype);
  }
}

export interface IFieldMetadata extends IVarMetadata {
  name: string;
  required: boolean;
  design: DesignMetadata;
  build: IVarMetadata;
}

export abstract class FieldMetadata extends VarMetadata implements IFieldMetadata {
  public kind: GraphKind = undefined;
  public name: string = undefined;
  public required: boolean = undefined;
  public item?: VarMetadata = undefined;
  public ref?: Class = undefined;
  public design: DesignMetadata = undefined;
  public build: VarMetadata = undefined;

  public static on(obj: IFieldMetadata): FieldMetadata {
    return obj && Object.setPrototypeOf(obj, FieldMetadata.prototype);
  }
}

export interface IEnumMetadata extends IVarMetadata {
  name: string;
  ref: Function;
  options: string[];
  item?: never;
  build?: never;
}

export class EnumMetadata extends VarMetadata implements IEnumMetadata {
  public kind = GraphKind.Enum;
  public name: string;
  public ref: Function;
  public options: string[];
  public item?: never;
  public build?: never;

  constructor(target: Object, name: string) {
    super();
    if (!name) throw new TypeError('Unnamed enum');
    this.name = name;
    this.ref = () => target;
    this.options = [];
    for (const key in target) {
      if (Number.isInteger(+key)) continue;
      this.options.push(key);
    }
  }

  public static has(target: Object): boolean {
    return Reflect.hasMetadata(Metadata.TYX_ENUM, target);
  }

  public static get(target: Object): EnumMetadata {
    return Reflect.getMetadata(Metadata.TYX_ENUM, target);
  }

  public static define(target: Object, name?: string): EnumMetadata {
    let meta = this.get(target);
    if (!meta) {
      meta = new EnumMetadata(target, name);
      Reflect.defineMetadata(Metadata.TYX_ENUM, meta, target);
      if (Metadata.EntityMetadata[name]) throw new TypeError(`Duplicate enum name: ${name}`);
      Metadata.EnumMetadata[name] = meta;
    } else if (name && name !== meta.name) {
      throw new TypeError(`Can not rename enum from: ${meta.name} to: ${name}`);
    }
    return meta;
  }
}

export interface ITypeMetadata extends IVarMetadata {
  name: string;
  target: Class;
  members: Record<string, IFieldMetadata>;
  ref?: never;
  item?: never;
  build?: never;
}

export class TypeMetadata extends VarMetadata implements ITypeMetadata {
  public kind: GraphKind = undefined;
  public name: string = undefined;
  public target: Class = undefined;
  public members: Record<string, FieldMetadata> = undefined;
  public ref?: never;
  public item?: never;
  public build?: never;

  public def?: string;
  public js?: string;

  constructor(target: Class) {
    super();
    this.target = target;
    this.name = target.name;
  }

  public static has(target: Class | Prototype): boolean {
    return Reflect.hasMetadata(Metadata.TYX_TYPE, target)
      || Reflect.hasMetadata(Metadata.TYX_TYPE, target.constructor);
  }

  public static get(target: Class | Prototype): TypeMetadata {
    return Reflect.getMetadata(Metadata.TYX_TYPE, target)
      || Reflect.getMetadata(Metadata.TYX_TYPE, target.constructor);
  }

  public static define(target: Class): TypeMetadata {
    let meta = this.get(target);
    if (!meta) {
      meta = new TypeMetadata(target);
      Reflect.defineMetadata(Metadata.TYX_TYPE, meta, target);
    }
    return meta;
  }

  public addField(propertyKey: string, type?: VarType, required?: boolean): this {
    this.members = this.members || {};
    if (this.members[propertyKey]) throw new TypeError(`Duplicate field decoration on [${propertyKey}]`);
    const design = Reflect.getMetadata(Metadata.DESIGN_TYPE, this.target.prototype, propertyKey);
    let meta = VarMetadata.of(type || design, !type) as IFieldMetadata;
    if (!meta) {
      throw TypeError(`Design type of [${this.target.name}.${propertyKey}]: `
        + `[${design && design.name}] not in [String, Number, Boolean, Date]`);
    }
    if (process.env.NODE_ENV === 'development' && type && VarMetadata.DESIGN_TYPES.includes(design)) {
      const dt = VarMetadata.of(design);
      if (
        dt.kind !== meta.kind
        && !(meta.kind === GraphKind.Int && design === Number)
        && !(meta.kind === GraphKind.ID && design === String)
      ) {
        console.warn(`Field [${this.target.name}.${propertyKey}]: kind [${meta.kind}] <> design [${design && design.name}]`);
      }
    }
    meta = FieldMetadata.on(meta);
    meta.name = propertyKey;
    meta.required = !!required;
    meta.design = design && { type: design.name, target: design };
    this.members[propertyKey] = meta;
    Reflect.defineMetadata(Metadata.TYX_MEMBER, meta, this.target.prototype, propertyKey);
    return this;
  }

  public commit(type?: GraphKind, name?: string): this {
    this.kind = type;
    this.name = name || this.target.name;
    if (this.kind && !GraphKind.isStruc(this.kind)) throw new TypeError(`Not a struct type: ${this.kind}`);
    // this.name = name;
    switch (type) {
      case GraphKind.Metadata:
        Metadata.RegistryMetadata[this.target.name] = this; break;
      case GraphKind.Input:
        Metadata.InputMetadata[this.target.name] = this; break;
      case GraphKind.Type:
        Metadata.TypeMetadata[this.target.name] = this; break;
      case GraphKind.Entity:
        Metadata.EntityMetadata[this.target.name] = this as any; break;
      default:
        throw new TypeError(`Not Implemented: ${type}`);
    }
    return this;
  }
}
