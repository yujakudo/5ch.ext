/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Switch widget.
 * @since  2018.04.28  initial coding.
 */

/**
 * @typedef Switch.Options.value
 * @desc information of value of switch
 * @property {*} value value
 * @property {string} [label] Label for the value
 * @property {string|number[]} [fog] Color to show the turn.
 * 	Set an expresstion with alph like 'rgba(255,255,255,0.5)', '#ffffff 0.5', or [255,255,255,0.5].
 */
/**
 * @typedef Switch.Option
 * @property {string|Element|jQuery} exp Selector expression where to attach.
 * @property {string} applyFunc jQuery function to attach.
 * @property {*} default default value.
 * @property {boolean} enable : true,
 * @property {} type: 'switch',
 * @property {} label: null,
 * @property {} values: [
 * @property {} animate: true,
 * @property {} animationDuration: 100,
 * @property {} callback: null,
 * @property {} argument: null,
 * @property {} this: null,
 */
/**
 * Class of switch widget.
 * @constructor
 * @param {Switch.Options} options
 */
var Switch = function(options) {
	this.options = $.extend({
		exp: null,
		default: false,
		enable: true,
		type: 'switch',
		label: null,
		values: [
			{	label: '', value: true, fog: [255,255,255,0.5]	},
		],
		animate: true,
		animationDuration: 100,
		callback: null,
		argument: null,
		this: null,
		applyFunc: 'append',
	}, options);
	this.str = {};
	this.value_idx = 0;
	this.status = 0;
	this.b_enabled = true;
	this.correctValues().render().bind();
	this.val(this.options.default, false, true);
	this.enable(this.options.enable);
};

/**
 * Correct values in the options.
 */
Switch.prototype.correctValues = function() {
	var vals = this.options.values;
	switch(this.options.type) {
		case 'switch':
		if(vals.length<1) vals.push({});
		if(!('value' in vals[0])) vals[0].value = true;
		if(!('label' in vals[0])) vals[0].label = '';
		if(vals.length<2) vals.push({});
		if(!('value' in vals[1])) vals[1].value = false;
		if(!('label' in vals[1])) vals[1].label = '';
		if(!('fog' in vals[0]) && !('fog' in vals[1])) {
			vals[0].fog = '#fff 0.5';			
		}
		break;

		case 'rotary':
		this.display = '<div class="pnl_display_member">';
		for(var i=0; i<vals.length; i++) {
			if(!('value' in vals[i])) vals[i].value = i;
			if(!('label' in vals[i])) vals[i].label = i.toString();
			this.display += '<div>'+vals[i].label+'</div>';
		}
		this.display += '<div>'+vals[0].label+'</div></div>';
		break;
	}
	for(var i=0; i<vals.length; i++) {
		if('fog' in vals[i]) vals[i].fog = this.fog2rgba(vals[i].fog);
	}
	return this;
};

/**
 * Fog expression to 'rgba' color string.
 * @param {string|number[]} fog Expression of fog.
 * 	 like 'rgba(255,255,255,0.5)', '#ffffff 0.5', or [255,255,255,0.5].
 * @return {string} string like 'rgba(255,255,255,0.5)'
 */
Switch.prototype.fog2rgba = function(fog) {
	if(fog instanceof Array) {
		for(var i=fog.length; i<4; i++) {
			fog[i] = (i==3)? 0.5: 0;
		}
	} else if(typeof fog==='string') {
		if(fog==='') fog = '#fff 0.5';
		var strs = fog.split(' ');
		fog = yjd.colors.str2rgba(strs[0]);
		if(strs.length>=2) fog[3] = Number(strs[1]);
	} else {
		fog = [255,255,255,0.5];
	}
	return 'rgba('+fog[0]+','+fog[1]+','+fog[2]+','+fog[3]+')';
};

/**
 * Render the widget
 */
Switch.prototype.render = function() {
	var label = this.options.label;
	var vals = this.options.values;
	switch(this.options.type) {
		case 'switch':
		this.$elm = $(
			'<div class="pnl_switch pnl_switch_switch">'
			+((label===null)? '': '<div class="pnl_switch_label">'+label+'</div>')
			+'<label class="pnl_switch_main">'
			+'<div>'+vals[0].label+'</div>'
			+'<div class="pnl_slide"><div class="pnl_button"></div>'
			+'</div>'
			+'<div>'+vals[1].label+'</div>'
			+'</label></div>'
		);	
		var btn_trans = (this.options.animate)?
			'transform '+this.options.animationDuration+'ms linear': 'initial';
		$('.pnl_button', this.$elm).css('transition', btn_trans);
		break;

		case 'rotary':
		this.$elm = $(
			'<div class="pnl_switch pnl_switch_rotary">'
			+'<label class="pnl_switch_main">'
			+'<div>'+((label===null)? '&nbsp;': label)+'</div>'
			+'<div class="pnl_rotary"><div class="pnl_rotary_bar"></div>'
			+'</div>'
			+'<div class="pnl_display">'+this.display+'</div>'
			+'</label></div>'
		);	
		this.str.bar_trans = (this.options.animate)?
			'transfrom '+this.options.animationDuration+'ms linear': 'initial';
		this.str.disp_trans = (this.options.animate)?
			'transfrom '+this.options.animationDuration+'ms linear': 'initial';
		break;
	}
	$(this.options.exp)[this.options.applyFunc](this.$elm);
	return this;
};

/**
 * Bind handlers.
 */
Switch.prototype.bind = function() {
	$('label', this.$elm).click((event)=>{
		if(!this.b_enabled) return;
		Switch.prototype.onClick.call(this, event);
	});
	$('label', this.$elm).bind('contextmenu', (event)=> {
		if(!this.b_enabled) return;
		Switch.prototype.onClick.call(this, event);
        return false;
    });	
	return this;
};

/**
 * Handler of click.
 * Changes value and calls callback.
 * @param {MouseEvent} event 
 */
Switch.prototype.onClick = function(event) {
	if(this.status) return;
	var i = (this.value_idx + 1) % this.options.values.length;
	if(event.shiftKey || event.button==2) {
		i = (this.value_idx - 1 + this.options.values.length) % this.options.values.length;
	}
	var value = this.val(i, true);
	if(!this.options.callback) return;
	this.options.callback.call(this.options.this, value, this.options.argument);
};

/**
 * Set and get values.
 * Retuens current value when arguments are omitted.
 * Otherwise set.
 * @param {*} [value] value to set
 * @param {*} [b_index] argument value is index.
 * @param {*} [b_init] flag when init.
 * @return {*} current value when arguments are omitted.
 */
Switch.prototype.val = function(value, b_index, b_init) {
	var vals = this.options.values;
	if(value===undefined) {
		return vals[this.value_idx].value;
	}
	//	get index.
	var prev_idx = this.value_idx;
	var i;
	if(b_index) {
		i = this.value_idx = value;
	} else {
		for(i=0; i<vals.length; i++) {
			if(value===vals[i].value
				|| (typeof vals[i].value==='number' && value==vals[i].value)) {
				this.value_idx = i;
				break;
			}
		}
		if(i==vals.length) return;
	}
	if(!b_init && i==prev_idx) return;
	value = vals[i].value;	//	correct type.
	//	How to look
	switch(this.options.type) {
		case 'switch':
		$('.pnl_button', this.$elm).css('transform', 'translate('+(i? 0: '-1.1em')+', 0)');
		if(!b_init && this.options.animate) {
			setTimeout(()=> {
				addFog.call(this);
			}, this.options.animationDuration);
		} else {
			addFog.call(this);
		}
		break;

		case 'rotary':
		var disp_h = $('.pnl_display_member>div:first', this.$elm)[0].offsetHeight;
		var deg = (360 / vals.length) * i;
		var top = -disp_h * i - 2;
		var init_deg = (360 / vals.length) * prev_idx;
		var init_top = -disp_h * prev_idx;
		if(i==0 && prev_idx==vals.length-1) {
			top = -disp_h * vals.length;
			init_deg = -(360 / vals.length);
		}
		if(i==vals.length-1 && prev_idx==0) {
			init_deg = 360;
			init_top = -disp_h * vals.length;
		}
		if(!b_init && this.options.animate) {
			$('.pnl_rotary_bar', this.$elm).css('transition-duration', '0s');
			$('.pnl_display_member', this.$elm).css('transition-duration', '0s');
			$('.pnl_rotary_bar', this.$elm).css('transform', ' rotate('+init_deg+'deg)');
			$('.pnl_display_member', this.$elm).css('transform', 'translate(0,'+init_top+'px)');
			//	Need timeout because not to anticlockwise rotation.
			setTimeout(()=> {
				rotate.call(this);
			}, 0);
		} else {
			$('.pnl_rotary_bar', this.$elm).css('transform', ' rotate('+deg+'deg)');
			$('.pnl_display_member', this.$elm).css('transform', 'translate(0,'+top+'px)');
		}
		break;
	}
	return value;
	//
	/**
	 * Add fog to the switch.
	 */
	function addFog() {
		var i = this.value_idx;
		var vals = this.options.values;
		var strfog = ('fog' in vals[i])?
				'-webkit-linear-gradient( top, '+vals[i].fog+' -1000%, '+vals[i].fog+' 100% )':
				'none';
		$('.pnl_slide', this.$elm).css('background-image', strfog);
	}
	/**
	 * Rotate switch.
	 */
	function rotate() {
		var duration = ''+this.options.animationDuration+'ms';
		$('.pnl_rotary_bar', this.$elm).css('transition-duration', duration);
		$('.pnl_display_member', this.$elm).css('transition-duration', duration);
		$('.pnl_rotary_bar', this.$elm).css('transform', ' rotate('+deg+'deg)');
		$('.pnl_display_member', this.$elm).css('transform', 'translate(0,'+top+'px)');
	}
};

/**
 * Enable or disable.
 * @param {boolean} b_enable Set true when enables. 
 */
Switch.prototype.enable = function(b_enable) {
	if(b_enable) {
		this.$elm.removeClass('disabled');
	} else {
		this.$elm.addClass('disabled');
	}
	this.b_enabled = b_enable;
};
