/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Class of bookmarks.
 * @since  2018.05.01  initial coding.
 */

/**
 * BBS menu page.
 * @type {string}
 */
var fch_bbsmenu = 'https://menu.5ch.net/bbstable.html';

/**
 * @typedef Bookmarks.Place
 * @type {object}
 * @desc Place on the tree structure like directory of the Bookmarks.
 * 	In particuler, boards and threads.
 * @property {object} . information of the place.
 * @property {object} _ Mark information of this place. 
 */
/**
 * @typedef Bookmarks.PlaceExp
 * @desc place expression
 * @type {Bookmarks.Place|PageInfo|string} When string, it likes path separated by '/'.
 */

 /**
  * Class for bookmarks.
  * @constructor
  * @param {Storage} storage Storage object.
  * @param {string} key key of bookmarks for storage.
  */
var Bookmarks = function(storage, key) {
	this.storage = storage;
	this.storageKey = key;
	var root = this.storage.get(this.storageKey);
	if(!('.' in root)) root['.'] = {};
};

/**
 * Save bookmarks.
 */
Bookmarks.prototype.save = function() {
	this.storage.save(this.storageKey);
};

/**
 * Get host+boardid(hbid).
 * @param {PageInfo} info information of page. 
 * @return {string|false} hbid. Or, false when info is not correct.
 */
Bookmarks.prototype.gethbid = function(info) {
	if(!('host' in info) || !('bid' in info)) return false;
	var host = info.host;
	return host+':'+info.bid;
};

/**
 * Get place object.
 * @param {Bookmarks.PlaceExp} place 
 * @param {boolean} b_make Makes new place if true. 
 * @return {Bookmarks.Place|false} place. or false if fail. 
 */
Bookmarks.prototype.getPlace = function(place, b_make) {
	var dir;
	if(typeof place==='object') {
		//	Check place object.
		if(('.' in place) && ('path' in place['.'])) return place;
		if(place instanceof Array) {
			dir = place;
		} else {
			var hbid = this.gethbid(place);
			if(!hbid) return false;
			//	place is pageInfo object.
			dir = [];
			dir.push(hbid);
			if('tid' in place) dir.push(place.tid);
		}
	} else {	//	place is string.
		dir = place.split('/');
		if(!dir[0]) dir.shift();
	}
	var root = this.storage.get(this.storageKey);
	var pos = root;
	var path = '';
	for(var i=0; i<dir.length; i++) {
		var cur = dir[i];
		if(cur==='') break;
		if(!(cur in pos)) {
			if(b_make) {
				pos[cur] = {
					'.': { sid: cur, path: path}
				};
				if(i==0) root['.'].aliveCheck = 0;
			} else {
				return false;
			}
		}
		path += (path.length)? '/'+cur: cur;
		pos = pos[cur];
	}
	return pos;
};

/**
 * Set a bookmark.
 * @param {PageInfo} place Expression for place.
 * @param {string} key key of the bookmark.
 * @param {object} [val] value to store. only object.
 */
Bookmarks.prototype.set = function(pageInfo, key, val) {
	place = this.getPlace(pageInfo, true);
	if(!place) return false;
	place['.'].title = pageInfo.title;
	place['.'].title4sort = pageInfo.title.conv4comp();
	// if(!b_not_clear) this.clearPlace(place, true);
	if(val===undefined) val = {};
	if(typeof val==='object' && !(val instanceof Array)) {
		val.timestamp = Date.now();
	}
	place[key] = val;
	this.save();
	return true;
};

/**
 * Delete a bookmark.
 * @param {Bookmarks.PlaceExp} place Expression for place.
 * @param {string} key key of the bookmark.
 * @param {boolean} b_just_delete Set true when delete the bookmark checking and saving is not needed.
 */
Bookmarks.prototype.delete = function(place, key, b_just_delete) {
	place = this.getPlace(place);
	if(!place) return;
	if(key in place) {
		delete place[key];
		if(!b_just_delete) this.checkDeletePlace(place);
	}
	if(!b_just_delete) this.save();
};

/**
 * Get bookmarks.
 * @param {Bookmarks.PlaceExp} place Expression for place.
 * @return {object[]} Array of bookmark data.
 */
Bookmarks.prototype.getBookmarks = function(place) {
	place = this.getPlace(place, true);
	if(!place) return false;
	var rep = [];
	for(var key in place) {
		if(key==='.' || key==='_') continue;
		rep.push(place[key]);
	}
	if(rep.length==0) return null;
	return rep;
};

/**
 * Get place mark.
 * @param {PageInfo} pageInfo information of the page. 
 * @return {object|true|false} Data object or just true if there is no data.
 * 	Or false if mark is not.
 */
Bookmarks.prototype.getPlaceMark = function(pageInfo) {
	var place = this.getPlace(pageInfo);
	if(place && ('_' in place)) {
		if(place._.data) return place._.data;
		return true;
	}
	return false;
};

/**
 * Get count of bookmarks or marked places.
 * @param {Bookmarks.PlaceExp} place Expression for place.
 * @return {number|false} Number of bookmarks or marked places(0.5).
 * 	Or false if the place does not exist.
 */
Bookmarks.prototype.placeCount = function(place) {
	var place = this.getPlace(place);
	if(!place) return false;
	var cnt = Object.keys(place).length;
	if('.' in place) cnt--;
	if('_' in place) cnt -= .5;
	return cnt;
};

/**
 * @typedef Bookmarks.List.Item
 * @desc marked item information
 * @property {string} sid sid or ID of item.
 * @property {string} path path to parent.
 * @property {string} title title of sid.
 * @property {string} url url.
 * @property {number|null} marked Marked time if marked otherwise null.
 */
/**
 * Get list of items in place.
 * @param {Bookmarks.PlaceExp} place Expression for place.
 * @param {boolean} b_grandchildren Set true if need list of grandchildren.
 * @return {Bookmarks.List.Item[]} list of items.
 */
Bookmarks.prototype.getList = function(place, b_grandchildren) {
	var place = this.getPlace(place);
	if(!place) return false;
	var list = [];
	if(!b_grandchildren) {
		loopToMake.call(this, place);
	} else {
		for(var sid in place) {
			if(sid==='.' || sid==='_') continue;
			loopToMake.call(this, place[sid]);
		}
	}
	return list;
	//
	function loopToMake(place) {
		for(var sid in place) {
			if(sid==='.' || sid==='_') continue;
			var info = makeInfo.call(this, place[sid]);
			list.push(info);
		}
	}
	function makeInfo(place) {
		// if(!('title4sort' in place['.'])) place['.'].title4sort = place['.'].title.conv4comp();
		// this.save();
		var info = Object.assign({}, place['.']);
		if(!('title' in info)) {
			var sids = info.sid.split('.');
			info.title4sort = info.title = sids[sids.length - 1];
		}
		info.url = this.getUrl(place);
		info.marked = ('_' in place)? place._.timestamp: false;
		var keys = Object.keys(place);
		var pos = keys.indexOf('.');
		if(pos>=0 ) keys.splice(pos,1);
		var pos = keys.indexOf('_');
		if(pos>=0 ) keys.splice(pos,1);
		info.children = keys;
		return info;
	}
};

/**
 * Get URL from palce or path.
 * @param {Bookmarks.Place|string} path place or path expression. 
 */
Bookmarks.prototype.getUrl = function(path) {
	if(typeof path==='object' && ('.' in path)) {
		var info = path['.'];
		path = (('path' in info) && info.path)? info.path.split('/'): [];
		path.push(info.sid);
	}
	if(typeof path==='string') {
		path = path.split('/');
		if(!path[0]) path.shift();
	}
	if(path.length==0) return fch_bbsmenu;
	var hbid = path[0].split(':');
	var host = 'http://'+hbid[0]+'/';
	if(path.length==1) return host+hbid[1]+'/subback.html';
	var url = host+'test/read.cgi/'+hbid[1]+'/'+path[1]+'/';
	if(path.length==2) return url;
	return url + '#' + path[2];
};

/**
 * Set mark and data to a page.
 * @param {PageInfo} pageInfo information of the page to mark.
 * @param {object} [data] data to set.
 */
Bookmarks.prototype.markPlace = function(pageInfo, data) {
	var place = this.getPlace(pageInfo, true);
	place['.'].title = pageInfo.title;
	place['.'].title4sort = pageInfo.title.conv4comp();
	var val = {};
	val.timestamp = Date.now();
	val.data = data;
	place._ = val;
	this.save();
};

/**
 * Unmark a page.
 * @param {Bookmarks.PlaceExp} place Expression for place.
 * @param {boolean} b_just_unmark Set true when delete place checking and saving is not needed.
 */
Bookmarks.prototype.unmarkPlace = function(place, b_just_unmark) {
	this.delete(place, '_', b_just_unmark);
};

/**
 * Clear all bookmarks and marked pages in the page.
 * @param {Bookmarks.PlaceExp} place Expression for place.
 * @param {boolean} b_just_clear Set true when delete place checking and saving is not needed.
 */
Bookmarks.prototype.clearPlace = function(place, b_just_clear) {
	var place = this.getPlace(place);
	if(!place) return;
	for(prop in place) {
		if(prop.charAt(0)==='.') continue;
		if(prop.charAt(0)==='_') continue;
		delete place[prop];
	}
	if(!b_just_clear) {
		this.checkDeletePlace(place);
		this.save();
	}
};

/**
 * Delete the place if it has no child.
 * @param {Bookmarks.PlaceExp} place Expression for place.
 */
Bookmarks.prototype.checkDeletePlace = function(place) {
	place = this.getPlace(place);
	if(!place) return;
	var cnt = 0;
	for(prop in place) {
		if(prop==='.') continue;
		cnt++;
	}
	if(cnt>0) return false;
	var parent = this.getPlace(place['.'].path);
	delete parent[place['.'].sid];
	if('.' in parent) this.checkDeletePlace(parent);
	return true;
};

/**
 * Deletes marked board that does not exist.
 * Executs when the day changed.
 * @param {Board[]} marked List of marked boards information. 
 * @return {number} Number of removed boards.
 */
Bookmarks.prototype.boardAlive = function(marked) {
	var root = this.getPlace('');
	if(!this.aliveCheck(root)) return 0;
	var num = 0;
	var hbids = {};
	var host, hbid;
	for(var i=0; i<marked.length; i++) {
		hbid = this.gethbid(marked[i]);
		hbids[hbid] = marked[i];
	}
	for(hbid in root) {
		if(hbid==='.' || hbid==='_') continue;
		if(!(hbid in hbids)) {
			delete root[hbid];
			num++;
		} else if(!('title' in root[hbid]['.'])) {
			root[hbid]['.'].title = hbids[hbid].text;
			root[hbid]['.'].title4sort = hbids[hbid].text.conv4comp();
		}
	}
	this.save();
	return num;
};

/**
 * Deletes marked threads that does not exist.
 * Executs when the day changed.
 * @param {PageInfo} pageInfo Inforamation of the page
 * @param {Thread[]} marked List of marked thread. 
 * @return {number} Number of removed threads.
 */
Bookmarks.prototype.threadAlive = function(pageInfo, marked) {
	var place = this.getPlace(pageInfo);
	if(!place) return false;
	if(!('title' in place['.'])) {
		place['.'].title = pageInfo.title;
		place['.'].title4sort = pageInfo.title.conv4comp();
	}
	if(!this.aliveCheck(place)) return 0;
	var num = 0;
	var threads = [];
	var thread;
	for(var i=0; i<marked.length; i++) {
		threads.push(marked[i].tid);
	}
	for(thread in place) {
		if(thread==='.' || thread==='_') continue;
		if(threads.indexOf(thread)<0) {
			delete place[thread];
			num++;
		}
	}
	this.checkDeletePlace(place);
	this.save();
	return num;
};

/**
 * Needs of check. 
 * Checks of aliving needs only when the date changes. 
 * @param {Bookmarks.Place} place place object.
 * @return {boolean} needs of check.
 */
Bookmarks.prototype.aliveCheck = function(place) {
	var now = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
	var name = 'aliveCheck';
	if((name in place['.']) && place['.'][name]===now) return false;
	place['.'][name] = now;
	return true;
};