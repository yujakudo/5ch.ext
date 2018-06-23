/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview key code definision.
 * @since  2018.04.07  copied from yjd.key
 */

if(!yjd) var yjd = {};

if(!yjd.os) {
	yjd.os = {	name: navigator.platform,	};
	yjd.os.family = (yjd.os.name.indexOf('Mac')>=0)? 'Mac': 'Others';
}

yjd.key = {};

/**
 * @typedef yjd.key.code
 * @type {Number}
 * @description Key code and modified key info.
 * Logical OR of a constant of key code and modifiers.
 * Modifiers represent keys pressed simultaneously, eg. yjd.key.SHIFT, yjd.key.ALT, and/or yjd.key.CTRL.
 */

/**
 * Key codes for keydown.
 */
yjd.key.codes = {
	CANCEL:		3,
	HELP:		6,
	BACK_SPACE:	8,
	TAB:		9,
	CLEAR:		12,
	RETURN:		13,
	ENTER:		14,
	SHIFT:		16,
	CONTROL:	17,
	ALT:		18,
	PAUSE:		19,
	CAPS_LOCK:	20,
	ESCAPE:		27,
	SPACE:		32,
	PAGE_UP:	33,
	PAGE_DOWN:	34,
	END:		35,
	HOME:		36,
	LEFT:		37,
	UP:			38,
	RIGHT:		39,
	DOWN:		40,
	PRINTSCREEN:	44,
	INSERT:		45,
	DELETE:		46,
	0:	48,
	1:	49,
	2:	50,
	3:	51,
	4:	52,
	5:	53,
	6:	54,
	7:	55,
	8:	56,
	9:	57,
	_0:	48,
	_1:	49,
	_2:	50,
	_3:	51,
	_4:	52,
	_5:	53,
	_6:	54,
	_7:	55,
	_8:	56,
	_9:	57,
	SEMICOLON:	59,
	EQUALS:		61,
	A:	65,
	B:	66,
	C:	67,
	D:	68,
	E:	69,
	F:	70,
	G:	71,
	H:	72,
	I:	73,
	J:	74,
	K:	75,
	L:	76,
	M:	77,
	N:	78,
	O:	79,
	P:	80,
	Q:	81,
	R:	82,
	S:	83,
	T:	84,
	U:	85,
	V:	86,
	W:	87,
	X:	88,
	Y:	89,
	Z:	90,
	CONTEXT_MENU:	93,
	NUM0:	96,
	NUM1:	97,
	NUM2:	98,
	NUM3:	99,
	NUM4:	100,
	NUM5:	101,
	NUM6:	102,
	NUM7:	103,
	NUM8:	104,
	NUM9:	105,
	NUM_MULTIPLY:	106,
	NUM_ADD:		107,
	NUM_SEPARATOR:	108,
	NUM_SUBTRACT:	109,
	NUM_DECIMAL:	110,
	NUM_DIVIDE:	111,
	F1:		112,
	F2:		113,
	F3:		114,
	F4:		115,
	F5:		116,
	F6:		117,
	F7:		118,
	F8:		119,
	F9:		120,
	F10:	121,
	F11:	122,
	F12:	123,
	F13:	124,
	F14:	125,
	F15:	126,
	F16:	127,
	F17:	128,
	F18:	129,
	F19:	130,
	F20:	131,
	F21:	132,
	F22:	133,
	F23:	134,
	F24:	135,
	NUM_LOCK:		144,
	SCROLL_LOCK:	145,
	ASTERISK:		186,	//	*:
	PLUS:			187,	//	+;
	LESS_THAN:		188,	//	<,
	MINUS:			189,	//	=-
	GRATER_THAN:	190,	//	>.	
	SLASH:			191,
	BACK_QUOTE:		192,	//	`@
	OPEN_BRACKET:	219,	//	{[
	BACK_SLASH:		220,	//	|\
	CLOSE_BRACKET:	221,	//	}]
	QUOTE:			222,	//	~^
	META:			224,
	UNDER_BAR:		226,	//	_\
	IME_PRESS:		229,
	//	modification
	SHIFT:	0x0100,
	ALT:	0x0200,	//	option
	OPTION: 0x0200,
	CTRL:	0x0400,	//	command
	COMMAND:0x0400,
	MASK:	0x00FF	//	mask
};

/**
 * Key names.
 */
yjd.key.names = {
	3:	'Cancel',
	6:	'Help',
	8:	'BackSpace',
	9:	'Tab',
	12:	'Clear',
	13:	'Return',
	14:	'Enter',
	16:	'Shift',
	17:	'Control',
	18:	'Alt',
	19:	'Pause',
	20:	'CapsLock',
	27:	'Escape',
	32:	'Space',
	33:	'PageUp',
	34:	'PageDown',
	35:	'End',
	36:	'Home',
	37:	'Left',
	38:	'Up',
	39:	'Right',
	40:	'Down',
	44:	'PrintScreen',
	45:	'Insert',
	46:	'Delete',
	48:	'0',
	49:	'1',
	50:	'2',
	51:	'3',
	52:	'4',
	53:	'5',
	54:	'6',
	55:	'7',
	56:	'8',
	57:	'9',
	59:	';',
	61:	'=',
	65:	'A',
	66:	'B',
	67:	'C',
	68:	'D',
	69:	'E',
	70:	'F',
	71:	'G',
	72:	'H',
	73:	'I',
	74:	'J',
	75:	'K',
	76:	'L',
	77:	'M',
	78:	'N',
	79:	'O',
	80:	'P',
	81:	'Q',
	82:	'R',
	83:	'S',
	84:	'T',
	85:	'U',
	86:	'V',
	87:	'W',
	88:	'X',
	89:	'Y',
	90:	'Z',
	93:	'ContextMenu',
	96:	'Num0',
	97:	'Num1',
	98:	'Num2',
	99:	'Num3',
	100:	'Num4',
	101:	'Num5',
	102:	'Num6',
	103:	'Num7',
	104:	'Num8',
	105:	'Num9',
	106:	'Num*',
	107:	'Num+',
	108:	'Num,',
	109:	'Num-',
	110:	'Num.',
	111:	'Num/',
	112:	'F1',
	113:	'F2',
	114:	'F3',
	115:	'F4',
	116:	'F5',
	117:	'F6',
	118:	'F7',
	119:	'F8',
	120:	'F9',
	121:	'F10',
	122:	'F11',
	123:	'F12',
	124:	'F13',
	125:	'F14',
	126:	'F15',
	127:	'F16',
	128:	'F17',
	129:	'F18',
	130:	'F19',
	131:	'F20',
	132:	'F21',
	133:	'F22',
	134:	'F23',
	135:	'F24',
	144:	'NumLock',
	145:	'ScrollLock',
	186:	'*',	//	* 
	187:	'+',	//	+;
	188:	'<',	//	<,
	189:	'-',	//	=-
	190:	'>',	//	>.	
	191:	'/',
	192:	'`',	//	`@
	219:	'[',	//	{[
	220:	'\\',	//	|\
	221:	']',	//	}]
	222:	"'",	//	~^
	224:	'Meta',	
	226:	'_',	//	_\
};

/**
 * Get string of key name.
 * @param {number|KeyboardEvent} code Code in yjd.key.code. Specify the logical OR of a constant like '' and the flag
 * 	Or Keyboard event when keydown, keypress or keyup is okey.
 * @param {string} os OS name. Mac or others.
 * @return {string|null} Key name. if code is undefined, rturns null.
 */
yjd.key.getName = function(code, os) {
	if(code instanceof KeyboardEvent) code = yjd.key.getCode(code);		
	if(os===undefined) os = yjd.os.family;
	os = os.toLowerCase();
	var mod = '';
	var key = code & yjd.key.codes.MASK;
	if(code & yjd.key.codes.CTRL)	mod += (os==='mac')? 'Command+': 'Ctrl+';
	if(code & yjd.key.codes.ALT)	mod += (os==='mac')? 'Option+': 'Alt+';
	if(code & yjd.key.codes.SHIFT)	mod += 'Shift+';
	var str = yjd.key.names[key];
	if(str===undefined) {
		return null;
	}
	return mod + str;
};

/**
 * Get code from KeyboardEvent.
 * @param {KeyboardEvent|string|number} event event object or name of key. 
 * @return {yjd.key.code|false} Key code with modifiers.
 */
yjd.key.getCode = function(event) {
	var code;
	if(typeof event==='object' && 'keyCode' in event) {
		code = event.keyCode;
		if(event.shiftKey)	code |= yjd.key.codes.SHIFT;
		if(event.altKey )	code |= yjd.key.codes.ALT;
		if(event.ctrlKey )	code |= yjd.key.codes.CTRL;
	} else if(typeof event==='string'){
		code = event.toUpperCase();
		var pos = code.indexOf('+');
		var opt = 0;
		if(pos>=0) {
			opt = event.substr(pos+1);
			opt = yjd.key[opt];
			code = code.substr(0,pos);
		}
		code = yjd.key.codes[code] | opt;
	} else if(typeof event==='number'){
		code = event;
	} else {
		return false;
	}
	return code;
};

/**
 * Check Key.
 * @param {number|string|KeyboardEvent} code Code in yjd.key.code, string of it, or keyboard event.
 * 	Specify the logical OR of a constant like '' and the flag
 * 	Or Keyboard event when keydown, keypress or keyup is okey.
 * @param {number|number[]|string|string[]} keys Key code, name or list of those.  
 * @return {boolean} True if Key is one of keys.
 */
yjd.key.is = function(code, keys) {
	code = yjd.key.getCode(code);
	if(typeof keys!=='object') keys = [ keys ];
	for(var i=0; i<keys.length; i++) {
		var key = yjd.key.getCode(keys[i]);
		if(code==key) return true;
	}
	return false;
};

/**
 * Check range of the key.
 * @param {number|string|KeyboardEvent} code Code in yjd.key.code, string of it, or keyboard event.
 * 	Specify the logical OR of a constant like '' and the flag
 * @param {number|string} min Minimun key code or string of it.  
 * @param {number|string} max Maxinum key code or string of it.  
 * @return {boolean} True if Key is one of keys.
 */
yjd.key.rangeIs = function(code, min, max) {
	code = yjd.key.getCode(code);
	min = yjd.key.getCode(min);
	max = yjd.key.getCode(max);
	if(min<=code && code<=max) return true;
	return false;
};
