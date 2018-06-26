/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview makes browser API compatible with chrome API.
 * @since  2018.06.24  initial coding.
 */

if(!chrome && browser) {
	var chrome = browserApi();
}

/**
 * makes compatible API.
 */
function browserApi() {
	var ua = window.navigator.userAgent.toLowerCase();
	if(ua.indexOf('firefox')<0) return;
	var api = {storage: {}, extension: {}, tabs: {}};
	api.storage.local = {
		get:	function(){ caller.apply(browser.storage.local.get, arguments); },
		set:	function(){ caller.apply(browser.storage.local.set, arguments); },
		getBytesInUse:	function(){ caller.apply(browser.storage.local.getBytesInUse, arguments); },
		remove:	function(){ caller.apply(browser.storage.local.remove, arguments); },
		clear:	function(){ caller.apply(browser.storage.local.clear, arguments); },
	};
	api.extension = {
		getURL: browser.extension.getURL,
	};
	api.tabs = {
		gettingCurrent:	function(){ caller.apply(browser.tabs.gettingCurrent, arguments); },
	};
	return api;

	//
	function caller() {
		var callback = arguments[arguments.length - 1];
		this.apply(this, arguments).then(function(){
			callback.apply(callback, arguments);
		}, function(error) {
			throw error;
		});
	};
}
