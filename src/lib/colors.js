/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview read.cgi extention.
 * @since  2018.06.02  Copy from colornames.js and modified.
 */

yjd.colors = {};

/**
 * Convert color expression to color element array.
 * @param {string} str string.
 * @return {number[]} rgba array
 */
yjd.colors.str2rgba = function(str) {
	if(str==='transparent') return [255,255,255,0];
	for(var prop in this.Regex) {
		var test = this.Regex[prop];
		var matched = test.regx.exec(str);
		if( matched ) {
			return test.func(matched);
		}
	}
	if(str in yjd.colors.ColorInfo) {
		var rgba = this.ColorInfo[str].rgb.concat();
		rgba[3] = 1;
		return rgba;
	}
	return null;
};

/**
 * Convert color element array to color expression.
 * @param {number[]} rgba array
 * @return {string} str string.
 */
yjd.colors.rgba2str = function(rgba) {
	var str;
	if(rgba[3]==1) {
		str = '#';
		str += ('0'+rgba[0].toString(16)).substr(-2);
		str += ('0'+rgba[1].toString(16)).substr(-2);
		str += ('0'+rgba[2].toString(16)).substr(-2);
	} else {
		str = 'rgba('+rgba[0]+','+rgba[1]+','+rgba[2]+','+rgba[3]+')';
	}
	return str;
}

/**
 * Convert HSL to RGB
 * @param {number[]} hsl hsl array
 */
yjd.colors.hsl2rgb = function(hsl) {
	var h = hsl[1], s = hsl[1], l = hsl[2];
	var rc = (l<50)? l: 100 - l;
	var max = (l + rc * (s/100)) * 2.55;
	var min = (l - rc * (s/100)) * 2.55;
	var rgb = [];
	if(h < 60) {
		rgb[0] = max;
		rgb[1] = (h / 60) * (max - min) + min;
		rgb[2] = min;
	} else if(h < 120) {
		rgb[0] = ((120 - h) / 60) * (max - min) + min;
		rgb[1] = max;
		rgb[2] = min;
	} else if(h < 180) {
		rgb[0] = min;
		rgb[1] = max;
		rgb[2] = ((h - 120) / 60) * (max - min) + min;
	} else if(h < 240) {
		rgb[0] = min;
		rgb[1] = ((240 - h) / 60) * (max - min) + min;
		rgb[2] = max;
	} else if(h < 300) {
		rgb[0] = ((h - 240) / 60) * (max - min) + min;
		rgb[1] = min;
		rgb[2] = max;
	} else {
		rgb[0] = max;
		rgb[1] = min;
		rgb[2] = ((360 - h) / 60) * (max - min) + min;
	}
	rgb[0] = Math.round(rgb[0]);
	rgb[1] = Math.round(rgb[1]);
	rgb[2] = Math.round(rgb[2]);
	return rgb;
};

/**
 * Match pattern for color expression and convert function.
 */
yjd.colors.Regex = {
	color24: {
		regx: /^\s*(#[\da-fA-F]{6})/,
		func: function(matched) {
			var rgba = [];
				rgba[0] = Number('0x'+matched[1].substr(1,2));
				rgba[1] = Number('0x'+matched[1].substr(3,2));
				rgba[2] = Number('0x'+matched[1].substr(5,2));
				rgba[3] = 1;
				return rgba;
			}
	},
	color12: {
		regx: /^\s*(#[\da-fA-F]{3})/,
		func: function(matched) {
			var rgba = [];
			rgba[0] = Number('0x'+matched[1].substr(1,1)) * 255 / 15;
			rgba[1] = Number('0x'+matched[1].substr(2,1)) * 255 / 15;
			rgba[2] = Number('0x'+matched[1].substr(3,1)) * 255 / 15;
			rgba[3] = 1;
			return rgba;
		}
	},
	color_rgb: {
		regx: /^\s*rgb\s*\(([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/,
		func: function(matched) {
			var rgba = [];
			rgba[0] = Number(matched[1]);
			rgba[1] = Number(matched[2]);
			rgba[2] = Number(matched[3]);
			rgba[3] = 1;
			return rgba;
		}
	},
	color_rgba: {
		regx: /^\s*rgba\s*\(([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/,
		types: ['colordir'],
		func: function(matched) {
			var rgba = [];
			rgba[0] = Number(matched[1]);
			rgba[1] = Number(matched[2]);
			rgba[2] = Number(matched[3]);
			rgba[3] = Number(matched[4]);
			return rgba;
		}
	},
	color_hsl: {
		regx: /^\s*hsl\s*\(([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/,
		func: function(matched) {
			var hsl = [];
			hsl[0] = Number(matched[1]);
			hsl[1] = Number(matched[2]);
			hsl[2] = Number(matched[3]);
			var rgba = yjd.colors.hsl2rgb(hsl);
			rgba[3] = 1;
			return rgba;
		}
	},
	color_hsla: {
		regx: /^\s*hsl\s*\(([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/,
		types: ['colordir'],
		func: function(matched) {
			var hsl = [];
			hsl[0] = Number(matched[1]);
			hsl[1] = Number(matched[2]);
			hsl[2] = Number(matched[3]);
			var rgba = yjd.colors.hsl2rgb(hsl);
			rgba[3] = Number(matched[4]);
			return rgba;
		}
	},
};

/**
 * Embedded color names
 */
yjd.colors.ColorInfo = {
	white: {
		rgb: [255, 255, 255],
		name: ['white', '白']
	},
	whitesmoke: {
		rgb: [245, 245, 245],
		name: ['white smoke', '白い煙']
	},
	ghostwhite: {
		rgb: [248, 248, 255],
		name: ['ghost white', '幽霊の白']
	},
	aliceblue: {
		rgb: [240, 248, 255],
		name: ['alice blue', 'アリスの淡い青']
	},
	lavender: {
		rgb: [230, 230, 250],
		name: ['lavender', 'ラベンダー']
	},
	azure: {
		rgb: [240, 255, 255],
		name: ['azure', '空色']
	},
	lightcyan: {
		rgb: [224, 255, 255],
		name: ['light cyan', '明るい藍緑色']
	},
	mintcream: {
		rgb: [245, 255, 250],
		name: ['mint cream', 'ミントクリーム']
	},
	honeydew: {
		rgb: [240, 255, 240],
		name: ['honeydew', 'ハネデューメロン']
	},
	ivory: {
		rgb: [255, 255, 240],
		name: ['ivory', '象牙色']
	},
	beige: {
		rgb: [245, 245, 220],
		name: ['beige', 'ベージュ']
	},
	lightyellow: {
		rgb: [255, 255, 224],
		name: ['light yellow', '明るい黄']
	},
	lightgoldenrodyellow: {
		rgb: [250, 250, 210],
		name: ['light goldenrod yellow', '明るい泡立草の黄']
	},
	lemonchiffon: {
		rgb: [255, 250, 205],
		name: ['lemon chiffon', 'レモンシフォン']
	},
	floralwhite: {
		rgb: [255, 250, 240],
		name: ['floral white', '花の白']
	},
	oldlace: {
		rgb: [253, 245, 230],
		name: ['old lace', '古いレース']
	},
	cornsilk: {
		rgb: [255, 248, 220],
		name: ['corn silk', 'とうもろこしの毛']
	},
	papayawhip: {
		rgb: [255, 239, 213],
		name: ['papaya white', 'パパイヤ・ホイップ']
	},
	blanchedalmond: {
		rgb: [255, 235, 205],
		name: ['blanched almond', '湯通しアーモンド']
	},
	bisque: {
		rgb: [255, 228, 196],
		name: ['bisque', 'ビスク・スープ']
	},
	snow: {
		rgb: [255, 250, 250],
		name: ['snow', '雪']
	},
	linen: {
		rgb: [250, 240, 230],
		name: ['linen', '麻布']
	},
	antiquewhite: {
		rgb: [250, 235, 215],
		name: ['antique white', '古風な白']
	},
	seashell: {
		rgb: [255, 245, 238],
		name: ['seashell', '貝殻']
	},
	lavenderblush: {
		rgb: [255, 240, 245],
		name: ['lavender blush', 'ラベンダーのチーク']
	},
	mistyrose: {
		rgb: [255, 228, 225],
		name: ['misty rose', '微かなバラ']
	},
	gainsboro: {
		rgb: [220, 220, 220],
		name: ['gainsboro', 'ゲインズバラの灰色']
	},
	lightgray: {
		rgb: [211, 211, 211],
		name: ['light gray', '明るい灰色']
	},
	lightsteelblue: {
		rgb: [176, 196, 222],
		name: ['light steel blue', '明るい鋼の青']
	},
	lightblue: {
		rgb: [173, 216, 230],
		name: ['light blue', '明るい青']
	},
	lightskyblue: {
		rgb: [135, 206, 250],
		name: ['light sky blue', '明るい空の青']
	},
	powderblue: {
		rgb: [176, 224, 230],
		name: ['powder blue', '粉の青']
	},
	paleturquoise: {
		rgb: [175, 238, 238],
		name: ['pale turquoise', '淡いトルコ石']
	},
	skyblue: {
		rgb: [135, 206, 235],
		name: ['sky blue', '空の青']
	},
	mediumaquamarine: {
		rgb: [102, 205, 170],
		name: ['medium aqua marine', '中程のアクアマリン']
	},
	aquamarine: {
		rgb: [127, 255, 212],
		name: ['aqua marine', 'アクアマリン']
	},
	palegreen: {
		rgb: [152, 251, 152],
		name: ['pale green', '淡い緑']
	},
	lightgreen: {
		rgb: [144, 238, 144],
		name: ['light green', '明るい緑']
	},
	khaki: {
		rgb: [240, 230, 140],
		name: ['khaki', '枯草色']
	},
	palegoldenrod: {
		rgb: [238, 232, 170],
		name: ['pale goldenrod', '淡い泡立草']
	},
	moccasin: {
		rgb: [255, 228, 181],
		name: ['moccasin', '鹿皮靴']
	},
	navajowhite: {
		rgb: [255, 222, 173],
		name: ['navajo white', 'ナバホの旗']
	},
	peachpuff: {
		rgb: [255, 218, 185],
		name: ['peach puff', '桃色のパフ']
	},
	wheat: {
		rgb: [245, 222, 179],
		name: ['wheat', '小麦']
	},
	pink: {
		rgb: [255, 192, 203],
		name: ['pink', '桃色']
	},
	lightpink: {
		rgb: [255, 182, 193],
		name: ['light pink', '明るい桃色']
	},
	thistle: {
		rgb: [216, 191, 216],
		name: ['thistle', 'アザミ']
	},
	plum: {
		rgb: [221, 160, 221],
		name: ['plum', 'プラム']
	},
	silver: {
		rgb: [192, 192, 192],
		name: ['silver', '銀']
	},
	darkgray: {
		rgb: [169, 169, 169],
		name: ['dark gray', '暗い灰色']
	},
	lightslategray: {
		rgb: [119, 136, 153],
		name: ['light slate gray', '明るい雄勝石の灰色']
	},
	slategray: {
		rgb: [112, 128, 144],
		name: ['slate gray', '雄勝石の灰色']
	},
	slateblue: {
		rgb: [106, 90, 205],
		name: ['slate blue', '雄勝石の青']
	},
	steelblue: {
		rgb: [70, 130, 180],
		name: ['steel blue', '鋼の青']
	},
	mediumslateblue: {
		rgb: [123, 104, 238],
		name: ['medium slate blue', '中程の雄勝石の青']
	},
	royalblue: {
		rgb: [65, 105, 225],
		name: ['royal blue', '王家の青']
	},
	blue: {
		rgb: [0, 0, 255],
		name: ['blue', '青']
	},
	dodgerblue: {
		rgb: [30, 144, 255],
		name: ['dodger blue', 'ドジャースの青']
	},
	cornflowerblue: {
		rgb: [100, 149, 237],
		name: ['cornflower blue', '矢車菊の青']
	},
	deepskyblue: {
		rgb: [0, 191, 255],
		name: ['deep sky blue', '深い空の青']
	},
	cyan: {
		rgb: [0, 255, 255],
		name: ['cyan', '藍緑色']
	},
	aqua: {
		rgb: [0, 255, 255],
		name: ['aqua', '水色']
	},
	turquoise: {
		rgb: [64, 224, 208],
		name: ['turquoise', 'トルコ石']
	},
	mediumturquoise: {
		rgb: [72, 209, 204],
		name: ['medium turquoise', '中程のトルコ石']
	},
	darkturquoise: {
		rgb: [0, 206, 209],
		name: ['dark turquoise', '暗いトルコ石']
	},
	lightseagreen: {
		rgb: [32, 178, 170],
		name: ['light sea green', '明るい海の緑']
	},
	mediumspringgreen: {
		rgb: [0, 250, 154],
		name: ['medium spring green', '中程の春の緑']
	},
	springgreen: {
		rgb: [0, 255, 127],
		name: ['spring green', '春の緑']
	},
	lime: {
		rgb: [0, 255, 0],
		name: ['lime', 'ライム']
	},
	limegreen: {
		rgb: [50, 205, 50],
		name: ['lime green', 'ライムの緑']
	},
	yellowgreen: {
		rgb: [154, 205, 50],
		name: ['yellow green', '黄緑藻']
	},
	lawngreen: {
		rgb: [124, 252, 0],
		name: ['lawn green', '芝生の緑']
	},
	chartreuse: {
		rgb: [127, 255, 0],
		name: ['chartreuse', '薬草のリキュール']
	},
	greenyellow: {
		rgb: [173, 255, 47],
		name: ['green B32', '黄緑']
	},
	yellow: {
		rgb: [255, 255, 0],
		name: ['yellow', '黄']
	},
	gold: {
		rgb: [255, 215, 0],
		name: ['gold', '金']
	},
	orange: {
		rgb: [255, 165, 0],
		name: ['orange', '橙色']
	},
	darkorange: {
		rgb: [255, 140, 0],
		name: ['dark orange', '暗い橙色']
	},
	goldenrod: {
		rgb: [218, 165, 32],
		name: ['goldenrod', '泡立草']
	},
	burlywood: {
		rgb: [222, 184, 135],
		name: ['burly wood', '厚板']
	},
	tan: {
		rgb: [210, 180, 140],
		name: ['tan', '日焼け']
	},
	sandybrown: {
		rgb: [244, 164, 96],
		name: ['sandy brown', '砂茶色']
	},
	darksalmon: {
		rgb: [233, 150, 122],
		name: ['dark salmon', '暗いサーモン']
	},
	lightcoral: {
		rgb: [240, 128, 128],
		name: ['light coral', '明るい珊瑚']
	},
	salmon: {
		rgb: [250, 128, 114],
		name: ['salmon', 'サーモン']
	},
	lightsalmon: {
		rgb: [255, 160, 122],
		name: ['light salmon', '明るいサーモン']
	},
	coral: {
		rgb: [255, 127, 80],
		name: ['coral', '珊瑚']
	},
	tomato: {
		rgb: [255, 99, 71],
		name: ['tomato', 'トマト']
	},
	orangered: {
		rgb: [255, 69, 0],
		name: ['orange red', '赤橙']
	},
	red: {
		rgb: [255, 0, 0],
		name: ['red', '赤']
	},
	deeppink: {
		rgb: [255, 20, 147],
		name: ['deep pink', '深い桃色']
	},
	hotpink: {
		rgb: [255, 105, 180],
		name: ['hot pink', 'ホットピンク']
	},
	palevioletred: {
		rgb: [219, 112, 147],
		name: ['pale violetred', '淡い赤菫色']
	},
	violet: {
		rgb: [238, 130, 238],
		name: ['violet', '菫色']
	},
	orchid: {
		rgb: [218, 112, 214],
		name: ['orchid', '紫蘭']
	},
	magenta: {
		rgb: [255, 0, 255],
		name: ['magenta', '紅紫色']
	},
	fuchsia: {
		rgb: [255, 0, 255],
		name: ['fuchsia', 'フクシアの花']
	},
	mediumorchid: {
		rgb: [186, 85, 211],
		name: ['medium orchid', '中程の紫蘭']
	},
	darkorchid: {
		rgb: [153, 50, 204],
		name: ['dark orchid', '暗い紫蘭']
	},
	darkviolet: {
		rgb: [148, 0, 211],
		name: ['dark violet', '暗い菫色']
	},
	blueviolet: {
		rgb: [138, 43, 226],
		name: ['blue violet', '青菫色']
	},
	mediumpurple: {
		rgb: [147, 112, 219],
		name: ['medium purple', '中程の紫']
	},
	gray: {
		rgb: [128, 128, 128],
		name: ['gray', '灰色']
	},
	mediumblue: {
		rgb: [0, 0, 205],
		name: ['medium blue', '中程の青']
	},
	darkcyan: {
		rgb: [0, 139, 139],
		name: ['dark cyan', '暗い藍緑色']
	},
	cadetblue: {
		rgb: [95, 158, 160],
		name: ['cadet blue', '士官候補生の青']
	},
	darkseagreen: {
		rgb: [143, 188, 143],
		name: ['dark sea green', '暗い海の緑']
	},
	mediumseagreen: {
		rgb: [60, 179, 113],
		name: ['medium sea green', '中程の海の緑']
	},
	teal: {
		rgb: [0, 128, 128],
		name: ['teal', '小鴨の緑']
	},
	forestgreen: {
		rgb: [34, 139, 34],
		name: ['forest green', '森の緑']
	},
	seagreen: {
		rgb: [46, 139, 87],
		name: ['sea green', '海の緑']
	},
	darkkhaki: {
		rgb: [189, 183, 107],
		name: ['dark khaki', '暗い枯草色']
	},
	peru: {
		rgb: [205, 133, 63],
		name: ['peru', 'ペルーの土']
	},
	crimson: {
		rgb: [220, 20, 60],
		name: ['crimson', '真紅']
	},
	indianred: {
		rgb: [205, 92, 92],
		name: ['indian red', '赤立羽']
	},
	rosybrown: {
		rgb: [188, 143, 143],
		name: ['rosy brown', 'バラの茶色']
	},
	mediumvioletred: {
		rgb: [199, 21, 133],
		name: ['medium violet red', '中程の赤菫色']
	},
	dimgray: {
		rgb: [105, 105, 105],
		name: ['dim gray', '薄暗い灰色']
	},
	black: {
		rgb: [0, 0, 0],
		name: ['black', '黒']
	},
	midnightblue: {
		rgb: [25, 25, 112],
		name: ['midnight blue', '深夜の青']
	},
	darkslateblue: {
		rgb: [72, 61, 139],
		name: ['dark slate blue', '暗い雄勝石の青']
	},
	darkblue: {
		rgb: [0, 0, 139],
		name: ['dark blue', '暗い青']
	},
	navy: {
		rgb: [0, 0, 128],
		name: ['navy', '海軍の青']
	},
	darkslategray: {
		rgb: [47, 79, 79],
		name: ['dark slate gray', '暗い雄勝石の灰色']
	},
	green: {
		rgb: [0, 128, 0],
		name: ['green', '緑']
	},
	darkgreen: {
		rgb: [0, 100, 0],
		name: ['dark green', '暗い緑']
	},
	darkolivegreen: {
		rgb: [85, 107, 47],
		name: ['dark olive green', '暗いオリーブの緑']
	},
	olivedrab: {
		rgb: [107, 142, 35],
		name: ['olive drab', 'オリーブの葉']
	},
	olive: {
		rgb: [128, 128, 0],
		name: ['olive', 'オリーブ']
	},
	darkgoldenrod: {
		rgb: [184, 134, 11],
		name: ['dark goldenrod', '暗い泡立草']
	},
	chocolate: {
		rgb: [210, 105, 30],
		name: ['chocolate', 'ミルクチョコレート']
	},
	sienna: {
		rgb: [160, 82, 45],
		name: ['sienna', 'シエナの土']
	},
	saddlebrown: {
		rgb: [139, 69, 19],
		name: ['saddle brown', '鞍の茶色']
	},
	firebrick: {
		rgb: [178, 34, 34],
		name: ['fire brick', 'れんが色']
	},
	brown: {
		rgb: [165, 42, 42],
		name: ['brown', '茶色']
	},
	maroon: {
		rgb: [128, 0, 0],
		name: ['maroon', '栗色']
	},
	darkred: {
		rgb: [139, 0, 0],
		name: ['dark red', '暗い赤']
	},
	darkmagenta: {
		rgb: [139, 0, 139],
		name: ['dark magenta', '暗い紅紫色']
	},
	purple: {
		rgb: [128, 0, 128],
		name: ['purple', '紫']
	},
	indigo: {
		rgb: [75, 0, 130],
		name: ['indigo', '藍']
	}
};
