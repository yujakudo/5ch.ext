/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Class of popupmenu at each post
 * @since  2018.03.17  initial coding.
 */

/**
 * Class of popup menu at each post.
 * @constructor
 * @param {string} exp Selector expression to attach popup.
 * @param {function} callback Callback called when command is selected.
 * @param {*} obj_this Value of this in the callback.
 * @param {BlockList} blockList Block list object.
 */
var PostTool = function(exp, callback, obj_this, blockList) {
	PopupBox.call(this, {
		attach: 'bottom',
		align: 'right',
		exp: exp,
		applyFunc: 'append',
		callback: callback,
		this: obj_this,
		headerHeight: footerBar.unitScroll.options.headerHeight,
		footerHeight: footerBar.unitScroll.options.footerHeight,
	});
	this.blockList = blockList;
};

PostTool.prototype = $.extend({}, PopupBox.prototype);

/**
 * Render popup
 */
PostTool.prototype.render = function() {
	this.$elm = $('<ul class="posttool">'
		+'<li class="sw_bookmark">Bookmark</li>'
		+'<li class="tree_view">'+__('Tree view')+'</li>'
		+'<li class="list_forcedid" >List </li>'
		+'<li class="list_userid">List </li>'
		+'<li class="copy_post">'+__('Copy')+'</li>'
		+'<li class="block_forcedid" >Block </li>'
		+'<li class="block_userid" >Block </li>'
		+'</ul>'
	);
};

/**
 * Bind handlers.
 */
PostTool.prototype.bind = function() {
	var obj_this = this.options.this;
	var callback = this.options.callback;
	$('li.sw_bookmark', this.$elm).click((event)=>{
		callback.call(obj_this, this.post, 'bookmark', event);
		this.close();
	});
	$('li.tree_view', this.$elm).click((event)=>{
		callback.call(obj_this, this.post, 'tree_view', event);
		this.close();
	});
	$('li.list_userid', this.$elm).click((event)=>{
		callback.call(obj_this, this.post, 'list_userid', event);
		this.close();
	});
	$('li.list_forcedid', this.$elm).click((event)=>{
		callback.call(obj_this, this.post, 'list_forcedid', event);
		this.close();
	});
	$('li.copy_post', this.$elm).click((event)=>{
		callback.call(obj_this, this.post, 'copy', event);
		this.close();
	});
	$('li.block_userid', this.$elm).click((event)=>{
		callback.call(obj_this, this.post, 'block_userid', event);
		this.close();
	});
	$('li.block_forcedid', this.$elm).click((event)=>{
		callback.call(obj_this, this.post, 'block_forcedid', event);
		this.close();
	});
};

/**
 * Procedure when opened.
 * Set view for each post.
 * @param {Event} event event object 
 * @param {Post} post information of post.
 */
PostTool.prototype.openBox = function(event, post) {
	this.post = post;
	$('li', this.$elm).addClass('hidden');
	$('li.copy_post', this.$elm).removeClass('hidden');
	if(!post) return;
	if(!post.blocked) {
		$('li.sw_bookmark', this.$elm).removeClass('hidden');
		block_text = 'Block ';
		if((post.next && post.next.length) || (post.prev && post.prev.length)) {
			$('li.tree_view', this.$elm).removeClass('hidden');
		}
		if(post.userid && post.userid!=='0')	{
			$('li.list_userid', this.$elm).removeClass('hidden');
		}
		if(post.forcedid) {
			$('li.list_forcedid', this.$elm).removeClass('hidden');
		}
	}

	var marks = bookmarks.getBookmarks(pageInfo);
	if(marks && marks[0].postid==post.postid) {
		$('li.sw_bookmark', this.$elm).text(__('Unbookmark'));
	} else {
		$('li.sw_bookmark', this.$elm).text(__('Bookmark'));
	}

	$('li.list_userid', this.$elm).text(__('List %%').fill(post.userid));
	$('li.list_forcedid', this.$elm).text(__('List %%').fill(post.forcedid));
	if(post.userid && post.userid!=='0')	{
		var block_text = (this.blockList.isblocked('userid', post.userid))? __('UnBlock %%'): __('Block %%');
		$('li.block_userid', this.$elm)
		.removeClass('hidden').text(block_text.fill(post.userid));
	}
	if(post.forcedid) {
		block_text = (this.blockList.isblocked('forcedid', post.forcedid))? __('UnBlock %%'): __('Block %%');
		$('li.block_forcedid', this.$elm)
		.removeClass('hidden').text(block_text.fill(post.forcedid));
	}
};

/**
 * Procedure when closed.
 * @param {Event} event event object
 */
PostTool.prototype.closeBox = function(event) {
	this.post = null;
};