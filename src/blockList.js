/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview read.cgi extention.
 * @since  2018.03.18  initial coding.
 */

/**
 * Class for manage block ID.
 * @constructor
 * @param {Storage} storage storage object
 * @param {string} key Key of storage for block list.
 */
var BlockList = function(storage, key) {
	this.storage = storage;
	this.key = key;
	this.lists = this.storage.get(this.key);
	for(var i=0; i<BlockList.categories.length; i++) {
		var cat = BlockList.categories[i];
		if(!(cat in this.lists)) this.lists[cat] = {}; 
	}
	if(!('lastCheck' in this.lists)) this.lists.lastCheck = 0; 
};
BlockList.categories = ['userid', 'forcedid'];

/**
 * Loop for each category.
 * when callback returns value not undefined, stop loop and return the value.
 * @param {function} callback callback called in loop.
 * @return {*} return value of callback.
 */
BlockList.prototype.eachCategory = function(callback) {
	for(var i=0; i<BlockList.categories.length; i++) {
		var cat = BlockList.categories[i];
		var res = callback.call(this, cat, this.lists[cat]);
		if(res!==undefined) return res;
	}
};

/**
 * Loop for each id in specified category.
 * when callback returns value not undefined, stop loop and return the value.
 * @param {string} cat category.
 * @param {function} callback callback called in loop.
 * @return {*} return value of callback.
 */
BlockList.prototype.eachId = function(cat, callback) {
	var list = this.lists[cat];
	for(var sid in list) {
		res = callback.call(this, cat, sid, list[sid]);
		if(res!==undefined) return res;
	}
};

/**
 * Save block list.
 */
BlockList.prototype.save = function() {
	this.storage.save(this.key);
};

/**
 * Block ID.
 * @param {string} cat Category. 'userid' or 'forcedid'
 * @param {string|string[]} sids ID to block, or it's array.
 */
BlockList.prototype.block = function(cat, sids) {
	if(!(sids instanceof Array)) sids = [sids];
	for(var i=0; i<sids.length; i++) {
		var sid = sids[i];
		this.lists[cat][sid] = {sid: sid, timestamp: Date.now()};
	}
	this.save();
};

/**
 * UnBlock ID.
 * @param {string} cat Category. 'userid' or 'forcedid'
 * @param {string|string[]} sids ID to unblock, or it's array.
 */
BlockList.prototype.unblock = function(cat, sids) {
	if(!(sids instanceof Array)) sids = [sids];
	for(var i=0; i<sids.length; i++) {
		var sid = sids[i];
		if(sid in this.lists[cat]) delete this.lists[cat][sid];
	}
	this.save();
};

/**
 * Check whether blocked.
 * @param {string} cat Category. 'userid' or 'forcedid'
 * @param {string} sid ID to check.
 * @return {boolean} true if blocked otherwise false.
 */
BlockList.prototype.isblocked = function(cat, sid) {
	return (sid in this.lists[cat])? true: false;
};

/**
 * Check post whether blocked.
 * @param {Post} post post to check.
 * @return {boolean} true if blocked otherwise false.
 */
BlockList.prototype.isBlockedPost = function(post) {
	var ret = this.eachCategory((cat, list)=> {
		if(post[cat] in list) return true;
	});
	return ret? true: false;
};

/**
 * Clear list.
 * @param {string} cat Category. 'userid' or 'forcedid'
 */
BlockList.prototype.clear = function(cat) {
	this.lists[cat] = {};
	this.save();
};

/**
 * Get list.
 * @param {string} cat Category. 'userid' or 'forcedid'
 * @return {string[]} list of IDs.
 */
BlockList.prototype.getList = function(cat) {
	return Object.keys(this.lists[cat]);
};

/**
 * Expire old block.
 * @param {number} duration Duration of keep block in day. 0 is not deleted.
 */
BlockList.prototype.expire = function(duration) {
	if(!duration) return;
	var now = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
	if(this.lists.lastCheck===now) return null;
	this.lists.lastCheck = now;
	var period = Date.now() - duration * 24 * 60 * 60 * 1000;
	var num = 0;
	this.eachCategory((cat, list)=> {
		for(var ids in list) {
			if(list[ids].timestamp < period) {
				delete list[ids];
				num++;
			}
		}
	});
	this.save();
	return num;
};

