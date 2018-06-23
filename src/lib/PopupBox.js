/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Base class of popupbox.
 * @since  2018.03.17  initial coding.
 */

/**
 * @typedef PopupBox.Options
 * @property {string|element|jQuery} exp jQuery serector expression to that attached
 * @property {string} applyFunc jQuery function to attach.
 * @property {string} attach initial side of element to attach the popupbox. 'top', 'bottom', 'left', or 'right'.
 * @property {string} align: initial alignment of the popup. 
 * 	allows 'left', 'center', or 'right' for top or bottom attach, 
 * 	'top', 'middle', or 'bottom' for left or right attach. 
 * @property {number} delay delay in msec when open and close.
 * @property {number} headerHeight Height of the header of the view.
 * @property {number} footerHeight Height of the footer of the view.
 */
 /**
  * Abstruct base class of popup box.
  * To extend this, implement reder, bind, openBox, closeBox method.
  * Call enter and leave method to open and close at mouse event.
  * @param {PopupBox.Options} options Options
  */
var PopupBox = function(options) {
	this.options = $.extend({
		exp: null,
		applyFunc: 'append',
		attach: 'bottom',
		align: 'left',
		delay: 100,
		headerHeight: 0,
		footerHeight: 0,
	}, options);
	this.$elm = null;
	this.render();	//	implement this.
	$(this.options.exp)[this.options.applyFunc](this.$elm);
	this.bind();	//	implement this.
	this.$elm.hover(
		(event)=> {
			this.ppb.state = PopupBox.state.ENTERED;
		},
		(event)=> {
			this.ppb.state = PopupBox.state.TO_CLOSE;
			setTimeout(()=>{
				if(this.ppb.state==PopupBox.state.TO_CLOSE) this.close();
			}, this.options.delay);
		}
	);
	this.ppb = {};
	this.ppb.attach = this.options.attach;
	this.ppb.align = this.options.align;
	this.ppb.parent_elm = null;
	this.ppb.parent_elm = null;
	this.ppb.state = PopupBox.state.CLOSED;
	this.$elm.css({display: 'none', position: 'fixed'});
}
/**
 * State values of popup.
 */
PopupBox.state = {
	CLOSED: 	0,
	TO_OPEN:	1,
	OPENED:		2,
	ENTERED:	3,
	TO_CLOSE:	4,
};

/**
 * Close popup.
 */
PopupBox.prototype.close = function() {
	this.ppb.state = PopupBox.state.CLOSED;
	this.ppb.parent_elm = null;
	this.closeBox.apply(this, arguments);
	this.$elm.css({display:'none', top:'', left: ''});
};

/**
 * process to call when cursor enter the parent.
 * @param {MouseEvent} event event
 */
PopupBox.prototype.enter = function(event) {
	if(this.ppb.state>PopupBox.state.CLOSED) {
		if(this.ppb.parent_elm===event.currentTarget) {
			if(this.ppb.state==PopupBox.state.TO_CLOSE) this.ppb.state = PopupBox.state.OPENED;
			return;
		} else {
			this.close();
		}
	}
	this.ppb.state = PopupBox.state.TO_OPEN;
	this.ppb.parent_elm = event.currentTarget;
	var args = arguments
	setTimeout(()=> {
		if(this.ppb.state==PopupBox.state.TO_OPEN && this.ppb.parent_elm===event.currentTarget) {
			PopupBox.prototype.open.apply(this, args);
		}
	}, this.options.delay);
};

/**
 * process to call when cursor leave the parent.
 * @param {MouseEvent} event event
 */
PopupBox.prototype.leave = function(event) {
	if(this.ppb.state==PopupBox.state.CLOSED) return;
	this.ppb.state = PopupBox.state.TO_CLOSE;
	setTimeout(()=>{
		if(this.ppb.state==PopupBox.state.TO_CLOSE && this.ppb.parent_elm===event.currentTarget) {
			PopupBox.prototype.close.apply(this, arguments);
		}
	}, this.options.delay);
};

/**
 * Open popup.
 * @param {MouseEvent} event event 
 */
PopupBox.prototype.open = function(event) {
	if(this.ppb.state>=PopupBox.state.OPENED) this.close();
	this.ppb.state = PopupBox.state.OPENED;
	this.ppb.attach = this.options.attach;
	this.ppb.align = this.options.align;
	this.parent = event.currentTarget;
	//	call child.
	this.openBox.apply(this, arguments);
	//	display to get rect.
	this.$elm.css({display: ''});
	var obj_rect = this.parent.getBoundingClientRect();
	var this_rect = this.$elm[0].getBoundingClientRect();
	var win = this.windowSize();
	var attach = this.ppb.attach;
	//	this rect can be place each side of parent?
	var can_top = obj_rect.top - this_rect.height >= win.y;
	var can_bottom = obj_rect.bottom + this_rect.height <= win.h;
	var can_left = 	obj_rect.left - this_rect.width >= 0;
	var can_right = obj_rect.right + this_rect.width <= win.w;
	//	flip if not enough space 
	if(attach==='top' && !can_top && can_bottom) attach = 'bottom';
	if(attach==='bottom' && !can_bottom && can_top) attach = 'top';
	if(attach==='left' && !can_left && can_right) attach = 'right';
	if(attach==='right' && !can_right && can_left) attach = 'left';
	this.ppb.attach = attach;
	this.setPosition();
};

/**
 * Get window size.
 * @return {object} window size.
 */
PopupBox.prototype.windowSize = function() {
	return {
		x: 0,
		y: this.options.headerHeight,
		w: window.innerWidth,
		h: window.innerHeight - this.options.headerHeight - this.options.footerHeight,
	};
};

/**
 * Get popup original rect
 * @return {Rect} area of original place.
 */
PopupBox.prototype.getRect = function() {
	var rect = this.$elm[0].getBoundingClientRect();
	var leftval = parseFloat(this.$elm.css('left'));
	var topval = parseFloat(this.$elm.css('top'));
	return {
		top: rect.top - topval,
		bottom: rect.bottom - topval,
		left: rect.left - leftval,
		right: rect.right - leftval,
		width: rect.width,
		height: rect.height,
	}
}
/**
 * Set proper position of popup.
 */
PopupBox.prototype.setPosition = function() {
	var attach = this.ppb.attach;
	var align = this.ppb.align;
	var obj_rect = this.parent.getBoundingClientRect();
	var this_rect = this.getRect();
	//	correct align to proper attach
	if((attach==='top' || attach==='bottom') 
	&& (align!=='left' && align!=='right' && align!=='center') ) {
		align = 'center';
	}
	if((attach==='left' || attach==='right') 
	&& (align!=='top' && align!=='bottom' && align!=='middle') ) {
		align = 'middle';
	}
	//	calc attach side posision
	var left, top;
	if(attach==='top') top = obj_rect.top - this_rect.height;
	if(attach==='bottom') top = obj_rect.bottom;
	if(attach==='left') left = obj_rect.left - this_rect.width;
	if(attach==='right') left = obj_rect.right;
	//	calc align side position
	if(align==='left') left = obj_rect.left;
	if(align==='center') left = obj_rect.left + (obj_rect.width - this_rect.width)/2;
	if(align==='right') left = obj_rect.right - this_rect.width;
	if(align==='top') top = obj_rect.top;
	if(align==='middle') top = obj_rect.top + (obj_rect.height - this_rect.height)/2;
	if(align==='bottom') top = obj_rect.bottom - this_rect.height;
	//	to be inside of view.
	var win = this.windowSize();
	if(this_rect.height < win.h) {
		if(top + this_rect.height > win.h) top = win.h - this_rect.height;
		if(top<win.y) top = win.y;
	} else {
		top = win.y + (win.h - this_rect.height)/2;
	}
	if(this_rect.width < win.w) {
		if(left + this_rect.width > win.w) left = win.w - this_rect.width;
		if(left<0) left = 0;
	} else {
		left = 0 + (win.w - this_rect.width)/2;
	}
	//	set position.
	this.$elm.css({top:top, left:left});
};