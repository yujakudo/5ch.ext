/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Class for scrolling step by the unit
 * @since  2018.04.29  initial coding
 */


/**
 * @typedef Rect
 * @desc rectangle area.
 * @property {number} top Top of rectangle in pixel.
 * @property {number} bottom Bottom of rectangle in pixel. exactry this is not in the are.
 * @property {number} left Left of rectangle in pixel.
 * @property {number} right Right of rectangle in pixel. exactry this is not in the are.
 * @property {number} width Width of rectangle in pixel. bottom - top.
 * @property {number} height Height of rectangle in pixel. right - left.
 */

/**
 * @typedef UnitScroll.Options
 * @property {number} headerHeight Height of header part of view in pixel.
 * @property {number} footerHeight Height of footer part of view in pixel.
 * @property {string} unitExp Selector expression for scroll unit.
 * @property {function} callback Function called when event. window resized only.
 * @property {*} this This value in the callback.
 * @property {string} applyFunc jQuery function to attach.
 * @property {boolean} animate Animate scroll if true.
 * @property {number} animeDuration animation duration in msec.
 * @property {number} boundDistance distance in that dounding occuers in pixel. 
 * @property {number} overScroll Scroll to over this pixel from unit element.
 * @property {number} overMargin Margin in pixel to show boundary.
 * @property {number} resizeDelay Delay from resizing to call callback.
 */
/**
 * Class for scrolling step by the unit
 * @param {string|Element|jQuery} exp jQuery selector expressin where to attach.
 * @param {UnitScroll.Options} options Options.
 */
var UnitScroll = function(exp, options) {
	this.options = $.extend({
		headerHeight: 0,
		footerHeight: 0,
		unitExp: '',
		callback: null,
		this: null,
		applyFunc: 'append',
		animate: true,
		animeDuration: 300,
		boundDistance: 40,
		overScroll: 4,
		overMargin: 12,
		resizeDelay: 250,
	}, options);
	this.$elm = $(
		'<div class="pnl_unitscroll">'
		+'<span class="scroll_top" data-title="'+__('Scroll to top')+'">'
		+'<span class="icon">&triangle;<span class="bar"></span></span></span>'
		+'<span class="scroll_bottom" data-title="'+__('Scroll to bottom')+'">'
		+'<span class="icon">&triangledown;<span class="bar"></span></span></span>'

		+'<span class="scroll_pageup" data-title="'+__('Scroll to upper hidden items')+'">'
		+'<span class="icon">&triangle;</span><span class="icon">&triangle;</span></span>'
		+'<span class="scroll_pagedown" data-title="'+__('Scroll to lower hidden items')+'">'
		+'<span class="icon">&triangledown;</span><span class="icon">&triangledown;</span></span>'
		
		+'<span class="scroll_up" data-title="'+__('Scroll to an upper item')+'">'
		+'<span class="icon">&triangle;</span></span>'
		+'<span class="scroll_down" data-title="'+__('Scroll to a lower item')+'">'
		+'<span class="icon">&triangledown;</span></span>'
		+'</div>'
	);
	this.bounding = null;
	this.resizing = {tid: null, elm: null};
	if(exp) $(exp)[this.options.applyFunc](this.$elm);
};

/**
 * Bind event handlers.
 */
UnitScroll.prototype.bind = function() {
	$('.scroll_up', this.$elm).click((event)=>{
		UnitScroll.prototype.upDown.call(this, -1);
	});
	$('.scroll_down', this.$elm).click((event)=>{
		UnitScroll.prototype.upDown.call(this, 1);
	});
	$('.scroll_pageup', this.$elm).click((event)=>{
		UnitScroll.prototype.pageUpDown.call(this, -1);
	});
	$('.scroll_pagedown', this.$elm).click((event)=>{
		UnitScroll.prototype.pageUpDown.call(this, 1);
	});
	$('.scroll_top', this.$elm).click((event)=>{
		UnitScroll.prototype.topBottom.call(this, -1);
	});
	$('.scroll_bottom', this.$elm).click((event)=>{
		UnitScroll.prototype.topBottom.call(this, 1);
	});
	//	Resize
	$(window).resize((event)=> {
		//	tries to keep unit position. but not work well when miximized. 
		if(!this.resizing.tid) {
			var map = this.makeMap();
			this.resizing.prev = (map.in.length)? map.in[0]: (map.down)? map.down: map.up;
		} else {
			clearTimeout(this.resizing.tid);
		}
		this.resizing.tid = setTimeout(()=> {
			this.resizing.tid = null;
			this.elm_list = this.getElmList(this.options.unitExp);
			var animate = this.options.animate;
			this.options.animate = false;
			if(this.resizing.prev && this.resizing.prev.elm) {
				this.toItem(this.resizing.prev.elm, -1);
			}
			this.options.animate = animate;
			if(this.options.callback) this.options.callback.call(this.options.this, 'resized');
		}, this.options.resizeDelay);
	});
};

/**
 * Set unit element selector and element list.
 * element list is needed to known correct order of elements when sorted in any order. 
 * @param {string} unitExp Selector expression for scroll unit.
 * @param {Element[]} [sortedList] Element list in specific order.
 * 	If omitted, creates a list.
 */
UnitScroll.prototype.unitExp = function(unitExp, sortedList) {
	if(unitExp===undefined) return this.options.unitExp;
	this.options.unitExp = unitExp;
	if(sortedList instanceof Array) {
		this.elm_list = sortedList;
	} else {
		this.elm_list = this.getElmList(unitExp);
	}
};

/**
 * Get or Set element list.
 * Making element list is costs, so user can manages by this method.
 * @param {Element[]} [sortedList] Element list in specific order.
 * @return {Element[]} current element list.
 */
UnitScroll.prototype.elmList = function(sortedList) {
	if(sortedList===undefined) return this.elm_list;
	this.elm_list = sortedList;
};

/**
 * Makes element list.
 * @param {string} exp Selector expression of element into list.  
 */
UnitScroll.prototype.getElmList = function(exp) {
	var list = [];
	$(exp).each(function(){
		list.push(this);
	});
	list.sort(function(a, b) {
		ay = a.getBoundingClientRect().top;
		by = b.getBoundingClientRect().top;
		if(ay==by) return 0;
		return (ay>by)? 1: -1;
	});
	return list;
};

/**
 * Get rectangle of element list or a part of the list.
 * @param {Element[]} elm_list Element list. 
 * @param {number} start Position of list to start at.
 * @param {number} end  Position of list to finish at. not included.
 * @param {boolen} b_margin add margin to the rectangle if true.
 * @return {Rect} Rectangle of the list.
 */
UnitScroll.prototype.getElmListRect = function(elm_list, start, end, b_margin) {
	//	Start and end position
	if(start===undefined || start===null) start = 0;
	if(end===undefined || end==null) end = elm_list.length;
	if(start<0) start = elm_list.length + start;
	if(start<0) start = 0;
	if(end<0) end = elm_list.length + end;
	if(end<=0) return;
	var first_rect = elm_list[start].getBoundingClientRect();
	var last_rect = elm_list[end-1].getBoundingClientRect();
	var margin = b_margin? this.options.overMargin: 0;
	var rect = {
		top: first_rect.top - margin,
		left: first_rect.left,
		bottom: last_rect.bottom + margin,
		right: last_rect.right,
	};
	rect.height = rect.bottom - rect.top;
	rect.width = rect.right - rect.left;
	return rect;
};

//	Not to use animating
/**
 * Scroll to items considering userbillity.
 * Use toRect instead of this when items are animating.
 * @param {string} expItems Selector expressin for items. 
 * @param {string|Element|jQuery} curExp jQuery selector expressin of current item.
 * @param {number} start index of elements to start at.
 * @param {number} end  index of elements to finish at. not included.
 */
UnitScroll.prototype.toItems = function(expItems, curExp, start, end) {
	if(expItems===undefined || expItems===null || expItems===false) {
		if(this.elm_list) expItems = this.elm_list;
		else expItems = this.options.unitExp;
	}
	var elm_list;
	if(expItems instanceof Array) {
		elm_list = expItems;
	} else {
		elm_list = this.getElmList(expItems);
	}
	if(elm_list.length==0) return;
	//	Get all elements rect.
	var rect = this.getElmListRect(elm_list, start, end);
	var cur_rect = null;
	if(curExp) cur_rect = $(curExp)[0].getBoundingClientRect();
	this.toRect(rect, cur_rect, true);
}

/**
 * Scroll to specified area considering userbillity.
 * @param {Rect} rect whole area
 * @param {Rect} cur_rect current items area. 
 * @param {boorean} b_view_pos Set true when the coordination system is the view. 
 */
UnitScroll.prototype.toRect = function(rect, cur_rect, b_view_pos) {
	//	to display at middle
	var win_height = this.windowHeight();
	var y = (rect.top + rect.bottom - win_height)/2;
	//	When the area can not be in the view
	if(rect.height===undefined) rect.height = rect.bottom - rect.top;
	if(win_height < rect.height) {
		if(cur_rect) {
			if(cur_rect.height===undefined) cur_rect.height = cur_rect.bottom - cur_rect.top;
			//	initialy, cur rect is centered
			y = cur_rect.top + (cur_rect.height - win_height)/2;
			//	cur rect is too large, so align it's top.
			if(cur_rect.height > win_height) y = cur_rect.top - this.options.overScroll;
			//	if it as space above or below rect, arign the side
			else if(rect.top > y) y = rect.top - this.options.overScroll;
			else if(rect.bottom < y + win_height) y = rect.bottom - win_height + this.options.overScroll;
		} else {
			y = rect.top;
		}
	}
	return this.toY(y, b_view_pos);
};

/**
 * Scroll to Y.
 * @param {number} y value of Y 
 * @param {boorean} b_view_pos Set true when the coordinate system is the view. 
 * @param {number} dir direction when bound occurs. -1, 0, 1.
 */
UnitScroll.prototype.toY = function(y, b_view_pos, dir) {
	if(b_view_pos) y += window.pageYOffset - this.options.headerHeight;
	if(y<0) y = 0;
	if(!this.options.animate) {
		$('html,body').scrollTop(y);
		return true;
	}
	var offset = y - (window.pageYOffset - this.options.headerHeight);
	if(!dir || Math.abs(offset)>this.options.boundDistance) {
		$('html,body').animate({scrollTop:y}, this.options.animeDuration);
		return true;
	}
	this.bound(dir, y);
	return true;
};

/**
 * Bounding animation.
 * @param {number} dir Scroll direction. -1:up, 1:down 
 * @param {number} Y value of y to scroll in absolute coordinate system
 */
UnitScroll.prototype.bound = function(dir, y) {
	if(!this.options.animate) {
		$('html,body').scrollTop(y);
		return true;
	}
	if(	this.bounding===null ) {
		if(y===null || y===undefined) y = window.pageYOffset;
		var obj_y = window.pageYOffset + this.options.boundDistance * dir;
		var time = this.options.animeDuration / 2;
		$('html,body').animate({scrollTop: obj_y}, time);
		this.bounding = y;
		setTimeout(()=>{
			$('html,body').animate({scrollTop: this.bounding}, time, 'swing');
			this.bounding = null;
		}, time);
	} else {
		if(y!==null && y!==undefined) this.bounding = y;
	}
};

/**
 * Event handler on up or down button.
 * @param {number} dir dirrection. -1:up, 1:down.
 */
UnitScroll.prototype.upDown = function(dir) {
	var map = this.makeMap();
	if(map.cover) {
		this.toItem(map.cover.elm, dir, false, dir);
		return;
	}
	var unit = (dir>0)? map.down: map.up;
	if(unit) {
		if(unit.rect.height <= this.windowHeight()
			|| (map.in.length==0 && (unit.check_res==1 || unit.check_res==-1))) {
			this.toItem(unit.elm, dir, false, dir);
		} else {
			this.toItem(unit.elm, -dir, false, dir);
		}
		return;
	}
	this.bound(dir);
};

/**
 * Event handler on page up or down button.
 * @param {number} dir dirrection. -1:up, 1:down.
 */
UnitScroll.prototype.pageUpDown = function(dir) {
	var map = this.makeMap();
	if(map.cover) {
		this.toItem(map.cover.elm, dir, false, dir);
		return;
	}
	var unit = (dir>0)? map.down: map.up;
	if(unit) {
		if(map.in.length || unit.check_res==2 || unit.check_res==-2) {
			this.toItem(unit.elm, -dir, true, dir);
		} else {
			this.toItem(unit.elm, dir, true, dir);
		}
		return;
	}
	this.bound(dir);
};

/**
 * Event handler on top or bottom button.
 * @param {number} dir dirrection. -1:top, 1:bottom.
 */
UnitScroll.prototype.topBottom = function(dir) {
	var elm = (dir>0)? this.elm_list[this.elm_list.length - 1]: this.elm_list[0];
	this.toItem(elm, dir, false, dir);
};

/**
 * Scroll to specified element.
 * @param {string|element} exp Element or selector expression of the elemnt.
 * @param {number} [align] to which align. -1:top, 0:center, 1:bottom.
 * @param {boolean} [b_bound_list] rimits in the element list area.
 * @param {boolean} [dir] direction when bounding. -1:up, 1:down 
 */
UnitScroll.prototype.toItem = function(exp, align, b_bound_list, dir) {
	var rect = $(exp)[0].getBoundingClientRect();
	var win_height = this.windowHeight();
	var y = (rect.top + rect.bottom - win_height)/2;
	if(align>0) {
		y = rect.bottom - win_height + this.options.overScroll;
	} else if(align<0) {
		y = rect.top - this.options.overScroll;
	}
	if(b_bound_list && this.elm_list) {
		var list_rect = this.getElmListRect(this.elm_list, null, null, true);
		if(y<list_rect.top) y = list_rect.top;
		if(y + win_height > list_rect.bottom) y = list_rect.bottom - win_height;
	}
	return this.toY(y, true, dir);
};

//	windowHeight, checkPos, checkRect - You need maintain integlity
//	and It's all view coordinate system

/**
 * Get view height.
 */
UnitScroll.prototype.windowHeight = function() {
	var win_height = window.innerHeight
		- this.options.headerHeight - this.options.footerHeight;
	if(win_height<1) win_height = 1;
	return win_height;
};

/**
 * Check Y is in the view.
 * @param {number} y value of Y.
 */
UnitScroll.prototype.checkPos = function(y) {
	var win_top = this.options.headerHeight;
	var win_bottom = window.innerHeight - this.options.footerHeight; 
	if(pos < win_top) return -1;
	if(pos >= win_bottom) return 1;
	return 0;
};

/**
 * Check the area is in the view.
 * @param {Object} rect rentangle area
 * @return {number|null} result
 * 	- null: the area covers the view.
 *  - -2: the area is above and over the view.
 * 	- -1: the area is above but a part in the view.
 * 	- 0: whole the area in the view.
 * 	- 1: the area is below but a part in the view.
 *  - 2: the area is below and over the view.
 */
UnitScroll.prototype.checkRect = function(rect) {
	var win_top = this.options.headerHeight;
	var win_bottom = window.innerHeight - this.options.footerHeight; 
	//	bottom is below one px of the area.
	if(rect.bottom <= win_top) return -2;
	if(rect.top >= win_bottom) return 2;
	if(rect.top < win_top && rect.bottom > win_bottom ) return null;
	if(rect.top < win_top) return -1;
	if(rect.bottom > win_bottom ) return 1;
	return 0;
};

/**
 * @typedef UnitScroll.Map.Unit
 * @desc element information around the view.
 * @property {Element} elm Element.
 * @property {Rect} rect Area of the element.
 * @property {number} check_res whether the area is in the view.
 * 	return value of @see UnitScroll.prototype.checkRect .
 */
/**
 * @typedef UnitScroll.Map
 * @desc Information around the view.
 * @property {UnitScroll.Map.Unit} cover elemnt that covers the view.
 * @property {UnitScroll.Map.Unit} up upper hidden element. whole or a part.
 * @property {UnitScroll.Map.Unit[]} in elements conpletery in the view.
 * @property {UnitScroll.Map.Unit} down lower hidden element. whole or a part.
 */
/**
 * Get elements map around the view.
 * @return {UnitScroll.Map} map.
 */
UnitScroll.prototype.makeMap = function() {
	var map = {up: null, down: null, in:[], cover: null};
	var first = 0;
	var end = this.elm_list.length;
	var unit, pos;
	while(1) {	//	Get item that top edge is in the view
		pos = Math.floor((first+end)/2);
		unit = getElm.call(this, pos);
		if(unit.check_res!=-2 && unit.check_res!=2) break;	//	the rect is not out of then view.
		if(first==pos) {	//	end of searching.
			storeInMap.call(this, unit);
			return map;
		}
		if(unit.check_res>0) end = pos;
		else first = pos;
	}
	storeInMap.call(this, unit);
	//	return if the rect covers the view.
	if(unit.check_res===null) {
		return map;
	}
	var found_pos = pos;
	while(--pos>=0 && map.up===null) {
		unit = getElm.call(this, pos);
		storeInMap.call(this, unit);
	}
	pos = found_pos;
	while(++pos<this.elm_list.length && map.down===null) {
		unit = getElm.call(this, pos);
		storeInMap.call(this, unit);
	}
	return map;
	//
	/**
	 * Get unit element information.
	 * @param {number} pos Index of the element list.
	 * @return {UnitScroll.Map.Unit} unit information.
	 */
	function getElm(pos) {
		if(pos<0 || pos>=this.elm_list.length) return null;
		var obj = {};
		obj.elm = this.elm_list[pos];
		obj.rect = obj.elm.getBoundingClientRect();
		obj.check_res = this.checkRect(obj.rect);
		return obj;
	}
	/**
	 * Store unit information in the map as it check result.
	 * @param {UnitScroll.Map.Unit} obj unit information
	 */
	function storeInMap(obj) {
		if(obj.check_res===null) map.cover = obj;
		else if(obj.check_res==0) map.in.push(obj);
		else if(obj.check_res<0) map.up = obj;
		else map.down = obj;
	}
};
