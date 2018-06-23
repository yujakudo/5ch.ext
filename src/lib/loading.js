/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview loading mark
 * @since  2018.06.16 Apply to jQuery.
 */

/**
 * @typedef yjd.Loading.Mark
 * @desc options for a mark.
 * @property {Object} [style] CSS lastly overwritten.
 * @property {Object} [animation] Parameters for animation.
 * @property {number} [animation.duration] Period of rotation in millisecond.
 * @property {string} [animation.timing] Type of animation speed chainging.
 * 	'liner'(default), 'step', 'ease', 'ease-in-out', 'ease-in', 'ease-out', and 'cubic-bezier(n, n, n, n)' are available.
 * @property {string} [animation.direction] Direction of rotation.
 * 	'normal'(default), 'reverse', 'alternate', and 'alternate-reverse' are available.
 * @property {Object} [dot] Parameters for dots.
 * @property {number} [dot.num] Number of dots. default is 12.
 * @property {number|string} [dot.width] Width of a dot in ratio or string for length. default is .14(14%). 
 * @property {number|string} [dot.hright] Height of a dot in ratio or string for length. default is .14(14%). 
 * @property {number} [dot.radius] Round corner radius in ratio.
 * 	Not be round when 0. To be semicircle when 1. But, exactry not to be semicircle because of CSS.
 * @property {string|string[]|Object} [color] Color.
 * 	If An array or object is set, it becomes gradation. object keys are like '0%' or '100%' in string.
 * @property {number|number[]|Object} [opacity] Opacity.
 * 	If An array or object is set, it becomes gradation. object keys are like '0%' or '100%' in string.
 * @property {number|number[]|Object} [scale] Scalse of dots in ratio.
 * 	If An array or object is set, it becomes gradation. object keys are like '0%' or '100%' in string.
 * @property {number} [dot.rotate] Position of the first dot in degree.
 * 	-90 means upward and 0 means rightward.
 * @property {number} [dot.scaleAlign] Ratio for alignment when scale is gradation.
 * 	Dots are aligned outer when 1, and aligned inner when 0.
 * @property {Object} [dot.style] CSS lastly overwritten for a dot.
 */
/**
 * @typedef yjd.Loading.Options
 * @desc Options for Loading.
 * @property {string} [function] Name of function to locate wedget in window.
 * 	 'append'(default), 'prepend', 'before', and 'after' are available
 * @property {string} [size] Width and height of wedget in CSS length value.
 * @property {string} [visible] Name of mark showed when placed.
 * @property {Object} [style] CSS for container lastly overwritten.
 * @property {string} [showDefault] Name of mark for default value of @see yjd.wdg.Loading.prototype.show method.
 * @property {Object} [marks] Options for marks. User can add any marks.
 * 	It's keys are Name of mark and values are an object in @see yjd.Loading.Mark .
 * @property {yjd.Loading.Mark} [marks.default] Default option values for marks.
 * @property {yjd.Loading.Mark} [marks.loading] Loading mark.
 * @property {yjd.Loading.Mark} [marks.ok] OK mark.
 * @property {yjd.Loading.Mark} [marks.ng] NG mark.
 */

/**
 * Class for loading mark.
 * @param {function|string|object|number} exp Translatable value to @see yjd.atm object
 * @param {yjd.Loading.options} options
 */
 yjd.Loading = function(exp, options) {
	if(!(this instanceof yjd.Loading)) return new yjd.Loading(exp, options);
	if(!yjd.Loading.b_style) {
		$('head').append('<style>'
			+ '@keyframes yjd-loading-frames {'
			+ '0% { transform:rotate(0deg) }'
			+ '100% { transform:rotate(360deg) }'
		+'}</style>');
		yjd.Loading.b_style = true;
	}
	this.options = Storage.overWrite({
		function: 'append',
		size: '1em',
		visible: 'loading',
		style: {
			display: 'inline-block',
			position: 'relative',
			'box-sizing': 'border-box',	
			overflow: 'visible',
		},
		showDefault: 'loading',
		marks: {
			default: {
				fontSize: 1,				
				style: {
					display: 'block',
					position: 'absolute',
					overflow: 'visible',
					margin: 'auto',
					'text-align': 'center',
					'box-sizing': 'border-box',	
					'line-height': '100%',
				},
				animation: {
					duration: 2000,
					timing: 'linear',
					direction: 'normal',
				},
				dot: {
					num: 12,
					width: .14,
					height: .14,
					radius: 1,
					color: 'black',
					opacity: [1, 0],
					scale: 1,
					rotate: -90,
					scaleAlign: 0.75,
					style: {
						position: 'absolute',
						margin: 'auto',
					},
				},
			},
			loading: {
				animation: {},
				dot: {},
			},
			ok: {
				text: '&check;',
				style: {
					color: 'green',
				},
			},
			ng: {
				text: '&cross;',
				style: {
					color: 'red',
				},
			},
		},
	}, options);
	//	make the element
	this.$elm = $('<div class="yjd-wdg-loading"></div>');
	$(exp)[this.options.function](this.$elm);
	this.render();
	this.show(this.options.visible);
};

/**
 * Flag whther animation '@keyframes' is set in stylesheet.
 */
yjd.Loading.b_style = false;

/**
 * Show mark.
 * @public
 * @param {string|string[]|false} s_mark Name of mark or an array to show. Or all are hidden when false.
 */
yjd.Loading.prototype.show = function(s_mark) {
	if(s_mark===undefined) s_mark = this.options.showDefault;
	var prop;
	for(prop in this.options.marks) {
		if(prop==='default') continue;
		$('.yjd-loading-'+prop, this.$elm).css('visibility', 'hidden');
	}
	if(!s_mark) return;
	if(!(s_mark instanceof Array)) s_mark = [s_mark];
	for(var i=0; i<s_mark.length; i++) {
		$('.yjd-loading-'+s_mark[i], this.$elm).css('visibility', 'visible');
	}
};

/**
 * Hide all marks.
 * @public
 */
yjd.Loading.prototype.hide = function() {
	this.show(false);
};

/**
 * Render
 * this called from yjd.wdg (constructor of parent class)
 * @protected
 */
yjd.Loading.prototype.render = function() {
	//	make canvas
	var canvas = $('<canvas></canvas>');
	canvas.css({width:'100px', height:'2px'});
	this.ctx = canvas[0].getContext('2d');
	//	container style
	var s_size = (typeof this.options.size==='number')? 
				''+this.options.size+'rem': this.options.size;
	var containerStyle = $.extend({
		width: s_size,
		height: s_size,
	}, this.options.style);
	this.$elm.css(containerStyle);
	//	rener marks
	for(var name in this.options.marks) {
		if(name==='default') continue;
		var opt = this.options.marks[name];
		this.renderMark(name, opt);
	}
	this.ctx = undefined;
};

/**
 * Render a mark.
 * @protected
 * @param {string} name of the mark.
 * @param {yjd.Loading.Mark} opt Options for the mark.
 */
yjd.Loading.prototype.renderMark = function(name, opt) {
	if(!opt) return;
	//	mark style
	var markStyle = $.extend({}, this.options.marks.default.style);
	var dotNum = this.options.marks.default.dot.num;
	if(opt.hasOwnProperty('dot')) {
		if(opt.dot.hasOwnProperty('num')) dotNum = opt.dot.num;
		markStyle = $.extend(markStyle, {
			width: '100%',
			height: '100%',
		});
	}
	//	animation styles
	if(opt.hasOwnProperty('animation')) {
		var optAnim = $.extend({}, this.options.marks.default.animation, opt.animation);
		markStyle = $.extend(markStyle, {
			animation: 'yjd-loading-frames infinite',
			'animation-duration': (typeof optAnim.duration=='number')? 
					''+optAnim.duration+'ms': optAnim.duration,
			'animation-timing-function': (optAnim.timing==='step')?
					'steps('+dotNum+', start)': optAnim.timing,
			'animation-direction': optAnim.direction,
		});
	}
	var $mark = $('<div class="yjd-loading-'+name+'"></div>');
	this.$elm.append($mark);
	//	text
	if(opt.hasOwnProperty('text')) {
		$mark.html(opt.text);
		var fontSize = opt.hasOwnProperty('fontSize')?
				opt.fontSize: this.options.marks.default.fontSize;
		fontSize = this.percent2num(fontSize) * this.$elm[0].clientHeight;
		fontSize = ''+fontSize+'px';
		markStyle = $.extend(markStyle, {
			width: fontSize,
			height: fontSize,
			'font-size': fontSize,
		});
	}
	//	set styles
	if(opt.hasOwnProperty('style')) markStyle = $.extend(markStyle, opt.style);
	$mark.css(markStyle);
	//	return if dots does not exist
	if(!opt.hasOwnProperty('dot')) return;
	// dots options
	var dotOpt = $.extend({}, this.options.marks.default.dot, opt.dot);
	//	drow gradations.
	this.drawGradation(dotOpt.color, 0);
	this.drawGradation(dotOpt.opacity, 1);
	this.drawGradation(dotOpt.scale, 2);
	//	dot style
	var dotWidth = getLength(dotOpt.width);
	var dotHeight = getLength(dotOpt.height);
	var rx, ry;
	rx = ry = 50 * this.percent2num(dotOpt.radius);
	var ratio = dotWidth.num / dotHeight.num;
	if(ratio>1) rx /= ratio;
	else ry /= ratio;
	var s_radius = ''+(rx)+'% / '+(ry)+'%'
	//	make dots
	var contWidth = ''+$mark[0].clientWidth+'px';
	for(var i=0; i<dotNum; i++) {
		var dot = $('<div class="yjd-wdg-loading-dot"></div>');
		$mark.append(dot);
		var ratio = i/dotNum;
		var rotate = dotOpt.rotate + 360*(1-ratio);
		var scale = this.getGradation(ratio, 2);
		var width = getLength(dotWidth, scale);
		var height = getLength(dotHeight, scale);
		var align = this.percent2num(dotOpt.scaleAlign);
		align = 50 * align + (100/scale - 50)*(1 - align);
		var s_sift = ''+($mark[0].clientWidth/2)+'px - '+align+'%';
		var s_isift = ' - '+($mark[0].clientWidth/2)+'px + '+align+'%';
		var styles = {
			'border-radius': s_radius,
			left: 'calc(50% - '+width.str+' / 2)',
			top: 'calc(50% - '+height.str+' / 2)',
			width: width.str,
			height: height.str,
			'background-color':	this.getGradation(ratio, 0),
			opacity:			this.getGradation(ratio, 1),
			transform:			'translate(calc('+s_sift+'), 0)'
								+' rotate('+rotate+'deg)',
			'transform-origin':	'calc(50%'+s_isift+') 50%',
		};
		dot.css(styles).css(dotOpt.style);
	}
	//
	function getLength(val, scale) {
		if(scale===undefined) scale = 1;
		var obj = {};
		if(typeof val==='number') {
			obj.num = val * 100;
			obj.unit = '%';
		} else if(typeof val==='string'){
			val = val.trim();
			obj.num = val.substr(0, val.length-1);
			obj.unit = val.substr(-1);
		} else {	//	object
			obj = $.extend(obj, val);
		}
		obj.num *= scale;
		obj.str = ''+obj.num+obj.unit;
		return obj;
	}
};


/**
 * Draw gradation in canvas.
 * @protected
 * @param {Object|number[]} list An object or an array representing gradation.
 * @param {number} y Index. 0 means color. >0 means ratio.
 */
yjd.Loading.prototype.drawGradation = function(list, y) {
	if(typeof list!=='object') list = [ list, list ];
	var o_list = {};
	var idx;
	if(list instanceof Array) {
		for(var i=0; i<list.length; i++) {
			idx = i/(list.length - 1);
			o_list[idx.toString()] = list[i];
		}
	} else {
		o_list = list;
	}
	var grad  = this.ctx.createLinearGradient(1,0,99,0);
	for(idx in o_list) {
		var color = o_list[idx];
		if(y) {
			color = Math.round(color*255);
			color = 'rgb('+color+',0,0)';
		}
		grad.addColorStop(Number(idx), color);
	}
	this.ctx.fillStyle = grad;
	this.ctx.fillRect(0,y,100,1);
};

/**
 * Get gradation value from canvas.
 * @protected
 * @param {number} ratio ratio to translate position in canvas.
 * @param {number} y Index. 0 means color. >0 means ratio.
 */
yjd.Loading.prototype.getGradation = function(ratio, y) {
	ratio = this.percent2num(ratio);
	var x = ratio * 100;
	var px = this.ctx.getImageData(x, y, 1, 1).data;
	if(y) return px[0]/255;
	px[3] /= 255;
	return 'rgba('+px.join(',')+')';
};

/**
 * Get ratio value convertiong '%' added string.
 * @protected
 * @param {number|string} ratio value of ratio.
 * @return {number} ratio in number.
 */
yjd.Loading.prototype.percent2num = function(ratio) {
	if(typeof ratio==='string') {
		ratio = ration.trim();
		if(ratio.substr(-1)==='%') {
			ratio = Number(ratio.substr(0,ratio.length-1))/100;
		} else {
			ratio = Number(ratio);
		}
	}
	return ratio;
};