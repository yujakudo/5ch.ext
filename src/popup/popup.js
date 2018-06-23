/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview script for popup.html.
 * @since  2018.03.17  initial coding.
 */

 /**
  * Tabs object.
  */
var tabs = null;

/**
 * Storage object.
 * @type {Storage}
 */
var storage = null;

/**
 * Bookmarks object.
 * @type {Bookmarks}
 */
var bookmarks = null;

/**
 * BlockList object.
 * @type {BlockList}
 */
var blockList = null;

/**
 * SettingTool object.
 * @type {SettingTool}
 */
var settingTool = null;

/**
 * HelpPopup object
 * @type {HelpPopup}
 */
var helpPopup = null;

//	Entry
new Promise((resolve, rejet)=>{
	storage = new Storage('local', InitialData, resolve);
}).then(()=>{
	bookmarks = new Bookmarks(storage, 'bookmarks');
	blockList = new BlockList(storage, 'blockList');
	var locale = storage.get('settings.language');
	setLocale(locale, function(){
		$(initWindow);
	});
});

/**
 * Initialize the view.
 */
function initWindow() {
	if(!tabs) tabs = $('#tab-pages').makeTab();
	localize('body');
	makeBlockLists();
	makeFavoritesLists();
	updateInUse();
	bind();
}

/**
 * Localize HTML
 * @param {Element|string} exp Selector expression.
 */
function localize(exp) {
	$(exp).contents().each(function(){
		if(this.nodeType==1) {
			localize(this);
		} else if(this.nodeType==3) {
			var text = $(this).text();
			text = text.replace(/^(\s+)|(\s+)$/g, '');
			if(text) this.textContent = RegExp.$1 + __(text) + RegExp.$2;
		}
	});
}

/**
 * Bind handlers.
 */
function bind() {
	var cur_bid = '';
	$('#btn-init').click(function() {
		localize('body');
	});
	//	Favorites
	$('#list_boards,#list_threads').on('click', '.link', function(){
		var url = $(this).attr('title');
		jump(url);
	});
	$('#list_threads').on('click', '.title', function(){
		var url = $(this).data('url');
		jump(url);
	});
	$('#list_boards').on('click', '.title', function(){
		cur_bid = $(this).parents('.item').data('sid');
		makeFavoritesLists(cur_bid);
	});
	$('#btn-unmark').click(function(){
		$('#list_boards,#list_threads').find('input[type="checkbox"]:checked').each(function(){
			var sid = $(this).parents('.item').data('sid');
			var path = $(this).parents('.item').data('path');
			var place = bookmarks.getPlace(path+'/'+sid);
			bookmarks.unmarkPlace(place, true);
			if(path) bookmarks.clearPlace(place, true);
			bookmarks.checkDeletePlace(place);
		});
		bookmarks.save();
		makeFavoritesLists(cur_bid);
	});
	//	Block list
	$('#btn-remove').click(function(){
		removeId('userid');
		removeId('forcedid');
		makeBlockLists();
	});
	$('#btn-clear-userid-list').click(function(){
		blockList.clear('userid');
		makeBlockLists();
	});
	$('#btn-clear-forcedid-list').click(function(){
		blockList.clear('forcedid');
		makeBlockLists();
	});
	$('.tab-index:nth-child(1)').click(function(){
		makeFavoritesLists(cur_bid);
	});
	$('.tab-index:nth-child(3)').click(function(){
		if(!settingTool) renderSettings();
	});

	//	Settings
	$('body').on('click', '#settings-select>div', function() {
		if($(this).hasClass('disabled')) return;
		$('#settings-select>div.selected').removeClass('selected');
		$(this).addClass('selected');
		var id = $(this).attr('data-id');
		if(!id) {
			$('.setting-item.hidden').removeClass('hidden');
			return;
		}
		$('#'+id).removeClass('hidden').siblings().addClass('hidden');
		$('#'+id).parents('.setting-item').each(function(){
			$(this).removeClass('hidden').siblings().addClass('hidden');
		});
		$('#'+id).find('.setting-item.hidden').each(function(){
			$(this).removeClass('hidden');
		});
	});
	//	help
	helpPopup = new HelpPopup('body');
	$('body').on('mouseenter', '*[data-help], .help', function(event){
		helpPopup.enter(event);
	});
	$('body').on('mouseleave', '*[data-help], .help', function(event){
		helpPopup.leave(event);
	});
	//
	function jump(url) {
		chrome.tabs.getCurrent(function(tab) {
			chrome.tabs.update(tab, {url: url});
		});
	}
}

/**
 * Update display of storage size in use.
 */
function updateInUse() {
	storage.getInUse('', function(bytes, total) {
		$('#bookmarks-size').text(bytes.getSizeStr()+' / '+total.getSizeStr());
	});
}

//	Favorites.

/**
 * Make lists of favorites.
 * @param {string} hbid Host and board ID.
 */
function makeFavoritesLists(hbid) {
	makeMarkedList('', '#list_boards');
	var url = bookmarks.getUrl('');
	$('#list_boards').prepend('<div class="item">'
		+'<div class="link" title="'+url+'">&Colon;</div>'
		+'<div class="title" style="text-align:center">'+__('All')+'</div>'
	+'</div>');
	if(hbid) makeMarkedList(hbid, '#list_threads');
	else makeMarkedList('', '#list_threads', true);
	updateInUse();
}

/**
 * Make list of marked items.
 * @param {string} path path to place. 
 * @param {string} exp selector expression of list. 
 * @param {boolean} b_grandchildren Set true if need list of grandchildren.
 */
function makeMarkedList(path, exp, b_grandchildren) {
	$(exp).html('');
	var list = bookmarks.getList(path, b_grandchildren);
	if(!list) return;
	sortList(list, 'title4sort');
	var $list = $(document.createDocumentFragment());
	var b_threads = (path || b_grandchildren);
	var regex_sub = /【([^】]*)】/g;
	var b_link2all = storage.get('settings.subback.linkToAll');
	for(var i=0; i<list.length; i++) {
		var item = list[i];
		var classes = '';
		var after_mark = '';
		var segment = '';
		var title = item.title.replace(regex_sub, function(m) {
			return '<span class="sub_title">'+ m +'</span>';
		});
		if(item.marked) classes += ' marked';
		if(item.children.length) {
			classes += ' bookmarked';
		}
		var desc = item.title;
		if(b_threads) {
			if(item.children.length) {
				after_mark = item.url + item.children[0] + '-n'
				segment = '#' + item.children[0];
			}
			var main_url = item.url+'l50';
			var sub_url = item.url + segment;
			var sub_str = 'All';
			if(b_link2all) {
				sub_url = main_url;
				main_url = item.url + segment;
				sub_str = 'l50';
			}
			desc += main_url;
		}
		var $elm = $('<div class="item'+classes+'">'
			+ (b_threads? 
				'<div class="link sub" title="'+sub_url+'">'+sub_str+'</div>'
				+ (after_mark?
					'<div class="link to_bookmark" title="'+after_mark+'">&gtrarr;</div>'
					: '<div class="space"></div>'
				)
				: '<div class="link to_threads" title="'+item.url+'">&apid;</div>'
			)
			+'<div class="title" title="'+desc+'">'+title+'</div>'
			+ ((b_threads || item.marked)? '<div class="select"><input type="checkbox"/></div>': '')
			+'</div>');
		$list.append($elm);
		$elm.data('sid', item.sid);
		$elm.data('path', item.path);
		if(b_threads) $('.title', $elm).data('url', main_url);
	}
	$(exp).append($list);
}

//	Bloking IDs.

/**
 * remove ID from a list.
 * @param {string} cat category. 'userid' or 'forcedid'.
 */
function removeId(cat) {
	var vals = $('#list_'+cat).val();
	blockList.unblock(cat, vals);
}

/**
 * Make block ID list.
 */
function makeBlockLists() {
	blockList.eachCategory((cat)=> {
		var $list = $('#list_'+cat);
		$list.html('');
		blockList.eachId(cat, (cat, sid)=>{
			$list.append('<option>'+sid+'</option>');
		});
	});
	updateInUse();
}

//	Settings
function renderSettings() {
	settingTool = new SettingTool({
		schema: getSettingsSchema(),
		storage: storage,
		callback: settingsCallback,
	});
	$('#settings-set').html('');
	settingTool.attach('#settings-set');
	$('#settings-select').html('<div class="selected">'+__('All')+'</div>');
	$('#settings-set').find('.setting-item[id]').each(function(){
		var str = this.id.split('-').pop();
		str = str.replace(/[A-Z]/g, function(m){
			return ' '+m.toLowerCase();
		});
		str = str.substr(0,1).toUpperCase() + str.substr(1);
		var $subset = $(this).closest('.subset');
		var level = 0;
		if($subset) {
			for(level=1; level<5; level++) {
				if($subset.hasClass('level'+level)) break;
			}
			if(level==5) level = 0;
		}
		$('#settings-select').append(
			'<div class="level'+(level+2)+'" data-id="'+this.id+'">'+__(str)+'</div>'
		);
	});
	settingsCallback(storage.get('settings.enable'), 'settings.enable', true);
	help = __("To reflect some settings to tabs, you need to reload.")
	$('#settings-select').append('<span class="help" data-help="'+help+'"></span>');
}

function settingsCallback(value, path, b_init) {
	if(path==='settings.enable') {
		$('#settings-set').children('.setting-item').each(function(){
			if(this.id==='settings-basic') return;
			if(value) {
				$(this).removeClass('disabled');
			} else {
				$(this).addClass('disabled');
			}
		});
		$('#settings-select').children('*').each(function(){
			var id = $(this).attr('data-id');
			if(!id || id==='settings-basic') return;
			if(value) {
				$(this).removeClass('disabled');
			} else {
				$(this).addClass('disabled');
			}
		});
	}
	if(!b_init) storage.save('settings');
}

/**
 * Make tab page
 */
$.fn.makeTab = function(options) {
	var obj = {};
	obj.options = $.extend({
		type: "tab",
	}, options);
	obj.indexes = [];
	obj.$container = this;
	this.addClass('tabs');
	if(obj.options.type==='wizard') this.addClass('wizard');
	this.children().each(function(){
		$(this).addClass('tabs-page');
		obj.indexes[obj.indexes.length] = $(this).attr('data-tab');
	});
	//	make tab indexes
	this.prepend('<div class="tabs-indexes"></div>');
	obj.$indexes = $('.tabs-indexes', obj.$container);
	for(var i=0; i<obj.indexes.length; i++) {
		var $newTab = $('<span class="tab-index">'+__(obj.indexes[i])+'<span class="tab-edge"></span></span>');
		obj.$indexes.append($newTab);
		var tabWidth = $newTab.width();
		$newTab.data('tab', obj.indexes[i]).data('idx', i).data('width', tabWidth);
		if(obj.options.type==='tab') {
			$newTab.click(function(){
				obj.select(this);
			});
		}
	}
	//	click event handler
	obj.select = function(idx) {
		var $tab;
		if(typeof idx==='number') {
			$tab = $('span.tab-index:nth-child('+(idx+1)+')', this.$indexes);
		} else if(idx instanceof jQuery) {
			$tab = idx;
		} else {
			$tab = $(idx);
		}
		$('.tabs-selected', this.$container).removeClass('tabs-selected');
		$tab.addClass('tabs-selected');
		var page = '.tabs-page[data-tab="'+$tab.data('tab')+'"]';
		$(page, this.$container).addClass('tabs-selected');
		alignIndexes(this, $tab);
	};
	$(window).on('resize', function() {
		var $tab = $('span.tabs-selected', obj.$indexes);
		calcSize(obj);
		alignIndexes(obj, $tab);
	});
	calcSize(obj);
	obj.select(0);
	return obj;
	//
	function calcSize(tabs) {
		var $tab = $('span.tab-index:first-child', obj.$indexes);
		tabWidth = $tab.width();
		$tab.width(tabWidth);
		obj.tabWidthGap = $tab.width() - tabWidth;
		$tab.width(0);
		obj.tabBorderWidth = $tab.outerWidth(true) - $tab.width();
		$tab.width(tabWidth - obj.tabWidthGap);
	}
	function alignIndexes(tabs, $tab) {
		var maxWidthRatio = 0.7;
		var idx = Number($tab.data('idx'));
		var selectedWidth = Number($tab.data('width'));
		var totalWidth = tabs.$indexes.width();
		totalWidth -= obj.tabBorderWidth * tabs.indexes.length + 1;
		if(selectedWidth > totalWidth * maxWidthRatio) {
			selectedWidth = totalWidth * maxWidthRatio;
		}
		var i, $tab, tabWidth, tmpWidth;
		var width = [];
		for(i=0; i<tabs.indexes.length; i++) {
			width[i] = 0;
		}
		width[idx] = selectedWidth;
		var remainWidth = totalWidth - selectedWidth;
		var remainIdxs = tabs.indexes.length - 1;
		while(remainIdxs) {
			tmpWidth = remainWidth / remainIdxs;
			for(i=0; i<tabs.indexes.length; i++) {
				if(width[i]) continue;
				$tab = $('span.tab-index:nth-child('+(i+1)+')', tabs.$indexes);
				tabWidth = Number($tab.data('width'));
				if(tabWidth<tmpWidth) {
					width[i] = tabWidth;
					remainWidth -= tabWidth;
					remainIdxs--;
					break;
				}
			}
			if(i==tabs.indexes.length) break;
		}
		if(remainIdxs) tmpWidth = remainWidth / remainIdxs;
		for(i=0; i<tabs.indexes.length; i++) {
			if(!width[i]) width[i] = tmpWidth;
			$tab = $('span.tab-index:nth-child('+(i+1)+')', tabs.$indexes);
			$tab.width(width[i] - obj.tabWidthGap);
		}
	}
};
