/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Entry of content and functions.
 * @since  2018.03.20  initial coding.
 */

//	Globals
/**
 * Information of current page.
 * @type {PageInfo}
 */
var pageInfo = null;

/**
 * the storage object.
 * @type {Storage}
 */
var storage = null;

/**
 * the footer bar
 * @type {footerBar}
 */
var footerBar = null;

/**
 * the bookmarks object.
 * @type {Bookmarks}
 */
var bookmarks = null;

/**
 * Wall object
 * @type{Wall}
 */
var wall = null;

/**
 * The selector expression of unit in readcgi.js.
 * @type {string}
 */
var readcgiUnitExp = '.post:not(.blocked), .formbox';
// var readcgiUnitExp = '.post';

/**
 * Pages information and IDs.
 * @type {object}
 */
var Page = {};
Page.UNKNOWN = 0;	//	Other page
Page.READCGI = 1;	//	read.cgi
Page.THREADS = 2;	//	List of threads
Page.BOARDS = 3;	//	List of boards
Page.JUMP = 4;		//	jump.2ch.net
Page.AFTERPOST = 5;	//	bbs.cgi
/**
 * Information for pages.
 * @property {string|false} path Path to settings of the page.
 * @property {function} func procedure of the page.
 * @property {boolean} b_page Whether the page needs user functions or not. 
 */
Page.info = [
	{	path: false,				func: null,		b_page: false	},
	{	path: 'settings.readcgi',	func: readcgi,	b_page: true	},
	{	path: 'settings.subback',	func: subback,	b_page: true	},
	{	path: 'settings.bbsmenu',	func: bbsmenu,	b_page: true	},
	{	path: false,				func: jumpPage,	b_page: false	},
	{	path: false,				func: afterPost,b_page: false	},
];

//	Entry
pageInfo = getPageInfo(window.location.href);
if(pageInfo.id!=Page.UNKNOWN) {
	new Promise(function(resolve, reject) {
		storage = new Storage('local', InitialData, resolve, saveError);
	}).then(function() {
		if(!storage.get('settings.enable')) return;
		var info = Page.info[pageInfo.id];
		if(info.path && !storage.get(info.path+'.enable')) return;
		//	set additional data to pageInfo.
		pageInfo.date = Date.now();
		pageInfo.title = $('title').text();
		if(pageInfo.id==Page.THREADS) {
			var pos = pageInfo.title.indexOf('＠');
			if(pos) pageInfo.title = pageInfo.title.substr(0,pos);
		}
		//	if not page for user.
		if(!info.b_page) {
			info.func();
			return;
		}
		wall = new Wall(true, true);
		//	locale
		var locale = storage.get('settings.language');
		setLocale(locale, function(){
			//	bookmarks.
			bookmarks = new Bookmarks(storage, 'bookmarks');
			//	footer toolbar
			var enable_footer = storage.get('settings.footerCtrl.enable');
			var exp = (enable_footer)? 'body': null;
			footerBar = createFooterBar(exp, pageInfo);
			//	execute function.
			info.func();
			savePageInfo();
		});
	});
};
//
/**
 * Callback from storage when save error occured.
 * shows message at the footer bar.
 * @param {string} message Message.
 */
function saveError(message) {
	if(footerBar) footerBar.text(message);
}

/**
 * Procedure for jump.2ch.net
 */
function jumpPage() {
	var autojump = storage.get('settings.autoJump');
	if(autojump) {
		var url = window.location.search.substr(1);
		jumpTo(url);
	}
}

/**
 * Procedure for bbs.cgi
 */
function afterPost() {
	if(!storage.get('settings.readcgi.form.backAfterPost')) return;
	var title = $('title:first').text();
	if(title!=='書きこみました。') return;
	var info = storage.get('pageInfo.post');
	window.location.href = info.url;
	return false;
}

/**
 * Seve pageInfo.
 * This is also used to specify query and segment of the page that wanted to jump.
 * @param {string} [attr] property. 'prev' or 'post'. 'prev' takes if omitted.
 * @param {*} segment segument to jump. especialy post ID.
 */
function savePageInfo(attr, segment) {
	if(attr===undefined) attr = 'prev';
	var url = pageInfo.protocol + pageInfo.host + pageInfo.path;
	if(pageInfo==Page.READCGI) {
		if(pageInfo.query==='l50') {
			url = pageInfo.theUrl+pageInfo.min_postid+'-n';
		}
	}
	if(segment) url += '#'+segment;
	var info = storage.get('pageInfo');
	info[attr] = {url: url, title: pageInfo.title, date: pageInfo.date};
	storage.save('pageInfo');
}

/**
 * Get previous page information.
 * @param {string} [attr] property. 'prev' or 'post'. 'prev' takes if omitted.
 */
function getPrevPageInfo(attr) {
	if(attr===undefined) attr = 'prev';
	var info = storage.get('pageInfo.'+attr);
	if(typeof info!=='object' || !('url' in info)) return false;
	var pinfo = getPageInfo(info.url);
	if(!pinfo) return false;
	pinfo.title = info.title;
	pinfo.date = info.date;
	return pinfo;
}

/**
 * @typedef PageInfo
 * @desc Result of extract URL.
 * @property {string} url URL.
 * @property {string} protocol Protocol field like 'http://'.
 * @property {string} host Host name.
 * @property {string} path URL path including first '/'.
 * @property {string} search Get method query after '?'. Not include '?'.
 * @property {string} segment Segment after '#'. Not include '#'.
 * @property {number} id Identifier of the page. It is property of Page.
 * @property {string} [basePath] URL path of fixed part not including any id. Including first and last '/'.
 * @property {string} [bid] Board ID in string.
 * @property {string} [tid] Thread ID in string but vharacters are number.
 * @property {string} [query] Query part of URL path. Specifically identification posts in read.cgi
 * @property {string} [theUrl] URL excluded query to get whole posts. read.cgi only.
 * @property {string} [threadsUrl] URL to List of threads view.
 * @property {string} [title] page title. but excluded unuse phrase.
 */

 /**
  * Get infomation of a page relating 5ch.
  * @param {string} url URL
  * @return {PageInfo} Infomation fo the page.
  */
function getPageInfo(url) {
	var info = extractUrl(url);
	info.id = Page.UNKNOWN;
	if(!('host' in info)) return info;
	info.subhost = info.host.substr(0, info.host.indexOf('.'));
	if(info.path.match(/^(.+\/read.cgi\/)([^\/]+)\/([^\/]+)(\/(.*))?$/)) {
		info.id = Page.READCGI;
		info.basePath = RegExp.$1;
		info.bid = RegExp.$2;
		info.tid = RegExp.$3;
		info.query = RegExp.$5;
		info.theUrl = 'https://'+info.host+info.basePath
							+ info.bid+'/'+info.tid+'/';
		info.threadsUrl = 'https://'+info.host+'/'+info.bid+'/subback.html';
	} else if(info.path.match(/^(.*\/)?([^\/]+)\/subback.html([\?\#].*)?$/)) {
		info.id = Page.THREADS;
		info.basePath = RegExp.$1;
		info.bid = RegExp.$2;
		info.threadsUrl = 'https://'+info.host+'/'+info.bid+'/subback.html';
	} else if(info.path.indexOf('/bbstable.html')>=0) {
		info.id = Page.BOARDS;
	} else if(info.host==='jump.5ch.net') {
		info.id = Page.JUMP;
	} else if(info.path==='/test/bbs.cgi') {
		info.id = Page.AFTERPOST;
	}
	return info;
}

/**
 * Make rightup item and box layout.
 * @param {Board[]|Thread[]} list List of items. 
 * @param {jQuey} Element in that boxes are made.  
 * @param {function} callbackEachItem callback for each item. 
 */
function makeBox(list, $elm, callbackEachItem) {
	var srcInfo = getScreenInfo($elm);

	if(!$('#lists-mark')[0]) $elm.before('<div id="lists-mark"></div>');
	var $frag = $(document.createDocumentFragment());
	$frag.append($elm);
	//	remove box end board before adding new.
	$('.list-box-end', $elm).remove();
	var $box = null;
	var cnt = 0;
	for(var idx=0; idx<list.length; idx++, cnt++) {
		var x = cnt % srcInfo.lineNum;
		if(x==0) {
			var $box = newBox($elm, $box);
			srcInfo.boxNum++;
		}
		if(x == srcInfo.lineNum-1 && list[idx].b_header) {
			$box.append('<div class="list-box-end">&nbsp;</div>');
			idx--;
		} else {
			$box.append(list[idx].elm);
			if(callbackEachItem) callbackEachItem(list[idx]);
		}
	}
	//	remove empty boxes
	$('.list-box', $frag).each(function(){
		if(!$(this).children('a')[0]) $(this).remove();
	});
	$('.list-box', $frag).addClass(storage.get('settings.vlines.orientation'));
	//	apare
	$('#lists-mark').after($frag);
	//	fill empty space of last box.
	var box_width = $('.list-box:first', $elm).width();
	var $last = $('.list-box:last', $elm);
	var last_width = $last.width();
	if(last_width<box_width) {
		var $board = $('<div class="list-box-end"></div>');
		$last.append($board);
		$board.width(box_width - last_width);
	}
	//
	/**
	 * Get information of the view.
	 * Decides number of items in a box.
	 * @param {jQuey} Element in that boxes are made.  
	 */
	function getScreenInfo($elm) {
		var info = makeBox.screenInfo;
		var elm_width = $elm[0].offsetWidth + 4;
		if(info) {
			info.width = elm_width - info.frameWidth;
			info.lineNum = Math.floor(info.width/info.lineWidth);
			return info;
		}
		info = makeBox.screenInfo = {};
		info.boxNum = 0;
		info.width = elm_width;
		var $firstbox = newBox($elm);
		info.frameWidth = $firstbox.outerWidth(true);
		info.width -= info.frameWidth;
		$firstbox.append('<span><a class="item-title-base"><span class="item-title">a</span></a></span>');
		var width1 = $firstbox.outerWidth(true);
		info.lineWidth = width1 - info.frameWidth;
		info.lineNum = Math.floor(info.width/info.lineWidth);
		$firstbox.remove();
		return info;
	}
	/**
	 * Create new box element.
	 * @param {jQuery} $parent Parent element.
	 * @param {jQuery} [$box] Element of the last box. 
	 */
	function newBox($parent, $box) {
		$new = $('<div class="list-box"></div>');
		if($box) $box.after($new);
		else $parent.prepend($new);
		return $new;
	}
}
makeBox.screenInfo = null;

/**
 * Get Sorted list.
 * If not exists, create in the array of lists.
 * @param {object[][]} lists Array of object list
 * @param {number|string} key sort key. 
 * @param {boolean} [b_desc] sort in descending if true
 * @return {object[]} sorted list.
 */
function getSortedList(lists, key, b_desc) {
	if(key in lists) return lists[key];
	var keys = Object.keys(lists);
	lists[key] = lists[keys[0]].concat();
	return sortList(lists[key], key, b_desc);
}

/**
 * Prepare for conversion of title for display.
 * Calls this before @see convToDisp .
 * @param {boolean} b_text_only Set true if header and footer area for title are not needed.
 */
function prepareConvDisp(b_text_only) {
	prepareConvDisp.vlines = storage.get('settings.vlines');
	prepareConvDisp.flags = 0;
	if(b_text_only) {
		prepareConvDisp.flags = 1;
	}

	//	prepare regular expressions
	prepareConvDisp.regex.upright = null;
	prepareConvDisp.regex.cuterm = null;
	//	remake
	if(prepareConvDisp.vlines.combineUprightChars) {
		var chars = '[\\w\\d\\!\\?\\#\\,\\.\\\'\\/\\-\\+\\\'\\\"]';
		var pattern = '(?<!'+chars+'[\\s\\-]?)('+chars+'{1,'+prepareConvDisp.vlines.combineUprightChars+'})(?![\\s\\-]?'+chars+')';
		prepareConvDisp.regex.upright = new RegExp(pattern, 'g');
	}
	if(prepareConvDisp.vlines.combineUprightTerms) {
		pattern = '(?<![a-zA-Z_])('+prepareConvDisp.vlines.combineUprightTerms+')(?![a-zA-Z_])';
		prepareConvDisp.regex.cuterm = new RegExp(pattern, 'ig');
	}
	//	static
	if(!prepareConvDisp.regex.copyright) {
		prepareConvDisp.regex.copyright = new RegExp('\\s*\\[(無断)?転載禁止\\].2ch\\.net\\s*', 'g');
		prepareConvDisp.regex.footer = new RegExp('(【([^】]*)】(<norep>)*)$', 'g');
		prepareConvDisp.regex.norep_back = new RegExp('<norep>', 'g');
		prepareConvDisp.regex.blacket = new RegExp('[\\(\\)\\[\\]\\{\\}]', 'g');
	}
}
prepareConvDisp.regex = {};
prepareConvDisp.vlines = null;
prepareConvDisp.flags = 0;

/**
 * Convert title text for display.
 * @param {string} text Text of title
 */
function convToDisp(text) {
	//	Convert half width KANA to full width.
	if(prepareConvDisp.vlines.half2fullKana) text = text.toFullWidthKana();
	//	Escape copying
	var copyings = [],
	
//			text = text.replace(/\s*\[(無断)?転載禁止\].2ch\.net\s*/g ,
	text = text.replace(prepareConvDisp.regex.copyright ,
		function(match){
			copyings.push(match);
			return '<norep>';
	});

	//	to ASCII chars if possible
	if(prepareConvDisp.vlines.toAscii) text = text.toAscii();
	//	blacket
	text = text.replace(prepareConvDisp.regex.blacket, 
		function(match){
			return '<span class="blacket">'+match+'</span>';
	});
	//	Part
	if(prepareConvDisp.regex.cuterm) {
	//			text = text.replace(/(part)\s*(\d{1,3})(?!\d)/ig,
		text = text.replace(prepareConvDisp.regex.cuterm, 
			function(match){
				return '<span class="comb">'+match+'</span>';
		});
	}
	//	Symbols less than 3 in 1 column.
//			text = text.replace(/(?<![\w\d\!\?\#\,\.][\s\-]?)([\w\d\!\?\#\,\.]{1,3})(?![\s\-]?[\w\d\!\?\#\,\.])/g,
	if(prepareConvDisp.regex.upright) {
		text = text.replace(prepareConvDisp.regex.upright, function(match){
			return '<span class="comb">'+match+'</span>';
		});
	}
	if(prepareConvDisp.flags==1) {
		var disp = '<span class="title-main">'+text.trim()+'</span>';
		return disp;
	}
	//	Tagging
	var header = '&nbsp;';
	var pos = text.indexOf('】');
	if(text.charAt(0)==='【' && pos>0) {
		header = text.substr(0, pos+1);
		text = text.substr(pos+1);
	}
	var footer = '';
//			if(text.match(/(【([^】]*)】(<norep>)*)$/)) {
	if(text.match(prepareConvDisp.regex.footer)) {
		footer = RegExp.$1;
		text = text.substr(0, text.length - footer.length);
	}
	var header_class = (header==='&nbsp;')? ' no-header': '';
	var disp = '<span class="title-header'+header_class+'">'+header
		+'</span><span class="title-main">'+text.trim()
		+'</span><span class="title-footer">'+footer
		+'</span>';
	//	Unescape
//			disp = disp.replace(/<norep>/g ,
	disp = disp.replace(prepareConvDisp.regex.norep_back,
		function(match){
		var copy = copyings.shift();
		return '<span class="norep" title="'+copy.trim()+'">&copy;</span>'
	});
	return disp;
}

/**
 * Class Logger
 * Log time and message.
 * @constructor
 */
var Logger = function() {
	this.list = [];
};

/**
 * Log message and time.
 * @param {string} message Message
 */
Logger.prototype.log = function(message) {
	this.list.push([Date.now(), message]);
};

/**
 * Get log string with duration.
 * @param {string} message Message.
 * @param {number} durationFrom Date time of start things.
 */
Logger.prototype.getTextDuration = function(message, durationFrom) {
	var text = message + ' (';
	var sum = 0;
	var prev = durationFrom;
	for(var i=0; i<this.list.length; i++) {
		var time = this.list[i][0] - prev;
		text += this.list[i][1] + ' ' + time + 'ms, ';
		prev = this.list[i][0];
	}
	return text + ')';
};
