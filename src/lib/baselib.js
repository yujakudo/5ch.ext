/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Library about URL.
 * @since  2017.11.12  initial coding.
 */

/**
 * Set locale and prepare for get text.
 * @param {locale} locale Locale. 'ja', 'en' or 'auto'.
 * @param {function} callback Callback when finish. 
 */
function setLocale(locale, callback) {
	if(locale==='auto') locale = null;
	yjd.str.setOption({
		locales: ['ja', 'en'],
	});
	locale = yjd.str.setLocale(locale);
	var url = chrome.extension.getURL('locale/' + locale + '.json');
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function() {
		if(xhr.readyState == XMLHttpRequest.DONE) {
			if(xhr.status==200) {
				var data = JSON.parse(xhr.responseText);
				yjd.str.setData(locale, data);
			}
			callback(locale);
		}
	};
	xhr.send();
}

 /**
  * Jump to another page.
  * It can switch tha page opens in new tab or existing tab by argument and Ctrl key.
  * @param {string} url URL to jump.
  * @param {boolean} b_new_tab When this is true or Ctrl key is pressed, the page is opening in new tab.
  * 	When this is false and Ctrl key is not pressed, the page is opening in existing tab.
  * @param {Event} event Event object to get ctrl key status.
  */
function jumpTo(url, b_new_tab, event) {
	if(typeof url!=='string' || url==='') return true;
	var ctrl = false;
	if(event) ctrl = event.ctrlKey;
	if(b_new_tab || ctrl) {
		var win = window.open(url, '_blank');
		win.focus();
	} else {
		if(pageInfo) {
			pageInfo.scroll_pos = window.pageYOffset;
			savePageInfo();
		}
		window.location.href = url;
	}
	if(event) event.preventDefault();
	return false;
}

/**
 * @typedef UrlInfo
 * @desc Result of extract URL.
 * @property {string} url URL.
 * @property {string} protocol Protocol field like 'http://'.
 * @property {string} host Host name.
 * @property {string} path URL path including first '/'.
 * @property {string} search Get method query after '?'. Not include '?'.
 * @property {string} segment Segment after '#'. Not include '#'.
 */

/**
 * Extract URL to parts.
 * @param {string} url URL.
 * @return {UrlInfo} extracted information.
 */
function extractUrl(url) {
	var info = {};
	info.url = url;
	if(!url.match(extractUrl.regex_url)) return info;
	info.protocol = RegExp.$1;
	info.host = RegExp.$2;
	info.path = RegExp.$3;
	info.search = RegExp.$5;
	info.segment = RegExp.$7;
	return info;
}
extractUrl.regex_url = /^(https?:\/\/)([^\/]+)(\/[^\?#]*)?(\?([^#]*))?(#(.*))?$/;

/**
 * Convert string to compare and to sort.
 * @param {string} str title string.
 */
String.prototype.conv4comp = function() {
	str = this.replace(String.prototype.conv4comp.regex_space_symbole, '');
	str = str.toAscii();
	str = str.toLowerCase();
	str = str.toHiragana();
	str = str.replace('【', '(');
	str = str.replace('】', ')');
	return str;
};
String.prototype.conv4comp.regex_space_symbole = new RegExp(
	'[\\s　]|[\u2500-\u2bff]|[\u3000-\u303f]'	//	space, symboles, CJK symbols
	+ '|\ud83c[\udf00-\udfff]|\ud83d[\udc00-\ude4f]'	//	emoji
	+ '|\ud83d[\ude80-\udeff]|\ud7c9[\ude00-\udeff]'
, 'g');

/**
 * Sort object list by key.
 * @param {object[]} list object list
 * @param {number|string} key sort key. 
 * @param {boolean} [b_desc] sort in descending if true
 * @return {object[]} sorted list. same object as 'list'.
 */
function sortList(list, key, b_desc) {
	if(list.length==0) return list;
	var up = -1, down = 1;
	if(b_desc) {
		up = 1; down = -1;
	}
	if(typeof list[0][key]==='number') {
		list.sort(compareNum);
	} else {
		list.sort(compareStr);
	}
	return list;
	//
	function compareNum(a, b){
		if(a[key]==b[key]) return 0;
		return (a[key]>b[key])? down: up;
	}
	function compareStr(a, b){
		a = a[key].toLowerCase();
		b = b[key].toLowerCase();
		if(a===b) return 0;
		var i = 0;
		while(i<a.length && i<b.length) {
			var ac = a.charCodeAt(i);
			var bc = b.charCodeAt(i);
			if(ac>bc) return down;
			if(ac<bc) return up;
			i++;
		}
		return (a.length==b.length)? 0: (a.length>b.length)? down: up;
	}
}

/**
 * Get string for file size.
 * @param {number|string} size
 * @return {string}
 */
Number.prototype.getSizeStr = function() {
	var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
	size = Math.floor(this);
	for(var i=0; i<6; i++) {
		if(size<1024) break;
		size = size / 1024;
	}
	var num = Math.floor(size);
	var lower = size - num;
	var str = num.toString();
	if(str.length<2) str += '.' + Math.floor(lower*10).toString();
	return ''+str+units[i];
};
