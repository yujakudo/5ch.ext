/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Class of wrapping chrome.storage.
 * @since  2018.03.17  initial coding.
 */

/**
 * Class of wrapping chrome.storage.
 * @constructor
 * @param {string} type Type of storage. 'sync', 'local' or 'temp'.
 * 	'temp' is not use chrome.storage.
 * @param {object} initialData initial data.
 * @param {function} callback callback to called after first loading.
 * @param {function} [errCallback] callback to called when error occured.
 */
var Storage = function(type, initialData, callback, errCallback) {
	if(type!=='sync' && type!=='local' && type!=='both') type = 'temp';
	this.type = type;
	this.initialData = initialData;
	this.dataKeys = Object.keys(initialData);
	this.data = {};
	this.errCallback = errCallback;
	this.saving = false;
	Storage.extend(this.data, initialData);
	this.load(callback, true);
};

/**
 * Get data from specified object by path string.
 * @param {string} path Path to data. '.' separated.
 * @param {object} obj root object 
 * @return {*} specified data. or false if it does not exist.
 */
Storage.getByPath = function(path, obj) {
	path = path.split('.');
	var ret = obj;
	for(var i=0; i<path.length; i++) {
		if(!(path[i] in ret)) return false;
		ret = ret[path[i]];
	}
	return ret;
};

/**
 * Get data.
 * if returened value is an object, it is part of the storage clone.
 * So you must not to call set method when change it.
 * @param {string} path Path to data. '.' separated.
 * @return {any} Specified data.
 */
Storage.prototype.get = function(path) {
	if(path===undefined) return this.data;
	return Storage.getByPath(path, this.data);
};

/**
 * Set data.
 * @param {string} path Path to data. '.' separated.
 * @param {*} value Value to set.
 */
Storage.prototype.set = function(path, value) {
	path = path.split('.');
	var ret = this.data;
	for(var i=0; i<path.length-1; i++) {
		ret = ret[path[i]];
	}
	ret[path[i]] = value;
};

/**
 * Load data.
 * @param {function} callback Callback to call when loaded.
 * @param {boolean} b_force force to load if true. Or, check timestamp and loads when the chrome.storage has new.
 */
Storage.prototype.load = function(callback, b_force) {
	if(this.type==='temp') return;
	if(b_force) {
		if(this.type==='local' || this.type==='sync') {
			this.loadChrome(this.type, callback);
		} else if(this.type==='both') {
			this.loadChrome('local', ()=>{
				this.loadChrome('sync', callback);
			});
		}
	} else {
		if(this.type==='local' || this.type==='sync') {
			this.loadChrome(this.type, (storage, data)=> {
				if(data.timestamp > this.data.timestamp) this.load(callback, true);
			}, 'timestamp', true);
		} else if(this.type==='both') {
			this.loadChrome('local', (storage, data)=> {
				if(data.timestamp > this.data.timestamp) {
					this.load(callback, true);
				} else {
					this.loadChrome('sync', (storage, data)=> {
						if(data.timestamp > this.data.timestamp) this.load(callback, true);
					}, 'timestamp', true);
				}
			}, 'timestamp', true);
		}
	}
};

/**
 * Load from chrome.storage.
 * @param {string} type type of storage. 'sync' or 'local'.
 * @param {function} callback Callback to call when loaded.
 * @param {string|string[]} keys Keys to load. 
 * @param {boolean} [b_not_write] Does not overwrite clone data if true.
 */
Storage.prototype.loadChrome = function(type, callback, keys, b_not_write) {
	if(!keys) keys = this.dataKeys
	//	first argument of 'get' must not be array when the key is one. 
	//	if(!(keys instanceof Array)) keys = [keys];
	if(keys.length==0) return;
	chrome.storage[type].get(keys, (data)=> {
		if(!b_not_write) {
			//	Empty blace{} is the mark of free object.
			//	So clone data needs cleared, but the object has to not change.
			for(var key in data) {
				if((key in this.initialData) 
				&& typeof this.initialData[key]==='object' 
				&& Object.keys(this.initialData[key]).length==0) {
					Storage.clearObject(this.data[key]);
				}
			}
			Storage.overWrite(this.data, data);
		}
		if(callback) callback(this, data);
	});
};

/**
 * Save data.
 * @param {string|string[]} keys Keys of data to save.
 */
Storage.prototype.save = async function(keys) {
	if(this.type==='temp') return;
	if(!keys) keys = this.dataKeys;
	if(typeof keys ==='string') keys = [keys];
	var data = {};
	for(var i=0; i<keys.length; i++) {
		data[keys[i]] = this.data[keys[i]];
	}
	this.data.timestamp = data.timestamp = Date.now();
	//	It may bussy so sleep.
	while(this.saving) {
		await new Promise(resolve => setTimeout(resolve, 10));
	}
	try {
		this.saving = true;
		if(this.type==='local' || this.type==='sync') {
			chrome.storage[this.type].set(data,()=>{
				this.saving = false;
			});
		} else if(this.type==='both') {
			chrome.storage.local.set(data, ()=>{
				chrome.storage.sync.set(data,()=>{
					this.saving = false;
				});
			});
		}
	} catch(e) {
		this.saving = false;
		if(this.errCallback) this.errCallback(e.message);
	}
};

/**
 * Get Bytes in use.
 * @param {string|string[]} [keys] Key for strage. If omitted, takes all keys. 
 * @param {function} callback callback. 
 */
Storage.prototype.getInUse = function(keys, callback) {
	if(!keys) {
		keys = this.dataKeys.concat();
		keys.push('timestamp');
	}
	var type = this.type;
	if(type==='both') type = 'sync';
	chrome.storage[type].getBytesInUse(keys, function(bytes){
		callback(bytes, chrome.storage[type].QUOTA_BYTES);
	});
};

/**
 * Overwrite data only existing and same type.
 * To use overwite initial data without saved old data.
 * Empty blace{} in 'dest' means any property can be overwrited.
 * @param {object} dest destination object
 * @param {object} src source object 
 */
Storage.overWrite = function(dest, src) {
	for(var prop in dest) {
		if(!(prop in dest) || !(prop in src)) continue;
		if(typeof dest[prop] !== typeof src[prop]) continue;
		if(dest[prop] instanceof Array) {
			if(src[prop] instanceof Array) dest[prop] = src[prop].concat();
		} else if(typeof dest[prop]==='object') {
			if(Object.keys(dest[prop]).length==0) {
				Storage.copyObject(dest[prop], src[prop]);
			} else if(!(src[prop] instanceof Array)) {
				Storage.overWrite(dest[prop], src[prop]);
			}
		} else {
			dest[prop] = src[prop];
		}
	}
	return dest;
};

/**
 * Overwrite object.
 * @param {object} dest destination object
 * @param {object} src source object 
 */
Storage.extend = function(dest, src) {
	for(var prop in src) {
		if(!src.hasOwnProperty(prop)) continue;
		if(src[prop] instanceof Array) {
			dest[prop] = src[prop].concat();
		} else if(src[prop]!==null && typeof src[prop]==='object') {
			if(typeof dest[prop]!=='object' || dest[prop] instanceof Array || !dest[prop]) {
				dest[prop] = {};
			}
			Storage.extend(dest[prop], src[prop]);
		} else {
			dest[prop] = src[prop];
		}
	}
	return dest;
};

/**
 * Clear object properties.
 * It is used when the object is referred and cannot be replaced.
 * @param {object} obj Object
 */
Storage.clearObject = function(obj) {
	for(var prop in obj) {
		if(obj.hasOwnProperty(prop)) delete obj[prop];
	}
	return obj;
};

/**
 * Copy object shallowly.
 * @param {object} dest destination object
 * @param {object} src source object 
 */
Storage.copyObject = function(dest, src) {
	for(var prop in src) {
		dest[prop] = src[prop];
	}
	return dest;
};
