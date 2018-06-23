/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview bbstable.html - List of boards page - extention.
 * @since  2018.05.12  initial coding.
 */

/**
 * @typedef Board
 * @desc Information of boards or headers, sentences in a list.
 * @property {Element} elm Element of 'a',  'b', or 'span' tag.
 * @property {string} url URL of link.
 * @property {boolean} [b_header] header object if true.
 * @property {string} bid Board id.
 * @property {string} title Title.
 * @property {string} disp HTML of title to display
 * @property {string} category Category
 */
/**
 * @typedef Boards
 * @desc Lists of boards
 * @property {Board[]} all Linst of all boards, headers and sentences. 
 * @property {Board[]} header Linst of header items. 
 * @property {Board[]} main Linst of main items.
 * @property {Board[]} marked Linst of marked boards.
 */
 /**
 * Procedure for bbstable.html
 */
function bbsmenu() {
	//	Sub globals
	/**
	 * Settings for bbsmenu
	 */
	var settings = applySettings(true);

	/**
	 * current board.
	 * @type {Board}
	 */
	var curItem = null;

	/**
	 * Lists of boards.
	 * @type {Boards}
	 */
	var boards = {};

	//	Add Styles.
	var ADDITIONAL_CSS = {
		"body": {
			"margin": "0",
		},
	};
	for(var prop in ADDITIONAL_CSS) {
		$(prop).css(ADDITIONAL_CSS[prop]);
	}
	//	create fragment and move all element without footer bar.
	var $frag_old = $(document.createDocumentFragment());
	$frag_old.append($('body>*:not(.ext-navbar,#wall)'));

	var bbs_num = collectLinks(boards, $frag_old);
	bookmarks.boardAlive(boards.marked);
	cloneElement(boards, $frag_old);
	renderLayout(boards, $frag_old);
	makeList(true);
	$frag_old = null;
	bindHandlers();

	wall.show(false);
	var time = Date.now() - pageInfo.date;
	footerBar.text(
		__('%num% boards are there. Ext took %time% msec to prepare.').fill({num:bbs_num, time:time})
	);
	//
	/**
	 * Apply stored setting when initialize or settings are updated.
	 * @param {boolean} b_init Initialize or not.
	 * @return {object} settings
	 */
	function applySettings(b_init) {
		var settings = storage.get('settings.bbsmenu');
		footerBar.setOptions({
			unitScroll: {
				resizeDelay: storage.get('settings.vlines.resizeDelay'),
			}
		})
		if(!b_init) {
			makeList();
		}
		return settings;
	}

	/**
	 * Bind handlers
	 */
	function bindHandlers() {
		$(window).on('focus', function(){
			storage.load(function() {
				settings = applySettings();
			});
		});
		var $container = $('.bbsmenu-container');
		//	Display thread title on the footer bar.
		$container.on('mouseenter', '.item-title-base[href]', function(event){
			var $parent = $(this).parent();
			var id = Number($parent[0].id);
			if(!isNaN(id)) footerBar.text(boards.main[id].text);
		});
		$container.on('mouseleave', '.item-title-base[href]', function(event){
			footerBar.text();
		});
		//	Hook link click
		$container.on('click', 'a[href]', function(event){
			var href = this.href;
			var bid = $(this).data('bid');
			if(!href) {
				var $item = $('.item-title-base', this);
				href = $item[0].href;
				bid = $item.data('bid');
			}
			if(href) {
				if(settings.linkToAll && typeof bid==='string' && bid.length) {
					href += 'subback.html';
				}
				savePageInfo();
				return jumpTo(href, !settings.notMakeNewTab, event);
			}
		});
		footerBar.setCallback(function(type) {
			if(type==='resized' && makeList.win_width!=window.innerWidth) {
				makeList();
			}
		});
	}

	/**
	 * Make boards information from links of boards.
	 * @param {object} threads Object in that makes lists.
	 * @param {jQuery} $content Element in that this works. 
	 */
	function collectLinks(boards, $content) {
		var prevPageInfo = getPrevPageInfo();

		boards.all = [];
		boards.header = [];
		boards.main = [];
		boards.marked = [];
		var b_main = false;
		// var b_main = true;
		var info
		var category = '';
		var regexp_text = new RegExp('^[\\/【】\\s]+|[\\/【】\\s]+$', 'g');
		var bbs_num = 0;
		//	At first, tag each text to inseert box.
		$('font', $content).contents().each(function(){
			if(this.nodeType!==3) return;
			var $text = $(this);
			var text = $text.text();
			text = text.replace(regexp_text, '');
			if(text!=='') {
				$text.before('<span>'+text+'</span>');
				$text.remove();
			}
		});	
		//	Convert DOM
		prepareConvDisp(true);
		//	for each links and separators.
		$('body>a,body>b,font a,font b,font span', $content).each(function(){
			//	makes inforamion and push into main list.
			if(!b_main && 'b'===this.tagName.toLowerCase()) b_main = true;
			info = getInfo(this);
			if(!b_main) {
				info.bid = null;
				boards.header.push(info);
			} else {
				info.elm.id = info.idx = boards.main.length;
				if(info.b_header) {
					category = info.text;
				}
				info.category = category;
				boards.main.push(info);
				if(prevPageInfo && prevPageInfo.bid!==null && prevPageInfo.bid===info.bid) {
					curItem = info;
				}
				if(info.bid) {
					bbs_num++;
					info.marks = bookmarks.placeCount(info);
					if(info.marks) {
						if(info.marks % 1) info.marked = true;
						if(info.marks>= 1) info.bookmarked = true;
						boards.marked.push(Object.assign({}, info));
					}
				}
			}
			boards.all.push(info);
		});
		return bbs_num;
		//
		/**
		 * Make information of borads or something.
		 * @param {Element} elm Element of item.
		 * @return {Board} informaion of the item.
		 */
		function getInfo(elm) {
			var info;
			var tag = elm.tagName.toLowerCase();
			if('b'===tag) {
				info = {};
				info.b_header = true;
			} else if('a'===tag){
				var href = $(elm).attr('href');
				if(typeof href==='string') {
					info = extractUrl(href);
				} else {
					info = {};
					info.url = null;
				}
				info.b_header = false;
				if('path' in info) info.bid = info.path.substr(1, info.path.indexOf('/', 1)-1);
				else info.bid = null;
			} else {
				info = {};
				info.b_header = false;
				info.url = null;
				info.bid = null;
			}
			info.text = $(elm).text();
			info.disp = convToDisp(info.text);
			info.elm = elm;
			return info;
		}
	}
	/**
	 * Clone elements in list of marked boards.
	 * @param {Boards} boards Lists of boards. 
	 * @param {jQuery} $content Element in that this works. 
	 */
	function cloneElement(boards, $content) {
		insert('');
		for(var i=boards.marked.length-1; i>=0; i--) {
			info = boards.marked[i];
			$new = $('<a href="'+info.url+'">'+info.text+'</a>');
			info.elm = $new[0];
			insert(info, $new);
			if(curItem && info.bid==curItem.bid) curItem = info;
		}
		//
		/**
		 * Insert new element in the list.
		 * if 'info' is string, create new information and element.
		 * @param {Board|string} info information of sread,
		 * 	Or, string of title for new header element. 
		 * @param {jQuey} [$new] new cloned element of item.
		 */
		function insert(info, $new) {
			if(typeof info==='string') {
				var text = info;
				$new =$('<b>'+(text? text: '&nbsp;')+'</b>');
				info = {
					b_header: true,
					bid: null,
					text: text,
					disp: convToDisp(text),
					elm: $new[0],
				};
			}
			$content.append($new);
			boards.all.unshift(info);
		}
	}
	/**
	 * Render new layout.
	 * @param {Boards} boards lists of boards
	 * @param {jQuery} $frag_old Flagment in that elements is.
	 */
	function renderLayout(boards, $frag_old) {
		var $frag_new = $(document.createDocumentFragment());
		$frag_new.append(
			'<div class="bbsmenu-header">'
				+'<div class="image-link"></div>'
				+'<div class="text-link"></div>'
				+'<div class="forms"></div>'
			+'</div>'
			+'<div class="bbsmenu-container"></div>'
			+'<div class="bbsmenu-footer"></div>'
		);
		//	Header
		var $form = $('form', $frag_old);
		if(!$form[0]) $form = '&nbsp;';
		$('.forms', $frag_new).append($form);
		$('body').prepend($frag_new);
		//	footer;
//		var text = $frag_old.text().trim();
		var text = '&nbsp;';
		$('.bbsmenu-footer').html(text);
	}

	/**
	 * make list view.
	 * @param {boolean} b_init set true when initialize.
	 */
	function makeList(b_init) {
		if(b_init) {
			execLayout();
		} else {
			wall.show(true, true);
			setTimeout(()=>{
				execLayout();
				wall.show(false);
			}, 20);
		}
		makeList.win_width = window.innerWidth;
		//
		function execLayout() {
			makeBox(boards.all, $('.bbsmenu-container'), makeTitle);
			footerBar.unitScroll.unitExp('.list-box');
			if(curItem) footerBar.unitScroll.toItem(curItem.elm);
		}
	}

	/**
	 * Make HTML of title.
	 * This called from in makeBox.
	 * @param {Board} item information of a board or item.
	 */
	function makeTitle(item) {
		$elm = $(item.elm);
		$elm.removeAttr('href').attr('id', item.idx).text('');
		var href = '';
		if(typeof item.url==='string' && item.url.length) {
			href = ' href="'+item.url+'"';
		}
		var bid = '';
		if(item.bid!==null) bid = ' data-bid="'+item.bid+'"';
		var classes = '';
		if(item.b_header) classes += ' headline';
		if(item.marked) classes += ' marked';
		if(item.bookmarked) classes += ' bookmarked';
		$elm.html(
			'<a class="item-title-base'+classes+'"'+href+bid+'>'
			+'<span class="item-title">'+item.disp+'</span></a>'
		);
		if(curItem && curItem.idx===item.idx) {
			$elm.addClass('cur_item');
		}
	}
}
