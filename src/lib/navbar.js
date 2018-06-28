/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Key navigation bar.
 * @since  2018.04.28  initial coding
 */

/**
 * @typedef Navbar.Structure.item
 * @property {boolean} enable Enables if true.
 * @property {string} icon Icon
 * @property {string} [desc] Description
 * @property {number} [key] Shortcut key code.
 * @property {function} [func] callback when triggered.
 * @property {string} [href] URL to jump.
 */
/**
 * @typedef Navbar.Structure
 * @desc array of groups. a group is hash array(object) of cateogories.
 * 	a category is hash array(object) of items.
 * @type {Navbar.Structure.item[][][]}
 */
/**
 * @typedef Navbar.Options
 * @property {string} id	id attribute of tag.
 * @property {string|Element|jQuery} exp	Selector expression where to attach.
 * @property {string} applyFunc	jQuery method to attuch 
 * @property {string|Element|jQuery} textExp: Selector expression to text write.
 * @property {UnitScroll.Options} unitScroll Options for UnitScroll.
 * @property {string} callback: null,
 * @property {string} this: this,
 */
/**
 * Class of navigation bar.
 * @constructor
 * @param {Navbar.Structure} struct Structure of bar.
 * @param {Navbar.Options} options options.
 */
var Navbar = function(struct, options) {
	this.options = Storage.extend({
		id : null,
		exp: 'body',
		applyFunc: 'append',
		textExp: null,
		unitScroll: null,
		callback: null,
		this: this,
	}, options);
	this.options.unitScroll.callback = Navbar.prototype.unitScrollCallback;
	this.options.unitScroll.this = this;
	this.render(struct);
};


/**
 * Set new options.
 * @param {Navbar.Options} options.
 */
Navbar.prototype.setOptions = function(options) {
	this.options = $.extend(this.options, options);
	if(this.unitScroll && 'unitScroll' in options) {
		this.unitScroll.options = $.extend(this.unitScroll.options, options.unitScroll);
	}
};

/**
 * Render the wedget.
 * @param {Navbar.Structure} struct Structure of bar.
 */
Navbar.prototype.render = function(struct) {
	this.keyMap = {};
	this.$elm = $('<div class="ext-navbar"></div>');
	if(this.options.id) this.$elm[0].id = this.options.id;
	//	Loop as structure.
	for(var idx=0; idx<struct.length; idx++) {
		var $group = $('<div class="ext-navbar-group"></div>');
		this.$elm.append($group);
		for(var category in struct[idx]) {
			//	if unitScroll, creates.
			if(category==='unitScroll') {
				if(!this.options.unitScroll) continue;
				this.unitScroll = new UnitScroll($group, this.options.unitScroll);
				//	add shortcut key name to description.
				var cat_info = struct[idx][category];
				for(var item in cat_info) {
					var info = cat_info[item];
					if(info.key) {	//	Add shortcut key name at the description
						this.keyMap[info.key] = item;
						var desc = $('.'+item, $group).attr('data-title');
						if(typeof desc!=='string') desc = '';
						desc += ' ('+yjd.key.getName(info.key)+')';
						$('.'+item, $group).attr('data-title', desc);
					}
				}
			} else {	//	add buttons in the category.
				var $cat = $('<div class="'+category+'"></div>');
				$group.append($cat);
				var cat_info = struct[idx][category];
				for(var item in cat_info) {
					var info = cat_info[item];
					if(!info.enable) continue;
					this.addItem(item, category, info);
				} 
			}
		}
	}
};

/**
 * Callback called from unitScroll when event occured.
 * @param {string} type Type of event. 'resized' only.
 */
Navbar.prototype.unitScrollCallback = function(type) {
	if(type==='resized') {
		this.unitScroll.options.footerHeight = this.$elm[0].offsetHeight;
	}
	if(this.options.callback) return this.options.callback.call(this.options.this, type);
};

/**
 * Bind handlers
 */
Navbar.prototype.bind = function() {
	if(this.options.exp) {
		$(this.options.exp)[this.options.applyFunc](this.$elm);
	}
	if(this.unitScroll) {
		this.unitScroll.options.footerHeight = this.$elm[0].offsetHeight;
		this.unitScroll.bind();
	}
	$(document).keydown((event)=>{
		Navbar.prototype.onKeyDown.call(this, event);
	});
	this.$elm.on('mouseenter', '*[data-title]', (event)=>{
		Navbar.prototype.text.call(this, $(event.currentTarget).attr('data-title'));
	});
	this.$elm.on('mouseleave', '*[data-title]', (event)=>{
		Navbar.prototype.text.call(this, '');
	});
	this.$elm.on('click', 'a[href]', function(event) {
		jumpTo(this.href, false, event);	//	this = element
	});
};

/**
 * Add item to specified category.
 * @param {string} name Name of item.
 * @param {string} category Category. 
 * @param {Navbar.Structure.Item} info item information in structure.
 * @param {boolean} b_prepend prepend in category if true, otherwise append. 
 */
Navbar.prototype.addItem = function(name, category, info, b_prepend) {
	if(category==='unitScroll') category = 'pnl_unitscroll';
	var disabled = (info.enable)? '': ' disabled';
	var $item = $('<a class="'+name+disabled+'"><span class="icon">'+info.icon+'</span></a>');
	if(!b_prepend) $('.'+category, this.$elm).append($item);
	else $('.'+category, this.$elm).prepend($item);
	var desc = '';
	if(info.href) $item.attr('href', info.href);
	if(info.desc) desc = info.desc;
	if(info.func) $item.click(info.func);
	if(info.key) {
		this.keyMap[info.key] = name;
		desc += ' ('+yjd.key.getName(info.key)+')';
	}
	if(desc!=='') $item.attr('data-title', desc);
	return $item[0];
};

/**
 * Show text in specified element by options.
 * @param {string} text 
 */
Navbar.prototype.text = function(text) {
	if(text===undefined || text===null) text = '';
	if(!this.options.textExp) return;
	$(this.options.textExp, this.$elm).html(text);
};

/**
 * Key down event handler.
 * Triggers button process.
 * @param {KeyEvent} event Event
 */
Navbar.prototype.onKeyDown = function(event) {
	var focused = document.activeElement;
	if(focused && ['input','textarea','select'].indexOf(focused.tagName.toLowerCase())>=0) return false;
	var code = yjd.key.getCode(event);
	if(code in this.keyMap) {
		var itemClass = this.keyMap[code];
		var $item;
		if(typeof itemClass==='string' && itemClass.charAt(0)!=='#') {
			$item = $('.'+itemClass, this.$elm);
		} else {
			$item = $(itemClass)
		}
		if(!$item.hasClass('disabled')) $item.trigger('click');
		event.preventDefault();
		event.stopPropagation();
	}
};

/**
 * Add shortcut key.
 * @param {number} key key code.
 * @param {Element|string|jQuery} exp jQuery expression for the element to trigger.
 */
Navbar.prototype.addShortCutKey = function(key, exp) {
	var code = yjd.key.getCode(key);
	this.keyMap[code] = exp;
};