import { Message } from "../../shared/message";
import { BaseEvent } from "../../shared/message/event";

// @ts-ignore
export const vscode = globalThis.acquireVsCodeApi ? acquireVsCodeApi() : { postMessage: (msg) =>  console.log('模拟postMessage',msg)};

export const msg = new Message(
	(msg) => vscode.postMessage(msg),
	(fn) => window.addEventListener('message', (e) => fn(e.data)),
)

export const Events = new BaseEvent();

export enum SymbolKind {
	/**
	 * The `File` symbol kind.
	 */
	File = 0,
	/**
	 * The `Module` symbol kind.
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

const keys = ['label']

export const SymbolMap = {
		/**
		 * The `File` symbol kind.
		 */
		[SymbolKind.File] :[
			'File'
		],
		/**
		 * The `Module` symbol kind.
		 */
		[SymbolKind.Module] :[
			'module'
		],
		/**
		 * The `Namespace` symbol kind.
		 */
		[SymbolKind.Namespace] :[
			'ns'
		],
		/**
		 * The `Package` symbol kind.
		 */
		[SymbolKind.Package] :[
			'pkg'
		],
		/**
		 * The `Class` symbol kind.
		 */
		[SymbolKind.Class] :[
			'class'
		],
		/**
		 * The `Method` symbol kind.
		 */
		[SymbolKind.Method] :[
			'Method'
		],
		/**
		 * The `Property` symbol kind.
		 */
		[SymbolKind.Property] :[
			'prop'
		],
		/**
		 * The `Field` symbol kind.
		 */
		[SymbolKind.Field] :[
			'Field'
		],
		/**
		 * The `Constructor` symbol kind.
		 */
		[SymbolKind.Constructor] :[
			'ctor'
		],
		/**
		 * The `Enum` symbol kind.
		 */
		[SymbolKind.Enum] :[
			'enum'
		],
		/**
		 * The `Interface` symbol kind.
		 */
		[SymbolKind.Interface] :[
			'intf'
		],
		/**
		 * The `Function` symbol kind.
		 */
		[SymbolKind.Function] :[
			'func'
		],
		/**
		 * The `Variable` symbol kind.
		 */
		[SymbolKind.Variable] :[
			'var'
		],
		/**
		 * The `Constant` symbol kind.
		 */
		[SymbolKind.Constant] :[
			'const'
		],
		/**
		 * The `String` symbol kind.
		 */
		[SymbolKind.String] :[
			'str'
		],
		/**
		 * The `Number` symbol kind.
		 */
		[SymbolKind.Number] :[
			'num'
		],
		/**
		 * The `Boolean` symbol kind.
		 */
		[SymbolKind.Boolean] :[
			'bool'
		],
		/**
		 * The `Array` symbol kind.
		 */
		[SymbolKind.Array] :[
			'arr'
		],
		/**
		 * The `Object` symbol kind.
		 */
		[SymbolKind.Object] :[
			'obj'
		],
		/**
		 * The `Key` symbol kind.
		 */
		[SymbolKind.Key] :[
			'Key'
		],
		/**
		 * The `Null` symbol kind.
		 */
		[SymbolKind.Null] :[
			'null'
		],
		/**
		 * The `EnumMember` symbol kind.
		 */
		[SymbolKind.EnumMember] :[
			'enumM'
		],
		/**
		 * The `Struct` symbol kind.
		 */
		[SymbolKind.Struct] :[
			'stru'
		],
		/**
		 * The `Event` symbol kind.
		 */
		[SymbolKind.Event] :[
			'event'
		],
		/**
		 * The `Operator` symbol kind.
		 */
		[SymbolKind.Operator] :[
			'opr'
		],
		/**
		 * The `TypeParameter` symbol kind.
		 */
		[SymbolKind.TypeParameter] :[
			'type'
		],
}