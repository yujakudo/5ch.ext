/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Class to make settins interface.
 * @since  2018.05.11  initial coding.
 */

/**
 * @typedef {SettingTool.Schema.Value}
 * @desc value in setting schema.
 * @property {*} value value.
 * @property {string} [label] label string of the value.
 */
/**
 * @typedef {SettingTool.Schema.Item}
 * @desc Item of setting schema
 * @property {string} [title] Title of settings or category.
 * @property {string} [path] Path to get setting value. '.' separated.
 * @property {string} [type] Type of widget. 'switch', 'rotary', 'text', 'number', or 'keycode'.
 * @property {SettingTool.Schema.Value[]} [values] values selected by user 
 * @property {string} [label] Label for input.
 * @property {number[]} [range] Range of user can input when the type is 'number'.
 * @property {string} [help] Help sentences for the item.
 * @property {SettingTool.Schema} [subset] Settings following this item.
 */
/**
 * @typedef {SettingTool.Schema}
 * @desc Setting schema to describe interface.
 * @type {SettingTool.Schema.Item[]}
 */
/**
 * @typedef SettingTool.Options
 * @property {SettingTool.Schema} schema schema of setting interface.
 * @property {object} initialData initial data
 * @property {Storage|true} [storage] storage object, Or create temporal strage if true.
 * @property {function} [callback] call back when value changed.
 * @property {*} [this] Value of this in the callback.
 */
/**
 * Class to make setting user interface.
 * @constructor
 * @param {SettingTool.Options} options Options.
 */
var SettingTool = function(options) {
	this.options = $.extend({
		schema: null,
		initialData: null,
		storage: false,
		callback: null,
		this: this,
	}, options);
	this.objs = [];
	this.storage = null;
	if(this.options.storage instanceof Storage) {
		this.storage = this.options.storage;
		if(!this.options.initialData) {
			this.options.initialData = Storage.extend({}, this.storage.get());
		}
	} else if(this.options.storage===true && this.options.initialData) {
		this.storage = new Storage('temp', this.options.initialData);
	}
	this.pathmap = {};
};

/**
 * Get data by path from storage.
 * @param {string} path Path to the data.
 */
SettingTool.prototype.getData = function(path) {
	if(!this.storage) return false;
	return this.storage.get(path);
};

/**
 * Render and bind interface.
 * @param {string|Element|jQuery} exp jQuery selector expression to attach this.
 */
SettingTool.prototype.attach = function(exp) {
	this.extractSchema(this.options.schema, 1, $(exp));
	$(exp).on('change', '.ssch-text input, .ssch-number input', ()=>{
		var $inp = $(event.target);
		var val = $inp.val();
		if($inp.attr('type')==='number') val = parseInt(val);
		var path = $inp.closest('.ssch-wdg').data('path');
		this.setValue(val, path);
	});
	$(exp).on('keydown', '.ssch-keycode input[type="text"]', ()=>{
		var code = yjd.key.getCode(event);
		var $inp = $(event.target).closest('.ssch-keycode');
		if(code==yjd.key.codes.ESCAPE) code = 0;
		$('input[type="hidden"]', $inp).val(code);
		var name = code? yjd.key.getName(code): '';
		$('input[type="text"]', $inp).val(name);
		var path = $inp.data('path');
		this.setValue(code, path);
		event.preventDefault();
		return false;
	});
};

/**
 * Render and bind a part of schema.
 * @param {SettingTool.Schema} schema a part of schema.
 * @param {number} level indent level. 
 * @param {jQuery} $elm Element to append.
 */
SettingTool.prototype.extractSchema = function(schema, level, $elm) {
	for(var i=0; i<schema.length; i++) {
		var item = schema[i];
		var $item = $('<div class="setting-item"></div>');
		$elm.append($item);
		var label = ('label' in item)? item.label: '';
		if('id' in item) $item[0].id = item.id;
		if('title' in item) {
			var $title = ('<h'+level+'>'+item.title+'</h'+level+'>');
			$item.append($title);
		}
		var defVal = null;
		if('type' in item) defVal = addTool.call(this, item, $item);
		if('help' in item) {
			$help = $('<span></span>').attr('data-help', item.help);
			if('type' in item) {
				$item.append($help);
			} else if('title' in item) {
				$item.children('h1,h2,h3,h4,h5,h6,h7,h8,h9').append($help);
			}
		}
		if('subset' in item) {
			var $subset = $('<div class="subset level'+level+'"></div>');
			$item.append($subset);
			this.extractSchema(item.subset, level+1, $subset);
			if(('type' in item) && item.type==='switch') {
				this.visibleSubset($item, defVal);
			} 
		}
}
	/**
	 * Append setting wedget.
	 * @param {SettingTool.Schema.Item} item information of the item 
	 * @param {jQuery} $elm Element to appned item.  
	 * @return {*} default value. 
	 */
	function addTool(item, $elm) {
		var label, $inp;
		var defVal = null;
		if('path' in item) {
			defVal = Storage.getByPath(item.path, this.options.initialData);
		}
		switch(item.type) {
			//	Switch object.
			case 'switch':
			case 'rotary':
			var options = { type: item.type, exp: $elm[0] };
			if('label' in item) options.label = item.label;
			if('values' in item) options.values = item.values.concat();
			if('path' in item) {
				options.default = defVal;
				options.callback = SettingTool.prototype.setValue;
				options.this = this;
				options.argument = item.path;
				this.pathmap[item.path] ={
					schema: item,
				};
			}
			var obj = new Switch(options);
			this.objs.push(obj);
			if(this.pathmap[item.path]) this.pathmap[item.path].obj = obj;
			break;

			//	Text input.
			case 'number':
			case 'text':
			label = ('label' in item)? item.label: '';
			var maxmin = '';
			if('range' in item) {
				maxmin = ' mix="'+item.range[0]+'" man="'+item.range[1]+'"';
			}
			$inp = $('<div class="ssch-wdg ssch-'+item.type+'"><label><span>'+label+'</span>'
			+'<input type="'+item.type+'"'+maxmin+' /></label></div>');
			$elm.append($inp);
			if('path' in item) {
				$('input', $inp).val(defVal);
				this.pathmap[item.path] ={
					schema: item,
					elm: $inp[0],
				};
				$inp.data('path', item.path);
			}
			break;

			//	Get key code when downed.
			case 'keycode':
			label = ('label' in item)? item.label: '';
			$inp = $('<div class="ssch-wdg ssch-keycode"><label><span>'+label+'</span>'
			+'<input type="text" /><input type="hidden" /></label></div>');
			$elm.append($inp);
			if('path' in item) {	//	Initialize
				var value = defVal;
				$('input[type="hidden"]', $inp).val(value);
				var name = value? yjd.key.getName(value): '';
				$('input[type="text"]', $inp).val(name);
				this.pathmap[item.path] ={
					schema: item,
					elm: $inp[0],
				};
				$inp.data('path', item.path);
			}
			break;
		}
		return defVal;
	}
};

/**
 * Callback to called when a value changed.
 * calls application callback as same arguemnt.
 * @param {*} value changed value
 * @param {string} path Path to value 
 */
SettingTool.prototype.setValue = function(value, path) {
	var schema = this.pathmap[path].schema;
	if(schema.type==='switch' && ('subset' in schema)) {
		this.visibleSubset(this.pathmap[path].obj.$elm, value);
	} 
	if(this.storage) this.storage.set(path, value);
	if(this.options.callback) this.options.callback.call(this.options.this, value, path);
};

/**
 * set visiblity of subset.
 * @param {string|Element|jQuery} elm jQuery selector expression
 * @param {*} value Value of settings. Only true and false affect.
 */
SettingTool.prototype.visibleSubset = function(elm, value) {
	$item = $(elm);
	if(!$item.hasClass('setting-item')) {
		$item = $item.closest('.setting-item');
	}
	if(value===true) {
		$item.children('.subset').removeClass('disabled');
	} else if(value===false) {
		$item.children('.subset').addClass('disabled');
	}
};
