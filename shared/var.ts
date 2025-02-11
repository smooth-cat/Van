import { DocumentSymbol, Location, Position, Range, Uri as RawUri } from 'vscode';
import { rgbStrToRgb } from './color';

export type Uri = RawUri & {
  relativePath: string;
  active: boolean;
  expand: boolean;
	showMore: boolean;
  scroll?: { id: number };
	symbols?: DocNode[];
};

export enum MsgType {
  DocSwitch = 'DocSwitch',
  CursorMove = 'CursorMove',
  SelectionChange = 'SelectionChange',
  CodeChanged = 'CodeChanged',
  CreateFile = 'CreateFile',
  DeleteFile = 'DeleteFile',
  RenameFile = 'RenameFile',
  Request = 'Request',
  Response = 'Response',
  Reload = 'Reload',
  LockModeChange = 'LockModeChange',
	ConfigChange = 'ConfigChange'
}

export enum ReqType {
  Command = 'Command',
  Eval = 'Eval'
}

export type IRange = [Position, Position];

export type Loc = {
  uri: Uri;
  range: IRange;
};

export type Reference = Loc & {
  name: string;
  lineText: string;
  suffix: string;
  prefix: string;
  active: boolean;
};

export type Define = Reference & {
  /** 包含声明关键字的字符串 */
  declaration: string;
  /** 定义在文件中的 作用域 嵌套名称 */
  symbolKey?: string;
};

export type FileRef = [Uri, Reference[]];

export type FetchRefRes = {
  define: Define;
  fileRefs: FileRef[];
  key: number;
};

export type DocNode = Pick<DocumentSymbol, 'name' | 'kind'> & {
  location: Loc;
  range: IRange;
	selectionRange: IRange;
	children: DocNode[];
	key: string;
	expand: boolean;
	/** 匹配字符串开始位置 */
	start: number;
	/** 匹配字符串结束 */
	end: number;
	/** 儿子是否匹配 */
	childMatch: boolean;
	/** 自己的 key */
	selfKey: string;
	_i: number;
};

export type IFetchSymbolsRes = {
	hasRepeat: boolean;
	symbols: DocNode[];
}

/** 这个类型适用于 src */
export type SDocNode = Omit<DocNode, 'location' | 'range' | 'selectionRange' | 'children'> & {
	location: Location,
	range: Range,
	selectionRange: Range,
	children: SDocNode[]
}

export enum RefreshKind {
  /**
   * Selection changed due to typing in the editor.
   */
  Keyboard = 1,
  /**
   * Selection change due to clicking in the editor.
   */
  Mouse = 2,
  /**
   * Selection changed because a command ran.
   */
  Command = 3,

  BackOrForward = 'BackOrForward',
  GotoLocation = 'GotoLocation',
  GotoLocationRefresh = 'GotoLocationRefresh',
  DocEdit = 'DocEdit'
}

export enum SymbolKind {
  /**
   * The `File` symbol kind.
   */
  File = 0,
  /**
   * The `Module` symbol kind. ts. namespace
   */
  Module = 1,
  /**
   * The `Namespace` symbol kind.
   */
  Namespace = 2,
  /**
   * The `Package` symbol kind.
   */
  Package = 3,
  /**
   * The `Class` symbol kind.
   */
  Class = 4,
  /**
   * The `Method` symbol kind.
   */
  Method = 5,
  /**
   * The `Property` symbol kind.
   */
  Property = 6,
  /**
   * The `Field` symbol kind.
   */
  Field = 7,
  /**
   * The `Constructor` symbol kind.
   */
  Constructor = 8,
  /**
   * The `Enum` symbol kind.
   */
  Enum = 9,
  /**
   * The `Interface` symbol kind.
   */
  Interface = 10,
  /**
   * The `Function` symbol kind.
   */
  Function = 11,
  /**
   * The `Variable` symbol kind.
   */
  Variable = 12,
  /**
   * The `Constant` symbol kind.
   */
  Constant = 13,
  /**
   * The `String` symbol kind.
   */
  String = 14,
  /**
   * The `Number` symbol kind.
   */
  Number = 15,
  /**
   * The `Boolean` symbol kind.
   */
  Boolean = 16,
  /**
   * The `Array` symbol kind.
   */
  Array = 17,
  /**
   * The `Object` symbol kind.
   */
  Object = 18,
  /**
   * The `Key` symbol kind.
   */
  Key = 19,
  /**
   * The `Null` symbol kind.
   */
  Null = 20,
  /**
   * The `EnumMember` symbol kind.
   */
  EnumMember = 21,
  /**
   * The `Struct` symbol kind.
   */
  Struct = 22,
  /**
   * The `Event` symbol kind.
   */
  Event = 23,
  /**
   * The `Operator` symbol kind.
   */
  Operator = 24,
  /**
   * The `TypeParameter` symbol kind.
   */
  TypeParameter = 25
}

export enum LockType {
	UnLock,
	HalfLock,
	Lock,
}

export const AllSymbolKinds = Object.values(SymbolKind).filter(it => typeof it === 'number');

export const SymbolMap = {
  /**
   * The `File` symbol kind.
   */
  [SymbolKind.File]: ['file', 'rgb(255, 0, 0)'],
  /**
   * The `Module` symbol kind.
   */
  [SymbolKind.Module]: ['module', 'rgb(68, 118, 255)'],
  /**
   * The `Namespace` symbol kind.
   */
  [SymbolKind.Namespace]: ['nspace', 'rgb(255, 196, 0)'],
  /**
   * The `Package` symbol kind.
   */
  [SymbolKind.Package]: ['pkg', 'rgb(183, 255, 0)'],
  /**
   * The `Class` symbol kind.
   */
  [SymbolKind.Class]: ['class', 'rgb(255, 136, 0)'],
  /**
   * The `Method` symbol kind. TODO: 考虑是否要叫 method
   */
  [SymbolKind.Method]: ['method', 'rgb(210, 168, 254)'],
  /**
   * The `Property` symbol kind.
   */
  [SymbolKind.Property]: ['prop', 'rgb(0, 255, 213)'],
  /**
   * The `Field` symbol kind.
   */
  [SymbolKind.Field]: ['tag', 'rgb(0, 247, 255)'],
  /**
   * The `Constructor` symbol kind.
   */
  [SymbolKind.Constructor]: ['ctor', 'rgb(0, 162, 255)'],
  /**
   * The `Enum` symbol kind.
   */
  [SymbolKind.Enum]: ['enum', 'rgb(245, 145, 51)'],
  /**
   * The `Interface` symbol kind.
   */
  [SymbolKind.Interface]: ['intf', 'rgb(120, 212, 211)'],
  /**
   * The `Function` symbol kind.
   */
  [SymbolKind.Function]: ['func', 'rgb(232, 151, 255)'],
  /**
   * The `Variable` symbol kind.
   */
  [SymbolKind.Variable]: ['var', 'rgb(255, 207, 158)'],
  /**
   * The `Constant` symbol kind.
   */
  [SymbolKind.Constant]: ['const', 'rgb(204, 0, 255)'],
  /**
   * The `String` symbol kind.
   */
  [SymbolKind.String]: ['str', 'rgb(155, 106, 255)'],
  /**
   * The `Number` symbol kind.
   */
  [SymbolKind.Number]: ['num', 'rgb(255, 0, 132)'],
  /**
   * The `Boolean` symbol kind.
   */
  [SymbolKind.Boolean]: ['bool', 'rgb(255, 0, 76)'],
  /**
   * The `Array` symbol kind.
   */
  [SymbolKind.Array]: ['arr', 'rgb(221, 142, 58)'],
  /**
   * The `Object` symbol kind.
   */
  [SymbolKind.Object]: ['obj', 'rgb(221, 216, 58)'],
  /**
   * The `Key` symbol kind.
   */
  [SymbolKind.Key]: ['Key', 'rgb(137, 221, 58)'],
  /**
   * The `Null` symbol kind.
   */
  [SymbolKind.Null]: ['null', 'rgb(58, 221, 58)'],
  /**
   * The `EnumMember` symbol kind.
   */
  [SymbolKind.EnumMember]: ['enumm', 'rgb(58, 221, 145)'],
  /**
   * The `Struct` symbol kind.
   */
  [SymbolKind.Struct]: ['stru', 'rgb(58, 210, 221)'],
  /**
   * The `Event` symbol kind.
   */
  [SymbolKind.Event]: ['event', 'rgb(58, 153, 221)'],
  /**
   * The `Operator` symbol kind.
   */
  [SymbolKind.Operator]: ['opr', 'rgb(58, 96, 221)'],
  /**
   * The `TypeParameter` symbol kind.
   */
  [SymbolKind.TypeParameter]: ['type', 'rgb(218, 58, 221)'],
};

(() => {
	for (const key in SymbolMap) {
		const item = SymbolMap[key];
		const [_, color] = item;
		const {r,g,b} = rgbStrToRgb(color);
		item.addition = {
			labelStyle: `color: ${color};background: rgba(${r},${g},${b},0.3);`,
			cssVar: `
			--label-solid: ${color}; 
			--label-opacity3: rgba(${r},${g},${b},0.3);
			--label-opacity5: rgba(${r},${g},${b},0.5);
			`,
		};
	}
})();