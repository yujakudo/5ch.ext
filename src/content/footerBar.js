/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Footer bar objet.
 * @since  2018.05.21  initial coding.
 */

/**
 * Create footer bar object.
 * @return {Navbar} the footer bar object.
 */
function createFooterBar(exp, pageInfo) {
	var pid = pageInfo.id;
	var settings = storage.get('settings.footerCtrl');
	/**
	 * Structure of the bar.
	 * @type {Navbar.Structure}
	 */
	var navStruct = [
		{
			'bookmark-signal': {},
			'footer-links': {
				'to-boards': {
					enable: (pid!=Page.BOARDS),
					icon: '&Colon;', desc: __('List of boards'),
					func: function(event) {
						savePageInfo();
						jumpTo('https://menu.5ch.net/bbstable.html', false, event);
					},
					key: settings.key.toBoards,
				},
				'to-threads': {
					enable: (pid==Page.READCGI),
					icon: '&apid;', desc: __('List of threads'),
					func: function(event) {
						savePageInfo();
						jumpTo(pageInfo.threadsUrl, false, event);
					},
					key: settings.key.toThreads,
				},
			},
			'footer-updates': {
				'nav-update-all': {
					enable: (pid==Page.READCGI),
					icon: '&xhArr;', desc: __('All posts'),
					href: ('theUrl' in pageInfo)? pageInfo.theUrl: '',
					key: settings.key.updateAll,
				},
				'nav-update': {
					enable: true,
					icon: '&orarr;', desc: __('Update'),
					func: function(event) {
						pageInfo.scroll_pos = window.pageYOffset;
						savePageInfo();
						var url = pageInfo.protocol + pageInfo.host + pageInfo.path;
						window.location.href = url;
						event.preventDefault();
					},
					key: settings.key.update,
				},
				'nav-update-last': {
					enable: (pid==Page.READCGI),
					icon: '&RightTeeVector;', desc: __('Update from last'),
					func: function(event) {
						var url = pageInfo.theUrl + pageInfo.max_postid + '-n';
						jumpTo(url, false, event);
					},
					href: ('theUrl' in pageInfo)? +'': '',
					key: settings.key.updateLast,
				},
				'nav-update-bookmark': {
					enable: (pid==Page.READCGI),
					icon: '&gtrarr;', desc: __('Update from the bookmark'),
					func: function(event) {
						if(pageInfo.bookmark) {
							var url = pageInfo.theUrl + pageInfo.bookmark + '-n';
							jumpTo(url, false, event);
						}
					},
					key: settings.key.updateBookmark,
				},
			},
		}, {
			'footer-text': {},
		}, {
			'footer-tools': {
				'tool-box': {
					enable: (pid!=Page.BOARDS),
					icon: '&xoplus;', desc: __('Settings'),
				},
			},
			'footer-scrolls': {
				'nav-to-bookmark': {
					enable: (pid==Page.READCGI),
					icon: '&range;', desc: __('Scroll to the bookmark'),
					func: function(event) {
						footerBar.unitScroll.toItems('.post.bookmark');
						event.preventDefault();
					},
					key: settings.key.toBookmark,
				},
				'nav-to-prev': {
					enable: false,
					icon: '&vltri;', desc: __('Scroll to a previous post'),
					func: function(event) {
						event.preventDefault();
					},
					key: settings.key.prev,
				},
				'nav-to-next': {
					enable: false,
					icon: '&vrtri;', desc: __('Scroll to a next post'),
					func: function(event) {
						event.preventDefault();
					},
					key: settings.key.next,
				},
			},
			'unitScroll': {
				'scroll_up':	{	key: settings.key.up,	},
				'scroll_down':	{	key: settings.key.down,	},
				'scroll_pageup':	{	key: settings.key.pageup,	},
				'scroll_pagedown':	{	key: settings.key.pagedown,	},
				'scroll_top':	{	key: settings.key.top,	},
				'scroll_bottom': {	key: settings.key.bottom,	},
			},
		}
	];

	var resizeDelay = 250;
	if(pageInfo.id==Page.THREADS || pageInfo.id==Page.BOARDS) {
		resizeDelay = storage.get('settings.vlines.resizeDelay');
	}
	//	new footervar
	var footerBar = new Navbar(navStruct, {
		exp: exp,
		id: 'footer-bar',
		textExp: '.footer-text',
		unitScroll: {
			unitExp: (pageInfo.id==Page.READCGI)? readcgiUnitExp: '.list-box',
			animate: settings.animateScroll,
			resizeDelay: resizeDelay,
		},
	});
	//	add properties and methods.
	footerBar.signal = new Signal($('.bookmark-signal', footerBar.$elm), 2);
	footerBar.bind();
	footerBar.createToolBox = createToolBox;
	footerBar.setCallback = function (callback) {
		this.options.callback = callback;
	}
	footerBar.$elm.addClass('meiryo');
	return footerBar;
	//
	/**
	 * Method to create tool box on the button.
	 * @param {object} initialData initial data
	 * @param {SettingTool.Schema} schema settings schema
	 * @param {function} callback callback called when change value.
	 */
	function createToolBox(initialData, schema, callback) {
		$button = $('.tool-box', footerBar.$elm);
		this.toolBox = new ToolBox({
			schema: schema,
			initialData: initialData,
			callback: callback,
			exp: this.$elm[0],
			this: this,
		});
		$button.hover((event)=> {
			this.toolBox.enter(event);
		}, (event)=> {
			this.toolBox.leave(event);
		});
	};
}

/**
 * @typedef ToolBox.Options
 * @property {SettingTool.Schema} schema schema of setting interface.
 * @property {object} initialData initial data
 * @property {Storage|true} [storage] storage object, Or create temporal strage if true.
 * @property {function} [callback] call back when value changed.
 * @property {*} [this] Value of this in the callback.
 * @property {string|element|jQuery} exp jQuery serector expression to that attached
 * @property {string} applyFunc jQuery function to attach.
 * @property {string} attach initial side of element to attach the popupbox. 'top', 'bottom', 'left', or 'right'.
 * @property {string} align: initial alignment of the popup. 
 * 	allows 'left', 'center', or 'right' for top or bottom attach, 
 * 	'top', 'middle', or 'bottom' for left or right attach. 
 * @property {number} delay delay in msec when open and close.
 */

 /**
 * Class of popup setting tools.
 * @constructor
 * @param {ToolBox.Options} options Options
 */
var ToolBox = function(options) {
	options = $.extend({
		schema: null,
		initialData: null,
		storage: false,
		callback: null,
		this: this,
		exp: null,
		applyFunc: 'append',
		attach: 'top',
		align: 'center',
		delay: 100,
	}, options);
	this.settingTool = new SettingTool({
		schema: options.schema,
		initialData: options.initialData,
		storage: true,
		callback: options.callback,
	});
	PopupBox.call(this, options);
};

ToolBox.prototype = $.extend({}, PopupBox.prototype);

/**
 * Render tool box.
 */
ToolBox.prototype.render = function() {
	this.$elm = $('<div class="tool-box"></div>');
};

/**
 * Render and Bind all setting widgets.
 */
ToolBox.prototype.bind = function() {
	this.settingTool.attach(this.$elm);
	$('.setting-item', this.$elm).mouseenter(function(){
		var help = $(this).find('span[data-help]').attr('data-help');
		footerBar.text(help);
	});
	$('.setting-item', this.$elm).mouseleave(function(){
		footerBar.text('');
	});
};

ToolBox.prototype.openBox = function(event) {};
ToolBox.prototype.closeBox = function(event) {};

/**
 * Class Signal
 * @constructor
 * @param {string|Element} Selector expression to attach this.
 * @param {number} num Number of signals.
 */
var Signal = function(exp, num) {
	this.$elm = $('<div class="signal"></div>');
	for(var i=0; i<num; i++) {
		this.$elm.append('<div></div>');
	}
	$(exp).append(this.$elm);
};

/**
 * Switch.
 * @param {number} no signal number. from 1 - . 
 * @param {boolean} [val] turn on or off. if omitted, swith.
 */
Signal.prototype.switch = function(no, val) {
	var $sig = $('div:nth-child('+no+')', this.$elm);
	if(val===undefined) {
		val = $sig.hasClass('signal-on')? false: true;
	}
	if(val) $sig.addClass('signal-on');
	else $sig.removeClass('signal-on');
};
