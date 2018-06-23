/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview read.cgi extention.
 * @since  2018.03.17  initial coding.
 */

/**
 * @typedef Post
 * @desc Infomation of a post.
 * @property {number} postid post ID
 * @property {string} userid user ID
 * @property {string} forcedid foreced ID (ﾜｯﾁｮｲ)
 * @property {string} ipaddr IP address or something
 * @property {Element} elm Element
 * @property {boolean} blocked True if blocked otherwise false.
 * @property {number[]} prev Array of post ID that the message anchor to. previous only.
 * @property {number[]} next Array of post ID that the message anchored from. following only.
 */

 /**
  * @typedef IdInfo
  * @desc Information of ID or forced ID. for counting posts.
  * @property {number} post_num Number of posts.
  * @property {string[]} userids List of user ID that the forced ID has. empty if the key is useer ID.
  */

/**
 * Extention for read.cgi
 */
function readcgi(){
	//	Sub globals

	/**
	 * all posts data in the page.
	 * keys area post ID, values area post data (Post).
	 * @type Post[]
	 */
	var posts = {};

	/**
	 * all data of user and forced ID.
	 * keys area those ID. values area ID data (IdInfo)
	 * @type IdInfo[]
	 */
	var ids = {};

	/**
	 * Serectors for post to use tools.
	 * @type {string[]}
	 */
	var post_selectors = ['.post', '.post_hover'];
	
	/**
	 * MediaPopup object.
	 * @type {MediaPopup}
	 */
	var mediaPopup = null;

	Storage.extend(pageInfo, {
		min_postid: 0,
		max_postid: 0,
		bookmark: 0,
	});
	//	CSS to add.
	var ADDITIONAL_CSS = {
		".container_body": {
			"width": "calc(100% - 8px)",
			"margin-right": "auto",
		},
		".footer": {
			"padding-top": 0,
		},
	};
	//	Regular expressions
	var regex_forcedid = /^(.*)\((([｡-ﾟ\w]+)\s([\!-~]{4})-([\!-~]{4}))(\s\[([\w\d\.\-_]+)(\s\[(.+)\])?\])?\)(.*)$/;
	var regex_part_url = /h?t?(tps?:\/)[\u2000-\u9FFF]?(\/[\w\/:%#\$&\?\(\)~\.=\+\-]*)[\u2000-\u9FFF]?([\w\/:%#\$&\?\(\)~\.=\+\-]+)/g;
	var selected_text;	// keep selected post temporaly
	//
	getVersion();
	var settings = applySettings(true);
	var blockList = new BlockList(storage, 'blockList');
	blockList.expire(storage.get('settings.blockDuration'));
	collectPosts();
	updateVisible();
	setBookmark();
	var initSet = setToolBox();
	bindHandlers();
	if(pageInfo.version && pageInfo.version[0]<7) {
		//	DOM is converted, the apply css
		settings = applySettings(true);
	}
	scrollToPosition();

	wall.show(false);
	var time = Date.now() - pageInfo.date;
	footerBar.text(
		__('%num% posts are there. The Ext. took %time% msec to prepare.')
		.fill({num: Object.keys(posts).length, time: time})
	);
	//
	function getVersion() {
		pageInfo.version = undefined;
		var regex_version = /read\.cgi\s+ver\s+([0-9\.]+)/;
		var version = $('.footer').text();
		if(version) {
			if(version.match(regex_version)) {
				version = RegExp.$1.split('.');
				pageInfo.version = version.map((x)=>{return Number(x);});
			}
			return;
		}
		$('body>div:nth-child(2)>span').contents().each(function(){
			if(this.nodeType!=3) return;
			version = $(this).text();
			if(version.match(regex_version)) {
				version = RegExp.$1.split('.');
				pageInfo.version = version.map((x)=>{return Number(x);});
				return false;
			}
		});
	}
	/**
	 * Scroll to proper position.
	 */
	function scrollToPosition() {
		var postid = 0;
		if(pageInfo.segment) {
			postid = Number(pageInfo.segment.split('-')[0]);
		} else if(pageInfo.bookmark) {
			postid = pageInfo.bookmark;
		}
		if(postid) footerBar.unitScroll.toItem('#'+postid, -1);
	}
	/**
	 * Bind event handlers for user events.
	 */
	function bindHandlers() {
		//	Add a board to hide others.
		//	when click, finish tree or list view and sliding formbox.
		wall.$elm.click(function(){
			treeView(false);
			$('.formbox').css('top', '').removeClass('floating');
		});
		footerBar.addShortCutKey('ESCAPE', '#wall');
		//	when get forcus check to reload stored settings.
		//	@todo should use storage event.
		$(window).on('focus', function(){
			storage.load(function() {
				settings = applySettings();
				updateVisible();			
				setBookmark();
			});
		});
		//	Links
		var $base = $('body');
		//	when click a link in post. 
		var selector = getPostSelector('a[href]');
		$base.on('click', selector, function(event){
			var href = this.href;
			var info = getPageInfo(href);
			//	if it is an anchor to another post, 
			if(settings.link.disableAnchor && info.id==Page.READCGI && info.bid===pageInfo.bid && info.tid===pageInfo.tid) {
				//	scroll to anchored post if exists, close tree view.
				var range = info.query.split('-');
				var postid = Number(range[0]);
				if(postid && (postid in posts)) {
					treeView(false);
					footerBar.unitScroll.toItems(posts[postid].elm);					
				} 
				event.preventDefault();
				return false;
			}
			//	otherwise just to jump
			if(href) {
				if(settings.link.direct && info.id == Page.JUMP) {
					href = info.search;
					if(href.substr(0,4)!=='http') {
						href = 'http://'+href;
					}
				}
				return jumpTo(href, settings.link.openNewTab, event);
			}
		});
		//	Media popup
		if(settings.media.enable) {
			mediaPopup = new MediaPopup({
				exp: 'body',
				delay: settings.media.delay,
				initWidth: settings.media.initWidth,
				initHeight: settings.media.initHeight,
				sizeAdjust: settings.media.sizeAdjust,
				autoplay: settings.media.autoplay,
				defaultAttach: settings.media.defaultAttach,
				headerHeight: footerBar.unitScroll.options.headerHeight,
				footerHeight: footerBar.unitScroll.options.footerHeight,
			});
			//	when cursor enter link,
			$base.on('mouseenter', selector, function(event) {
				//	parse url and call enter if it may url to media
				var url = $(this).attr('href');
				var info = extractUrl(url);
				if(info.host==='jump.5ch.net') {
					url = info.search;
					if(url.substr(0,4)!=='http') {
						url = 'http://' + url;
					}
				}
				var minfo = mediaPopup.getMediaInfo(url);
				if(minfo.enable) mediaPopup.enter(event, minfo);
			});
			$base.on('mouseleave', selector, function(event) {
				mediaPopup.leave(event);
			});
		}
		//	Controls for each post
		selector = getPostSelector('.post-tools');
		//	to popup post tool if right top mark
		if(settings.usePopup) {
			var postTool = createPostTools();
			$base.on('mouseenter', selector, function(event){
				var postid = Number($(this).data('id'));
				postTool.enter(event, posts[postid]);
			});
			$base.on('mouseleave', selector, function(event){
				var postid = Number($(this).data('id'));
				postTool.leave(event, posts[postid]);
			});
		}
		//	Erase text when leave elements in .post>.meta
		if(settings.useMetaCtrl) {
			selector = getPostSelector(['.uid', '.forcedid', '.make-tree']);
			//	delete info.
			$base.on('mouseleave', selector, function(event){
				footerBar.text('');
			});
			//	show count of messages when mouse is on ids. 
			selector = getPostSelector(['.uid', '.forcedid']);
			$base.on('mouseenter', selector, function(event){
				var userid = $(this).text();
				var info = ids[userid];
				footerBar.text(
					__('%id% posted %num% .')
					.fill({id:userid, num:info.post_num})
				);
			});
			//	List posts when click user ID and forced ID.
			$base.on('click', selector, function(event){
				var userid = $(this).text();
				var cat = ($(this).hasClass('uid'))? 'userid': 'forcedid';
				var postid = getPostId(this);
				if(!postid) return;
				treeView(cat, posts[postid]);
				event.preventDefault();
				return false;
			});
			//	show count for comment tree when point tree mark.
			selector = getPostSelector('.make-tree');
			$base.on('mouseenter', selector, function(event){
				var postid = getPostId(this);
				if(!postid) return;
				var ancestors=0, siblings=0, grandchildren=0, child_num=0;
				var post = posts[postid];
				if(post.prev && post.prev.length) {
					ancestors++;
					post = posts[post.prev[0]];
					if(post.next) siblings = post.next.length - 1;
					while(post.prev && post.prev.length) {
						ancestors++;
						post = posts[post.prev[0]];
					}
				}
				post = posts[postid];
				if(post.next && post.next.length) {
					child_num = post.next.length;
					for(var i=0; i<child_num; i++) {
						var child = posts[post.next[i]];
						if(child.next) grandchildren += child.next.length;
					}
				}
				var text = '';
				if(ancestors) text += __('%% ancestors, ').fill(ancestors);
				if(siblings) text += __('%% siblings, ').fill(siblings);
				if(child_num) text += __('%% children, ').fill(child_num);
				if(grandchildren) text += __('%% grandchildren, ').fill(grandchildren);
				text += __('the post has.');
				footerBar.text(text);
			});
			//	show tree view when click tree mark 
			$base.on('click', selector, function(event){
				var postid = getPostId(this);
				if(!postid) return;
				treeView('tree', posts[postid]);
				event.preventDefault();
				return false;
			});
		}
		//	Formbox
		//	when click submit
		$('.formbox form input[type="submit"]').click(function(event) {
			var map = footerBar.unitScroll.makeMap();
			var topitem = (map.in.length)? map.in[0]: (map.down)? map.down: map.up;
			var postid = null;
			if(topitem) {
				postid = topitem.elm.id;
				if(!postid) postid = pageInfo.max_postid;
			}
			//	save url to return present comment number.
			savePageInfo('post', postid);
		});
		//	if form sliding turned os,
		if(settings.form.slide) {
			//	add return icon on right top. 
			$('.formbox').append('<div class="post-tools"><div class="icon">&dtrif;</div></div>');
			//	return original place when click that mark.
			$('.formbox .post-tools').click(function(event) {
				$('.formbox').css('top', '').removeClass('floating');
			});
			selector = getPostSelector('.number');
			//	keep selected content to copy to textarea when hovered
			$base.on('mouseenter', selector, function(event) {
				selected_text = window.getSelection().toString();
			});
			$base.on('mouseleave', selector, function(event) {
				selected_text = '';
			});
			//	call function when clicked to slide form
			$base.on('click', selector, slideFormbox);
		}
		//
		/**
		 * Get selector for the parts in posts.
		 * @param {string|string[]} str selector(s) for the parts in posts.
		 */
		function getPostSelector(str) {
			if(str===undefined) return post_selectors.join(',');
			if(!(str instanceof Array)) str = [str];
			var rep = '';
			for(var i=0; i<post_selectors.length; i++) {
				for(var j=0; j<str.length; j++) {
					rep += rep? ',': '';
					rep += post_selectors[i] + ' ' + str[j];
				}
			}
			return rep;
		}
	}
	/**
	 * Get post ID from an element in the post.
	 * @param {Element} elm 
	 */
	function getPostId(elm) {
		var selector = post_selectors.join(',');
		var $post = $(elm).closest(selector);
		if($post.hasClass('post')) return $post[0].id;
		if($post.hasClass('post_hover')) return Number($post.attr('data-ha'));
		return 0;
	}

	/**
	 * Create post tools (popup menu)
	 */
	function createPostTools() {
		if(!settings.usePopup) return null;
		return new PostTool('body', function(data, scmd, event){
			switch(scmd) {
				case 'bookmark':
				//	Bookmark or Unbookmark the post
					setBookmark(data);
					break;
				case 'tree_view':
				//	Tree view.
					treeView('tree', data);
					break;
				case 'list_userid':
				case 'list_forcedid':
				//	List of posts for specific user ID or forced ID.
					var cat = scmd.substr(scmd.lastIndexOf('_') + 1);
					treeView(cat, data);
					break;
				case 'block_userid':
				case 'block_forcedid':
				//	Block or Unblock user by user ID or forced ID.
					var cat = scmd.substr(scmd.lastIndexOf('_') + 1);
					var to_block = data.blocked? false: true;
					if(to_block) {
						blockList.block(cat, data[cat]);
						//	When there is no unblocked and listed post, end tree view.
						if(!$('.listed-item:not(.blocked)')[0]) {
							treeView(false);
						}
					} else {
						blockList.unblock(cat, data[cat]);
					}
					updateVisible(cat, data[cat]);
					break;
				case 'copy':
					var $text = $('.formbox textarea:first');
					if(!$text[0]) {
						$('body').append('<div class="formbox" style="height:0"><textarea><textarea></div>');
						$text = $('.formbox textarea:first');
					}
					var form_str = $text.val();
					var meta = $('.meta .number:first', data.elm).text() + ' ';
					meta += $('.meta .name:first', data.elm).text() + ' ';
					meta += $('.meta .date:first', data.elm).text() + ' ';
					meta += $('.meta .uid:first', data.elm).text() + '\r\n';
					var message = $('.message:first>span', data.elm).html();
					message = message.replace(/\s*<[bh]r\s*\/?>\s*/ig, '\r\n');
					message = $('<span>'+message+'</span>').text();
					message = message.replace(/^\s+|\s+$/g, '');
					$text.val(meta+message+'\r\n');
					$text[0].select();
					var ret = document.execCommand('copy');
					$text.val(form_str);
					if(ret) footerBar.text(__("Copy the post #%%").fill(data.postid));
					break;
			}
		}, null, blockList);
	}

	/**
	 * Update visible or invisible by whether blocked.
	 * Arguments are to specify posts to be checked.
	 * When arguments are omitted, check all posts.
	 * @param {string} [cat] category. 'userid' or 'forcedid' 
	 * @param {string} [sid] ID.
	 */
	function updateVisible(cat, sid) {
		for(var id in posts) {
			var post = posts[id];
			if(cat && post[cat]!==sid) continue;
			var blocked = blockList.isBlockedPost(post);
			if(blocked && !post.blocked) {
				post.blocked = true;
				$(post.elm).addClass('blocked');
				$('.message', post.elm).addClass('blocked');
				$('.meta', post.elm).addClass('blocked');
			} else if(!blocked && post.blocked) {
				post.blocked = false;
				$(post.elm).removeClass('blocked');
				$('.blocked', post.elm).removeClass('blocked');
			}
		}
		//	update elm list.
		footerBar.unitScroll.unitExp(readcgiUnitExp);
	}	
	
	/**
	 * Slide formbox under the clicked post.
	 * @param {MouseEvent} event
	 */
	function slideFormbox(event){
		var $post = $(this).closest(post_selectors.join(','));
		var postid = getPostId($post[0]);
		
		var $form = $('.formbox:first');
		var $button = $('input[type="submit"]', $form);
		$form.addClass('floating');
		//	move formbox
		var dest_top = $post.offset().top + $post[0].offsetHeight - 8;
		var item_top = $form.offset().top - parseInt($form.css('top'));
		$form.css('top', ''+(dest_top - item_top)+'px');
		//	scroll to show
		var scroll_to = dest_top + $button.offset().top - $form.offset().top + $button[0].offsetHeight;
		var win_h = footerBar.unitScroll.windowHeight();
		if(scroll_to > window.pageYOffset + win_h) {
			footerBar.unitScroll.toY(scroll_to - win_h);
		}
		//	anchor to the post
		$textarea = $('textarea:first', $form);
		var text = $textarea.val();
		var regex_anc = new RegExp('>>'+postid+'(?!\\d)');
		if(!text.match(regex_anc)) {
			text = text.replace(/\s+$/, '');
			if(text) {
				if(text.match(/>>\d{1,3}$/)) text += ' ';
				else text += '\r\n';
			}
			text += '>>' + postid + '\r\n';
		}
		//	quotate selected text
		if(selected_text) {
			if(!text.match(/(\r\n|\r|\n)$/)) text += '\r\n';
			selected_text = selected_text.replace(/^\s+|\s+$/g, '');
			text += settings.form.quotSymbol;
			text += selected_text.replace(/\r\n|\n|\r/g, '\r\n'+settings.form.quotSymbol);
			text += '\r\n';
		}
		$textarea.val(text);
		event.preventDefault();
		return false;
	}
	/**
	 * Apply stored setting when initialize or settings are updated.
	 * @param {boolean} b_init Initialize or not.
	 * @return {object} settings
	 */
	function applySettings(b_init) {
		var settings = storage.get('settings.readcgi');
		//	set transition of posts and formbox
		if(settings.animate) {
			var post_transition = 'top '+settings.animationDuration+'ms ease-in-out,'
			+' left '+settings.animationDuration+'ms ease-in-out';
			$('.post').css('transition', post_transition);
			$('.formbox').css('transition', post_transition);
		} else if(!b_init) {
			$('.post').css('transition', 'initial');
			$('.formbox').css('transition', 'initial');
		}
		//	hide whole or show part of bolocked posts
		if(!settings.hideBlocked) {
			$('.thread').addClass('show_blocked');
		} else if(!b_init) {
			$('.thread').removeClass('show_blocked');
		}
		//	set additional CSS
		if(settings.extendCss) {
			for(var exp in ADDITIONAL_CSS) {
				$(exp).css(ADDITIONAL_CSS[exp]);
			}
		} else if(!b_init) {
			for(var exp in ADDITIONAL_CSS) {
				for(var key in ADDITIONAL_CSS[exp]) {
					$(exp).css(key, '');
				}
			}
		}
		//	when show footerBar,
		if(footerBar.options.exp) {
			footerBar.unitScroll.options.headerHeight = 0;
			//	Make header nav to be static position
			$('nav.navbar-fixed-top').css({
				position: 'static',
				height: 0,
			});
		} else {
			//	set header space
			footerBar.unitScroll.options.headerHeight = 20;
			if(!b_init) $('nav.navbar-fixed-top').css({
				position: '',
				height: '',
			});
		}
		//	Formbox
		//	set max-width
		$('.formbox').css('max-width', ''+settings.form.maxWidth+'px');
		//	write sage
		if(settings.form.fillSage) {
			$('input[name="mail"]').val('sage');
		}
		//	make name and email fieald small
		if(settings.form.smallFields) {
			$('.formbox').addClass('small-height');
		} else  if(!b_init) {
			$('.formbox').removeClass('small-height');
		}
		if(posts.length) setBookmark();	
		//	media popup
		if(mediaPopup) {
			mediaPopup.setOptions({
				delay: settings.media.delay,
				initWidth: settings.media.initWidth,
				initHeight: settings.media.initHeight,
				sizeAdjust: settings.media.sizeAdjust,
				autoplay: settings.media.autoplay,
				defaultAttach: settings.media.defaultAttach,
				headerHeight: footerBar.unitScroll.options.headerHeight,
				footerHeight: footerBar.unitScroll.options.footerHeight,
			});
		}
		
		return settings;
	}

	/**
	 * Collect posts data then set in 'posts'
	 */
	function collectPosts() {
		//	make document fragment
		$thread = $('.thread:first');
		if(!$('#thread-mark')[0]) $thread.before('<div id="thread-mark"></div>');
		var $frag = $(document.createDocumentFragment());
		$frag.append($thread);
		if(pageInfo.version && pageInfo.version[0]<7) {
			convertDom($frag);
		}
		//	for each post,
		$('.post', $frag).each(function(){
			//	make post data then set in posts
			var post = makeAPostData(this);
			var postid = post.postid;
			posts[postid] = post;
			//	count each user's post on ids.
			if(!(post.userid in ids)) {
				ids[post.userid] = { post_num:0 };	
			}
			ids[post.userid].post_num++;
			//	count about forced ID
			if(post.forcedid) {
				if(!(post.forcedid in ids)) {
					ids[post.forcedid] = { post_num:0, userids:[] };	
				}
				ids[post.forcedid].post_num++;
				ids[post.forcedid].userids.push(post.userid);
			}
			post.blocked = false;	//	initial
		});
		//	for each post
		for(var postid in posts) {
			var post = posts[postid];
			//	add post tools icon
			if(settings.usePopup) {
				$(post.elm).append('<div class="post-tools" data-id="'+postid+'">'
				+'<span class="icon">&equiv;</span></div>');
			}
			var $meta = $('.meta:first', post.elm);
			//	tree icon
			if(settings.useMetaCtrl) {
				if((post.prev && post.prev.length) 
				|| (post.next && post.next.length)) {
					$meta.append(
						'<span class="make-tree">'
						+'<span class="icon">&clubs;</span></span>'
					);
				}
			}
			//	color ID
			if(settings.colorId) {
				$('.uid:first', $meta).css(
					'background-color', str2color(post.userid.substr(3))
				).addClass('colored');
			}
			//	bloken or hidden URL
			if(settings.link.correct) {
				var $msg = $('.message>span', post.elm);
				$('a', $msg).each(cutQuery);
				$msg.contents().each(immatureUrl);
			}
		}
		//	show posts.
		$('#thread-mark').after($frag);
		//
		/**
		 * correct cut query at '&' in link.
		 */
		function cutQuery() {
			var href = this.href;
			if(this.nextSibling && this.nextSibling.nodeType==3) {
				var nextText = $(this.nextSibling).text();
				var c = nextText.charAt(0);
				if('!$&\'()*+,;=~:@'.indexOf(c)>=0) {
					for(var i=0; i<nextText.length; i++) {
						var c = nextText.substr(i,1);
						if(c.charCodeAt(0)<=32) break;
						href += c;
					}
				}
			}
			this.href = href;
		}
		/**
		 * make link about immature url ex. 'ttp:' or containing none ascii char.
		 */
		function immatureUrl() {
			if(this.nodeType==3) {
				var text = $(this).text();
				text = text.replace(regex_part_url, function(match, p1, p2, p3) {
					var url = 'ht'+p1+p2+p3;
					return '<a href="'+url+'" title="'+url+'">'+match+'</a>';
				});
				$(this).before(text);
				$(this).remove();
			}
		}
	}
	/**
	 * Make a post information
	 * @param {Element} elm 
	 * @return {Post} post information
	 */
	function makeAPostData(elm) {
		var postid = Number(elm.id);
		post = {
			postid: postid,
			prev: null,
			next: null,
			elm: elm,
		};
		//	update max and min on pageInfo. first post is excluded
		if(postid!=1 && (pageInfo.min_postid==0 || postid<pageInfo.min_postid)) pageInfo.min_postid = postid;
		if(pageInfo.max_postid<postid) pageInfo.max_postid = postid;
		//	user ID
		post.userid = $(elm).attr('data-userid');
		//	forced ID (ﾜｯﾁｮｲ)
		post.forcedid = null;
		post.ipaddr = null;
		$('.meta>.name:first', elm).contents().each(getForcedId);
		$('.message a', elm).each(collectLinks);
		return post;
		//
		/**
		 * get forced ID
		 */
		function getForcedId(){
			var m, text;
			//	it may in element or string.
			if(this.nodeType==1) text = $(this).html();
			else if(this.nodeType==3) text = $(this).text();
			else return;
			//	if match pattern for forced ID,
			if((m = text.match(regex_forcedid))) {
				m = m.map((x)=>{return (x===undefined)? '': x});
				//	get forced ID and IP
				post.forcedid = m[2];
				post.ipaddr = m[7];
				//	set tags for colored ID.
				if(settings.colorId || settings.useMetaCtrl) {
					if(settings.colorId) {
						//	first segment, second, and IP segment
						styles = [m[4],m[5],m[7]];
						styles = styles.map(function(x){
							return ' style="background-color:'+str2color(x)+';"';
						});
						colored = ' colored';
						//	tagged html
						text = m[1]+'(<span class="forcedid'+colored+'">'
						+'<span class="frag-1">'+m[3]+'</span>'
						+' <span class="frag-2"'+styles[0]+'>'+m[4]+'</span>'
						+'-<span class="frag-3"'+styles[1]+'>'+m[5]+'</span></span>';
						if(post.iparrd) text += ' [<span class="ipaddr'+colored+'"'+styles[2]+'>'+m[7]+'</span>]';
						text += m[8]+')'+m[10];
					} else {
						text = m[1]+'(<span class="forcedid">'
						+m[3]+' '+m[4]+'-'+m[5]+'</span>';
						if(post.iparrd) text += ' [<span class="ipaddr">'+m[7]+'</span>]';
						text += m[8]+')'+m[10];
					}
					//	set in content.
					if(this.nodeType==1) {
						$(this).html(text);
					} else if(this.nodeType==3) {
						$(this).before(text);
						$(this).remove();
					}
				}
				return false;	//	to stop loop.
			}
		}
		/**
		 * collect back links in message
		 */
		function collectLinks() {
			var href = $(this).attr('href');	//	cannot be this.href 
			var postid = post.postid;
			//	if an ancor to another post,
			if(href.substr(0,3)==='../') {
				var refs = href.substr(href.lastIndexOf('/')+1);
				//	 at first, get range.
				//	it may '>>num' or '>>num-num', so ref has it's range.
				refs = refs.split('-');
				refs = refs.map((x)=>{ return parseInt(x); });
				if(refs.length<2) refs[1] = refs[0];
				//	loop for range
				for(var ref=refs[0]; ref<=refs[1]; ref++) {
					//	add post ID to prev or next property to know anchoring.
					if(ref in posts) {
						if(post.prev===null) post.prev = [];
						post.prev.push(ref);
						var prev = posts[ref];
						if(prev.next===null) prev.next = [];
						prev.next.push(postid);
					}
				}
			}
		};
	}
	/**
	 * get spesific color from string.
	 * @param {string} str ascii string
	 * @return {string} color expression 
	 */
	function str2color(str) {
		if(!str) return 'hsl(0,0%,0%)';
		//	get bits for all string
		var bits = '';
		for(var i=0; i<str.length; i++) {
			var c = str.charCodeAt(i);
			bits += ('0000000'+c.toString(2)).substr(-7);
			//	7 bits because ASCII only.
		}
		//	split to fragments. 1st and 2nd are for hue, rest is saturation and blightness.
		var flen = bits.length / 4;
		var frag = [
			bits.substr(0,flen), 
			bits.substr(flen,flen), 
			bits.substr(flen*2,flen),
			bits.substr(flen*3), 
		];
		//	convert each frag. number. max. is 1. 
		frag = frag.map(function(x){
			return parseInt(x, 2) / (Math.pow(2, x.length)-1);
		});
		//	get hsl values.
		var hsl = [];
		hsl[0] = ((frag[3]+frag[2]) % 1) * 360;
		hsl[1] = triangle(frag[1]) * 100;
		hsl[2] = frag[0] * 50 + 50;
		hsl = hsl.map(function(x){ return Math.floor(x) });
		return 'hsl('+hsl[0]+','+hsl[1]+'%,'+hsl[2]+'%)';
		//
		/**
		 * triangle function. 50% is the peak.
		 * @param {number} x 
		 */
		function triangle(x) {
			return ((x<.5)? x: (1-x)) * 2;
		}
	}
	/**
	 * Set bookmark and apply for appearance
	 * @param {Post} data Information of post to bookmark. If ommited, apply stored bookmark.
	 */
	function setBookmark(data) {
		var marks = bookmarks.getBookmarks(pageInfo);
		b_set = false;
		$('.post.bookmark').removeClass('bookmark');
		if(!data) {
			//	initial setting
			//	set class for existing bookmark.
			if(marks && (marks[0].postid in posts)) {
				data = posts[marks[0].postid];
				$(data.elm).addClass('bookmark');
				b_set = true;
			}
		} else {
			//	when set new bookmark.
			//	clear to allow one bookmark for a thread.
			bookmarks.clearPlace(pageInfo, true);
			//	if new bookbark is not existsing bookmark,
			if(!marks || data.postid!=marks[0].postid) {
				//	set as new bookmark.
				$(data.elm).addClass('bookmark');
				var markdata = Storage.overWrite({
					postid: 0, userid: '', forcedid: '', piaddr: ''
				},data);
				bookmarks.set(pageInfo, data.postid, markdata);
				b_set = true;
			} else {
				bookmarks.checkDeletePlace(pageInfo);
				bookmarks.save();
			}
		}
		//	apearance
		$buttons = $('.nav-to-bookmark, .nav-update-bookmark', footerBar.$elm);
		if(b_set) {
			//	turn signal on and enable bottons of footerBar.
			footerBar.signal.switch(2, true);
			$buttons.removeClass('disabled');
			pageInfo.bookmark = data.postid;
		} else {
			//	turn signal off and disable bottons of footerBar.
			footerBar.signal.switch(2, false);
			$buttons.addClass('disabled');
			pageInfo.bookmark = null;
		}
	}

	/**
	 * Make list of posts by specific user for tree(list) view.
	 * @param {string} cat Category. 'userid' or 'foecedid'
	 * @param {string} sid ID value 
	 * @param {number} postid post ID of current post.
	 * @return {number[]} List of post ID of the user.
	 */
	function makeList(cat, sid, postid) {
		var list = [];
		//	collect the user's post.
		//	upper posts order is descending.
		for(var i=postid-1; i>=pageInfo.min_postid; i--) {
			if(posts[i] && posts[i][cat]===sid) list.push(i);
		}
		//	lower posts order is ascending.
		for(var i=postid; i<=pageInfo.max_postid; i++) {
			if(posts[i] && posts[i][cat]===sid) list.push(i);
		}
		return list;
	}
	/**
	 * Make list of posts in tree for tree view.
	 * @param {number} postid post ID of current post 
	 * @param {TreeMember[]} treeinfo [output] object to store information of posts in tree. 
	 * @return {number[]} List of post ID of the tree.
	 */
	function makeTreeList(postid, treeinfo) {
		var cur_id = postid;
		//	back to the root post of the tree
		while(posts[postid].prev) {
			var prev = posts[postid].prev[0];
			if(!posts.hasOwnProperty(prev)) break;
			postid = prev;
		}
		//	make treeinfo and list.
		var list = [];
		var b_forward = false;	//	flag to add a info to list in descending order.
		makeNexts(postid);
		return list;
		//
		/**
		 * make treeinfo after the post.
		 * @param {number} postid post ID
		 */
		function makeNexts(postid) {
			//	check exsist
			if(postid in treeinfo) return;
			//	make and add information for tree. 
			addTreeInfo(treeinfo, postid);
			//	if it is current post, to be in ascending order.
			if(cur_id==postid) b_forward = true;
			//	add to list
			b_forward? list.push(postid): list.unshift(postid);
			//	do same process for children.
			var nexts = posts[postid].next;
			if(!nexts) return;
			for(var i=0; i<nexts.length; i++) {
				makeNexts(nexts[i]);
			}
			return;
		}
	}
	/**
	 * @typedef TreeMember
	 * @desc Information for a post in tree
	 * @property {number} postid Post ID
	 * @property {number} level Indent level of the post
	 * @property {number} next_level Indent level of posts next of the post
	 * @property {boolean} bRoot is root of the tree
	 * @property {boolean} hasChildren has two or more children posts that anchor to the post
	 * @property {boolean} hasBrother has sibling post that anchor to same post
	 */
	/**
	 * Add information of the post to list. 
	 * @param {TreeMember[]} treeinfo List to add info.
	 * @param {number} postid 	post ID
	 */
	function addTreeInfo(treeinfo, postid) {
		var post = posts[postid];
		var prev = null;
		/**
		 * @type TreeMember
		 */
		var info = {
			postid:postid, level: 0, next_level: 1, bRoot: false, 
			hasChildren: false, hasBrother: false
		};
		if(!('start' in treeinfo)) {
			//	post at first call is root because there may not be original root.
			treeinfo.start = postid;
			info.bRoot = true;
		} else {
			if(!post.prev || post.prev.length==0) {	//	original root
				info.bRoot = true;
			} else {	//	not root.
				//	get previous post anchored from this.
				var prep_post = posts[postid];
				for(var i=0; !prev; i++) {
					prev = treeinfo[prep_post.prev[i]];
				}
				//	get this level and this has siblings or not.
				info.level = prev.next_level;
				if(prev.hasChildren) info.hasBrother = true;
			}
		}
		//	decide level of children that anchor to this.
		//	initialy next level is indented than this level.
		info.next_level = info.level + 1;
		//	if there's no next posts,
		if(!post.next || post.next.length==0) {
			//	next level is zero.
			info.next_level = 0;
		} else if(post.next.length==1) {	//	if this has only one child,
			//	if there is no siblings, next level is the same because not to so deep indent.
			if(prev && !info.hasBrother) {
				info.next_level = info.level;
			}
		} else {	//	if this has two or more children,
			info.hasChildren = true;
		}
		treeinfo[postid] = info;
	}

	/**
	 * Show tree or list view.
	 * @param {string|false} cat category 'tree', postid' or 'forcedid'.
	 * 	If false, close tree view.
	 * @param {Post} data Information of current post
	 */
	function treeView(cat, data) {
		//	if cat is false or empty value, finish tree view.
		if(typeof cat!=='string' && !cat) {
			if(prepList.minthread_cur) {	//	if the tree view has opend.
				//	close and scroll to original place.
				prepList(false);
				scrollOnTreeView(false);
			}
			return;
		}
		//	make tree view.
		var cur_id = data.postid;
		var list;
		if(cat==='tree') {
			//	Tree view.
			//	Make list, prepare for view, then add indent to posts.
			var treeinfo = {};
			list = makeTreeList(cur_id, treeinfo);
			prepList(true, cur_id, list);
			alignIndent(treeinfo);
		} else {
			//	List view.
			list = makeList(cat, data[cat], cur_id);
			prepList(true, cur_id, list);
		}
		//	get place of current post.
		var $cur = $(data.elm);
		var cur_top = $cur.offset().top;
//		var cur_bottom = cur_top + $cur.outerHeight(true);	I do not trust...
		var cur_bottom = cur_top + $cur[0].offsetHeight + 8;
		var cur_rect = {
			top: cur_top, bottom: cur_bottom, left: 0, right: 0
		}
		//	decide place of each post.
		var indent = 0;
		var b_prev = true;	//	at first, decide upper posts.
		var elm_list = [];	//	list of elements
		for(var i=0; i<list.length; i++) {
			//	get the element.
			var postid = list[i];
			var $item = $(posts[postid].elm);
			//	if it is the current post,
			if(postid==cur_id) {
				elm_list.push($item[0]);
				b_prev = false;	//	change flag for following posts.
				continue;
			}
			//	decide place.
			var topval = parseInt($item.css('top'));
			var item_top = $item.offset().top - topval;
//			var item_height = $item.outerHeight(true);
			var item_height = $item[0].offsetHeight + 8;
			var dest_top = cur_bottom;
			if(b_prev) {	//	upper post
				dest_top = cur_top = cur_top - item_height;
				elm_list.unshift($item[0]);
			} else {	//	follorgin post
				elm_list.push($item[0]);
				cur_bottom += item_height;
			}
			$item.addClass('listed-item').css('top', ''+(dest_top - item_top)+'px');
		}
		//	Popup Formbox
		$('.formbox').addClass('floating');
		//	Pass calcurated rect because it may be animating.
		var whole_rect = {
			top: cur_top, bottom: cur_bottom, left: 0, right: 0
		}
		scrollOnTreeView(elm_list, whole_rect, cur_rect);
	}

	/**
	 * Set indent level to posts in tree view.
	 * @param {TreeMember[]} treeinfo 
	 */
	function alignIndent(treeinfo) {
		//	for each post
		for(var postid in treeinfo) {
			if(isNaN(postid)) continue;
			//	get the element, posision, and set.
			var info = treeinfo[postid];
			var $item = $(posts[postid].elm);
			var left = info.level * settings.indentSize;
//			var width = $item.innerWidth() - left;
			var width = $item[0].offsetWidth - left;
			if(width<settings.minPostWidth) {
				width = settings.minPostWidth;
				left = $item[0].offsetWidth - width;
			}
			$item.css({width:width, left: left});
			//	Add linking symbol if not exist.
			if(!info.bRoot) {
				$link = $('.linking', $item);
				if(!$link[0]) {	//	add if not exist
					var s_class = 'linking';
					if(info.hasBrother) s_class += ' link-hasbro';
					$item.append('<div class="'+s_class+'">'
						+'<div class="chain"></div>'
						+'</div>');
				} else {	//	just show if exists
					$link.removeClass('hidden');
				}
			}
		}
	}

	/**
	 * Prepare or finish tree view.
	 * @param {boolean} b_prep Flag to prepare or finish 
	 * @param {number} cur_id Post ID of current post
	 * @param {number[]} list List of post ID
	 */
	function prepList(b_prep, cur_id, list) {
		if(b_prep) {
			//	Prepare tree view.
			var topval = {};
			//	if currently be in tree view,
			if(prepList.minthread_cur) {
				//	reset position of posts in current view.
				reset(false);
				$('.listed-item').each(function(){
					//	set new top if it in the list, otherwith get current top.
					var postid = Number(this.id);
					if(list.indexOf(postid)<0) {
						$(this).css({top:0, left:0, width: ''})
						.removeClass('listed-item');
					} else {
						topval[postid] = $(this).css('top');
					}
				});
			}
			//	show wall
			wall.show(true);
			//	for each post in the list,
			for(var i=0; i<list.length; i++) {
				//	set or reset position.
				var top = '0px';
				var pid = list[i];
				if(pid in topval) top = topval[pid];
				$(posts[pid].elm).addClass('listed-item')
				.css({top:top, left:0, width:''});
			}
			//	add current mark and store id.
			$(posts[cur_id].elm).addClass('tmp-marked');
			prepList.minthread_cur = cur_id;

		} else {	//	Finish tree view
			reset();
			//	reset all position of postsand hide wall.
			$('.listed-item').css({top:0, left:0, width: ''})
				.removeClass('listed-item');
			wall.show(false);
			prepList.minthread_cur = 0;
		}
		//
		/**
		 * Reset process to need both of preparaion and finish.
		 */
		function reset() {
			$('.tmp-marked').removeClass('tmp-marked');
			$('.linking').addClass('hidden')
			.css('background-color', 'rgba(0,0,0,0)');
		}
	}
	/**
	 * Current post id in the tree. Or flag whether in tree view or not.
	 * @type {number} post ID
	 */
	prepList.minthread_cur = 0;

	/**
	 * Scroll to appropriate position when in tree view.
	 * Each post might be moving, so this function needs to know calcurated rectangle value to scroll to.
	 * @param {Element[]|null} elm_list List of element of posts in the view.
	 * 	if null or undefined, back to original position.
	 * @param {Rect} whole_rect Rectangle containing posts
	 * @param {Rect} cur_rect Rectangle of current post.
	 */
	function scrollOnTreeView(elm_list, whole_rect, cur_rect) {
		//	if undefined,
		if(!elm_list) {
			//	Set original list of element.			
			footerBar.unitScroll.unitExp(readcgiUnitExp, scrollOnTreeView.elm_list);
			//	Back to original position.
			footerBar.unitScroll.toY(scrollOnTreeView.org_y);
			scrollOnTreeView.org_y = null;
			return;
		}
		//	if currently not be in tree view,
		if(scrollOnTreeView.org_y===null) {
			//	hold position and list of element.
			scrollOnTreeView.org_y = window.pageYOffset;
			scrollOnTreeView.elm_list = footerBar.unitScroll.elmList();
		}
		//	Set list of element to unitScroll and scroll to the rect.
		footerBar.unitScroll.unitExp('.listed-item', elm_list);
		footerBar.unitScroll.toRect(whole_rect, cur_rect, false);
	}
	/**
	 * Scroll posision before tree view.
	 * @type {number}
	 */
	scrollOnTreeView.org_y = null;
	/**
	 * Element list that unitScroll has.
	 * Also the flag whether in tree view or not.
	 * Making list of element in unitScroll takes costs, so hold and back to.
	 * @type {Element[]}
	 */
	scrollOnTreeView.elm_list = null;

	/**
	 * @typedef Readcgi.Setting
	 * @desc Sub setting data for read.cgi 
	 * @property {boolean} mark The thread is marked or not.
	 */
	/**
	 * Set sub setting tool box on the footer bar.
	 * @return {Readcgi.setting} initial settings.
	 */
	function setToolBox() {
		//	get mark of the thread.
		var mark = bookmarks.getPlaceMark(pageInfo);
		/**
		 * initial values of sub setting.
		 * @type {Readcgi.setting}
		 */
		var initialData = {
			mark: false,
		};
		//	if marked, get saved data from bookmark.
		if(mark) {
			if(typeof mark==='object') {
				Storage.overWrite(initialData, mark);
			}
			footerBar.signal.switch(1, true);
		}
		/**
		 * sub setting schema
		 * @type {SettingTool.schema}
		 */
		var schema = [
			{
				path: 'mark',
				type: 'switch',
				values: [{ value: true, label: __('Mark the thread')},],
				help: __("Add the thread to favorites. The thread becomes more accessible.")
			},
		];

		//	create setting tool box and it's callback
		footerBar.createToolBox(initialData, schema, function(value, path) {
			var page_settings = this.getData();	//	this = settingTool
			switch(path) {
				case 'mark':
				//	switch mark of the thread and signal
				if(value) {
					bookmarks.markPlace(pageInfo, page_settings);
				} else {
					bookmarks.unmarkPlace(pageInfo);
				}
				footerBar.signal.switch(1, value);
				break;
			}
		});
		return initialData;
	};
	function convertDom($frag) {
		var $thread = $('<div class="thread"></div>');
		$frag.append($thread);
		var $post = null;
		$('dl', $frag).children().each(function() {
			if(this.tagName==='DT') {
				$post = $('<div class="post"><div class="meta"></div><div class="message"></div></div>');
				var $meta = $('.meta', $post);
				var id;
				var b_name = false;
				$(this).contents().each(function(){
					if(this.nodeType==1) {
						if(!b_name) {
							$(this).addClass('name');
							b_name = true;
						}
						$meta.append(this);
					} else if(this.nodeType==3 && this.textContent) {
						if(!$post[0].id && (id = parseInt(this.textContent))) {
							$post[0].id = id;
							$meta.append('<span class="number">'+id+'</span>');
						} else if((m = this.textContent.match(/(.*)ID:([^\s]+)(.*)/))) {
							$meta.append(m[1])
							.append('<span class="uid">ID:'+m[2]+'</span>')
							.append(m[3]);
							$post.attr('data-userid', 'ID:'+m[2]);
						} else {
							$meta.append(this.textContent);
						}
					}
				});
				if(!$post.attr('data-userid')) {
					$meta.append('<span class="uid">Thread</span>');
					$post.attr('data-userid', 'Thread');
				}
			} else if(this.tagName==='DD') {
				if($post) {
					$message = $('<span class="escaped"></span>');
					$('.message', $post).append($message);
					var br = [];
					$(this).contents().each(function(){
						if(this.nodeType==1 && this.tagName=='BR') {
							br.push(this);
						} else if(this.textContent!=='\n') {
							while(br.length) $message.append(br.pop());
							$message.append(this);
						}
					});
					$thread.append($post).append('<br/>');
				}
				$post = null;
			}
		});
		$('dl', $frag).remove();
		$('.thread', $frag).addClass('old_version');
		$('body').css({
			'background-color': '#f2f3f7',
			'font-size': '14px',
		});
		$('body>div:nth-child(2)>span').css({
			'display': 'block',
			'max-width': 'calc(100% - 8px)',
		}).addClass('container_body');
	}
};
