/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview subback.html - List of threads page - extention.
 * @since  2018.05.03  initial coding.
 */

/**
 * @typedef Thread
 * @desc Information of thread.
 * @property {Element} elm Element of 'a' or 'b' tag.
 * @property {string} url URL of link.
 * @property {boolean} [b_header] header object if true.
 * @property {string} tid Thread id.
 * @property {number} no Thread number.
 * @property {string} title Title.
 * @property {string} disp HTML of title to display
 * @property {string} title4sort Title to use when sort.
 * @property {number} num Number of posts.
 * @property {number} idx Index  
 * @property {boolean} [marked] Wether the thread is marked or not.
 * @property {boolean} [bookmarked] Wether the thread is bookmarked or not.
 */

/**
 * @typedef Threads
 * @desc Lists of threads 
 * @property {object} lists same lists.
 * @property {Thread[]} lists.no List in original order.
 * @property {Thread[]} lists.title4sort List in order of title.
 * @property {Thread[]} lists.num List in order of number of posts.
 * @property {Thread[]} marked List of marked threads.
 */

 /**
 * Procedure for subback.html
 */
function subback() {
	//	Sub globals
	/**
	 * Current thread.
	 * @type {Thread}
	 */
	var curItem = null;

	/**
	 * Threads information.
	 * @type {Threads}
	 */
	var threads = {};

	/**
	 * Expressin of container of threads.
	 * @type {string}
	 */
	var threads_exp = '#trad';

	/**
	 * Settings for subback
	 */
	var settings = applySettings(true);

	//	Add Styles.
	var ADDITIONAL_CSS = {
		body: {
			margin: '0',
		},
		"#trad": {
			display: 'block',
		}
	};
	$('a[href="javascript:changeSubbackStyle();"]').hide();
	for(var prop in ADDITIONAL_CSS) {
		$(prop).css(ADDITIONAL_CSS[prop]);
	}
	//	Initiarize.
	collectLinks(threads, threads_exp);
	cloneElement(threads, $(threads_exp));
	var initSet = setToolBox();
	onSortSwitch(initSet.order, 1);
	bindHandlers();
	if(threads.marked.length) footerBar.signal.switch(2, true);
	bookmarks.threadAlive(pageInfo, threads.marked);
	//	scroll
	if(prevPageInfo && prevPageInfo.reloaded && prevPageInfo.scroll_pos) {
		$('html,body').scrollTop(prevPageInfo.scroll_pos);
	} else if(curItem) footerBar.unitScroll.toItem(curItem.elm);
	wall.show(false);
	var time = Date.now() - pageInfo.date;
	footerBar.text(
		__('%num% threads are there. The Ext. took %time% msec to prepare.')
		.fill({num: threads.lists.no.length, time: time})
	);

	//
	/**
	 * Apply stored setting when initialize or settings are updated.
	 * @param {boolean} b_init Initialize or not.
	 * @return {object} settings
	 */
	function applySettings(b_init) {
		var settings = storage.get('settings.subback');
		footerBar.setOptions({
			unitScroll: {
				resizeDelay: storage.get('settings.vlines.resizeDelay'),
			}
		})
		if(!b_init) {
			onSortSwitch();
		}
		return settings;
	}
	/**
	 * Bind handlers.
	 */
	function bindHandlers() {
		$(window).on('focus', function(){
			storage.load(function() {
				settings = applySettings();
			});
		});
		var $container = $('#lists-mark').parent();
		//	Show title in the text area of the footer bar.
		$container.on('mouseenter', '.item-title-base[href]', function(event){
			var idx = $(this).data('idx');
			idx = Number(idx);
			if(!isNaN(idx)) footerBar.text(threads.lists.no[idx].title);
		});
		$container.on('mouseleave', '.item-title-base[href]', function(event){
			footerBar.text();
		});
		//	Hook link click
		$container.on('click', 'a[href]', function(event){
			var href = this.href;
			var b_main = $(this).hasClass('item-title-base');
			var b_sub = $(this).hasClass('sub-link');
			if(!href) {
				href = $('.item-title-base', this)[0].href;
				b_main = true;
			}
			if((settings.linkToAll && b_sub) || (!settings.linkToAll && b_main)) {
				href += 'l50';
			}
			savePageInfo();
			return jumpTo(href, !settings.notMakeNewTab, event);
		});
		footerBar.setCallback(function(type) {
			if(type==='resized' && onSortSwitch.win_width!=window.innerWidth) {
				onSortSwitch(undefined, 2);
				return false;
			}
		});
	}

	/**
	 * Sort list by balue and scroll to current item.
	 * This called from switch.
	 * @param {string} [value] Value of swithe. 'title', 'no', or 'num'.
	 * @param {number} [ncase] set 1 when initiarize, set 2 when resized.
	 */
	function onSortSwitch(value, ncase) {
		if(value===undefined) {
			value = onSortSwitch.value;
		}
		else onSortSwitch.value = value;
		if(ncase==1) {
			execSort(value, ncase);
			onSortSwitch.count = 0;
		} else {
			wall.show(true, true);
			onSortSwitch.count++;
			setTimeout(()=>{
				onSortSwitch.count--;
				if(onSortSwitch.count==0) {
					execSort(value, ncase);
					wall.show(false);
				}
			}, 20);
		}
		onSortSwitch.win_width = window.innerWidth;

		/**
		 * Execute sort
		 * @param {string} value Value of swithe. 'title', 'no', or 'num'.
	 * @param {number} [ncase] set 1 when initiarize, set 2 when resized.
		 */
		function execSort(value, ncase) {
			var list;
			switch(value) {
				case 'title':
				list = makeList('title4sort');
				break;
				case 'no':
				list = makeList('no');
				break;
				case 'num':
				list = makeList('num');
				break;
			}
			if(!list) return;
			if(ncase==2) execSort.centerelm = footerBar.unitScroll.getElmInView(0, 0);
			pageInfo.scroll_pos = window.pageYOffset;
			makeBox(list, $(threads_exp), makeTitle);
			footerBar.unitScroll.unitExp('.list-box');
			if(ncase==2 && execSort.centerelm) {
				var box = $(execSort.centerelm).parent()[0];
				footerBar.unitScroll.toItem(box, 0);
			} else if(ncase!==1) {
				$('html,body').scrollTop(pageInfo.scroll_pos);
			}
			// if(curItem) footerBar.unitScroll.toItem(curItem.elm);
			// else footerBar.unitScroll.toItem(list[0].elm);
		}
		//
		/**
		 * Sort, clone, and add marked threads on head.
		 * @param {string} key Sort key. 
		 */
		function makeList(key) {
			var list = getSortedList(threads.lists, key);
			if(threads.marked.length) {
				list = list.concat();
				list.unshift(threads.separator);
				for(var i=threads.marked.length-1; i>=0; i--) {
					list.unshift(threads.marked[i]);
				}
			}
			return list;
		}
	}

	/**
	 * Make threads information from links of threads.
	 * @param {object} threads Object in that makes lists.
	 * @param {string|Element} exp Selector expression of container. 
	 */
	function collectLinks(threads, exp) {
		//	initialize threads
		if(Object.keys(threads).length==0) {
			threads.lists = {no:[]};
			threads.marked = [];
		}
		var list = threads.lists.no;
		if(prevPageInfo && prevPageInfo.bid!==pageInfo.bid) {
			prevPageInfo = null;
		}
		var hbid = bookmarks.gethbid(pageInfo)+'/';
		prepareConvDisp();
		//	for each a tab.
		$('a', exp).each(function(){
			//	make thread infomation.
			var thread = {};
			var text = $(this).text();
			thread.elm = this;
			thread.url = $(this).attr('href');
			thread.tid = thread.url.substr(0, thread.url.indexOf('/', 1));
			thread.no = text.substr(0,text.indexOf(':'));
			thread.no = parseInt(thread.no);
			thread.title = text.substr(text.indexOf(':')+2);
			thread.title = thread.title.substr(0, thread.title.lastIndexOf('(')-1);
			thread.title = thread.title.trim();
			thread.disp = convToDisp(thread.title);
			thread.title4sort = thread.title.conv4comp();
			thread.num = text.substr(text.lastIndexOf('(')+1);
			thread.num = thread.num.substr(0, thread.num.indexOf(')'));
			thread.num = parseInt(thread.num);
			thread.idx = list.length;
			list.push(thread);
			if(prevPageInfo && prevPageInfo.tid===thread.tid) {
				curItem = thread;
			}
			var thread_path = hbid+thread.tid;
			thread.marks = bookmarks.placeCount(thread_path);
			if(thread.marks) {
				if(thread.marks % 1) thread.marked = true;
				if(thread.marks>= 1) thread.bookmarked = true;
				threads.marked.push(Object.assign({}, thread));
			}
		});
	}

	/**
	 * Clone elements of marked information.
	 * @param {Threads} threads Lists of threads
	 * @param {jQuery} $content jQuery object of container.
	 */
	function cloneElement(threads, $content) {
		sortList(threads.marked, 'title');
		threads.separator = insert('');
		for(var i=0; i<threads.marked.length; i++) {
			thread = threads.marked[i];
			$new = $('<a href="'+thread.url+'">'+thread.text+'</a>');
			thread.elm = $new[0];
			insert(thread, $new);
			if(curItem && thread.tid==curItem.tid) curItem = thread;
		}
		/**
		 * Insert new element in the list.
		 * if 'info' is string, create new information and element.
		 * @param {Thread|string} info information of sread,
		 * 	Or, string of title for new header element. 
		 * @param {jQuey} [$new] new cloned element of thread.
		 * @return {Thread} information of the thread.
		 */
		function insert(info, $new) {
			if(typeof info==='string') {
				var text = info;
				$new =$('<b>'+(text? text: '&nbsp;')+'</b>');
				info = {
					no: '',
					num: '',
					b_header: true,
					tid: null,
					text: text,
					disp: convToDisp(text),
					elm: $new[0],
				};
			}
			$content.append($new);
			return info;
		}
	}
	/**
	 * Make HTML of title.
	 * This called from in makeBox.
	 * @param {Thread} thread information of thread.
	 */
	function makeTitle(thread) {
		$elm = $(thread.elm);
		$elm.removeAttr('href').attr('id', thread.tid).text('');
		if(thread.b_header) {
			$elm.html(
				'<span class="thread-no comb"><span>&nbsp;</span></span>'
				+'<span class="thread-spacer">&nbsp;<span><a class="item-title-base headline"><span class="item-title">'+thread.disp+'</span></a>'
				+'<span class="post-num"><span>(<span class="thread-num comb">&nbsp;</span>)</span></span>'
			);
			return;
		}
		var href = ''+thread.tid+'/';
		var no = (thread.no)? thread.no: '&nbsp;';
		var num = (thread.num)? thread.num: '&nbsp;';
		var title = ' title="'+thread.title+'"';
		var classes = '';
		if(thread.b_header) classes += ' headline';
		if(thread.marked) classes += ' marked';
		if(thread.bookmarked) classes += ' bookmarked';
		if(thread.num>=1000) classes += ' fulled';
		$elm.html(
			'<span class="thread-no comb"><a class="sub-link" href="'+href+'"'+title+'>'+no+'</a></span>'
			+'<span class="thread-spacer">&nbsp;<span><a class="item-title-base'+classes+'" href="'+href+'" data-idx="'+thread.idx+'"><span class="item-title">'+thread.disp+'</span></a>'
			+'<span class="post-num"><a class="sub-link" href="'+href+'"'+title+'>(<span class="thread-num comb">'+num+'</span>)</a></span>'
		);
		if(curItem && curItem.idx==thread.idx) {
			$elm.addClass('cur_item');
		}
	};

	/**
	 * Set setting tools on the footer bar.
	 */
	function setToolBox() {
		//	initial settings are in the mark.
		var mark = bookmarks.getPlaceMark(pageInfo);
		var initialData = {
			mark: false,
			order: settings.defaultOrder,
		};
		if(mark) {	//	if marked, 
			if(typeof mark==='object') {
				Storage.overWrite(initialData, mark);
			}
			footerBar.signal.switch(1, true);
		}
		/**
		 * Schema of tool box.
		 * @type {SettingTool.Schema}
		 */
		var schema = [
			{
				path: 'mark',
				type: 'switch',
				values: [{ value: true, label: __('Mark the board')},],
				help: __("Add the board to favorites. The board becomes more accessible.")
			},
			{
				path: 'order',
				type: 'rotary',
				label: __('Order'),
				values: [
					{ value: 'no', 	label: __('Original')},
					{ value: 'title', label: __('Title')},
					{ value: 'num', label: __('Post count')},
				],
				help: __("Order of threads.")
				+__("If you mark the board, this setting is stored.")
			},
		];

		var sortingcnt = 0;
		//	call create and callback when value changed.
		footerBar.createToolBox(initialData, schema, function(value, path) {
			var page_settings = this.getData();	//	get all data from settingTool.
			switch(path) {
				case 'mark':
				if(value) {
					bookmarks.markPlace(pageInfo, page_settings);
				} else {
					bookmarks.unmarkPlace(pageInfo);
				}
				footerBar.signal.switch(1, value);
				break;

				case 'order':
				onSortSwitch(value);
				if(page_settings.mark) bookmarks.markPlace(pageInfo, page_settings);
				break;
			}
		});
		return initialData;
	};
};