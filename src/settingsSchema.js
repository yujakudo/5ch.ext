/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview setting schema.
 * @since  2018.06.16 Devide from storageData.js.
 */

 /**
  * Get settings schema.
  * @return {SettingTool.Schema} Setting schema.
  */
function getSettingsSchema() {

/**
 * Schema of tread view.
 * @type {SettingTool.Schema.Item}
 */
var ThreadViewSchema = {
	id: "settings-threadView",
	title: __('Thread view (read.cgi)'),
	path: 'settings.readcgi.enable',
	type: 'switch',
	values: [{ value: true, label: __('Enable')},],
	help: __("Enables the extension on the thread view.")
	+'\r\n'+__("Turn this off if you want the extension not to work on the thread view."),
	subset: [
		{
			id: "settings-threadView-general",
			title: __('General'),
			subset: [
				{
					path: 'settings.readcgi.usePopup',
					type: 'switch',
					values: [{ value: true, label: __('Enable popup menu')},],
					help: __("Enables popup menu.")
					+'\r\n'+__("If turn this on, opens a popup menu when an icon at right top of each posts pointed.")
				},
				{
					path: 'settings.readcgi.useMetaCtrl',
					type: 'switch',
					values: [{ value: true, label: __('Enable meta controls')},],
					help: __("Enables controls on meta information area of each posts.")
					+'\r\n'+__("If turn this on, you can do same things as the popup menu item by clicking information of posts.")
					+__("<ul><li>Clicking forced ID(ﾜｯﾁｮｲ) or ID, A list of posts by that ID arises. </li>")
					+__("<li>Clicking '&clubs;', A tree view arises.</li></ul>")
				},
				{
					path: 'settings.readcgi.colorId',
					type: 'switch',
					values: [{ value: true, label: __('Colors ID and ﾜｯﾁｮｲ')},],
					help: __("Colors ID and ﾜｯﾁｮｲ as it's value"),
				},
				{
					path: 'settings.readcgi.extendCss',
					type: 'switch',
					values: [{ value: true, label: __('Extend CSS')},],
					help: __('Applies CSS to remove unnecessary spaces.'),
				},
				{
					path: 'settings.blockDuration',
					type: 'number',
					label: __('Blocking duration'),
					range: [0, 100000],
					help: __("Duration in day to keep blocking of specified user ID.")
					+'\r\n'+__("When this duration expires, the ID is automatically unblocked.")
					+__(" Set 0 not to unblock automatically.")
				},
				{
					path: 'settings.readcgi.animate',
					type: 'switch',
					values: [{ value: true, label: __('Animation')},],
					help: __("Animation where posts and the form slide."),
					subset: [{
						path: 'settings.readcgi.animationDuration',
						type: 'number',
						label: __('Durtion'),
						range: [ 0, 1000 ],
						help: __("Duration of the animation in millisecond.")
						+'\r\n'+__("Set 0 not to animating.")
					},],
				},
				{
					path: 'settings.readcgi.hideBlocked',
					type: 'switch',
					values: [
						{ value: true, label: __('Hides blocked post')},
					],
					help: __("Hides blocked posts completely.")
					+'\r\n'+__("If you turn this off, hides only the message of blocked posts and add 'あぼ～ん' to the head of user name.")
				},
				{
					path: 'settings.readcgi.minPostWidth',
					type: 'number',
					label: __('Min. post width'),
					range: [ 100, 1000 ],
					help: __('Minimum width in pixel of each post.')
					+'\r\n'+__("In the treeview, width of post becomes narrower as it’s indent, but does not become narrower than this width."),
				},
			],
		},
		{
			id: "settings-threadView-links",
			title: __('Links'),
			subset: [
				{
					path: 'settings.readcgi.link.correct',
					type: 'switch',
					values: [{ value: true, label: __('Correction')},],
					help: __("Corrects broken or immature URLs.")
					+'\r\n'+__("URL cut at '&' are connected.")
					+__(" Strings not recognized as URL because of starting by 'ttp' or including a full width character are made as link.")
				},
				{
					path: 'settings.readcgi.link.openNewTab',
					type: 'switch',
					values: [{ value: true, label: __('Opens link in new tab')},],
					help: __("Opens a linked external page in new tab.")
					+'\r\n'+__("If you turn this off, linked pages are opened in the existing tab,")
					+__(" but you can open a link in new tab by clicking with Ctrl key.")
				},
				{
					path: 'settings.readcgi.link.disableAnchor',
					type: 'switch',
					values: [{ value: true, label: __('Disable anchor as link')},],
					help: __(' Does not jump new page when clicking an anchor that refers a post.')
					+ __("Instead of new page, tries to scroll to the post referred.")
				},
				{
					path: 'settings.readcgi.link.direct',
					type: 'switch',
					values: [{ value: true, label: __('Direct link')},],
					help: __('When clicking a link, skips https://jump.5ch.net and jumps to linked page directly.'),
				},
				{
					path: 'settings.autoJump',
					type: 'switch',
					values: [{ value: true, label: __('Auto jump')},],
					help: __('Automatically jumps to another site without clicking a link at https://jump.2h.net.'),
				},
			],
		},
		{
			id: "settings-threadView-form",
			title: __('Post form'),
			subset: [
				{
					path: 'settings.readcgi.form.fillSage',
					type: 'switch',
					values: [{ value: true, label: __("Always 'sage'")},],
					help: __("Automatically fills an email field with 'sage'."),
				},
				{
					path: 'settings.readcgi.form.backAfterPost',
					type: 'switch',
					values: [{ value: true, label: __('Jump to same posts')},],
					help: __("After posting, jumps to the thread view from the first post currently shown.")
					+'\r\n'+__("Turn this off to jump to the view of the latest 50 posts."),
				},
				{
					path: 'settings.readcgi.form.maxWidth',
					type: 'number',
					label: __('Max. width'),
					help: __('Maximum width of the form in pixel')
					+'\r\n'+__("Increase if you feel that the post form is narrow."),
				},
				{
					path: 'settings.readcgi.form.smallFields',
					type: 'switch',
					values: [{ value: true, label: __('Small name field')},],
					help: __("Makes name and email field small for height of the post form to be lower.")
					+ __("It works better with the following sliding form."),
				},
				{
					path: 'settings.readcgi.form.slide',
					type: 'switch',
					values: [{ value: true, label: __('Sliding form')},],
					help: __("Makes the post form slide to bottom of a post when clicking a post number instead of 'Quick reply'."),
					subset: [
						{
							path: 'settings.readcgi.form.quotSymbol',
							label: __('Quotation symbol'),
							type: 'text',
							help: __("A symbol of the beginning of a quoted sentences.")
							+'\r\n'+__("If you want to quote, select sentences before clicking a post number.")
						},
					],
				},
			],
		},
		{
			id: "settings-threadView-mediaPopup",
			title: __('Media popup'),
			path: 'settings.readcgi.media.enable',
			type: 'switch',
			values: [{ value: true, label: __('Enable')},],
			help: __("Media - image, video or audio - is pop up and you can preview when pointing those link.")
			+'\r\n'+__("Media of youtube.com and imgur.com are shown in an embedded frame."),
			subset: [
				{
					path: 'settings.readcgi.media.initWidth',
					label: __('Initial width'),
					type: 'number',
					range: [ 10, 8000 ],
					help: __("Initial width of the popup in pixel.")
					+'\r\n'+__("Actual size of the popup is modified by 'Size adjustment'.")
					+__(" But size of embedded frames cannot be controlled.")
					+__(" Youtube keeps initial size and Imgur keeps only initial width.")
				},
				{
					path: 'settings.readcgi.media.initHeight',
					label: __('Initial height'),
					type: 'number',
					range: [ 10, 8000 ],
					help: __("Initial height of the popup in pixel. See the help of 'Initial width' for more.")
				},
				{
					path: 'settings.readcgi.media.sizeAdjust',
					type: 'rotary',
					label: __('Size adjustment'),
					values: [
						{ value: 'full', label: __('Full')},
						{ value: 'stretch', label: __('Stretch')},
						{ value: 'inside', label: __('Inside')},
					],
					help: __("Type of modification of size of the popup for media that is not an embedded frames.")
					+__("<ul><li>'Inside' keeps media size not to go out of initial size.</li>")
					+__("<li>'Stretch' keeps the length of one side and stretches the other side when media goes out of the initial size.</li>")
					+__("<li>'Full' stretches both side but keeps not to go out of the window.</li>")
					+__("</ul>Any type might reduce media size but does not expands.")
				},
				{
					path: 'settings.readcgi.media.defaultAttach',
					type: 'rotary',
					label: __('Initial side to attach'),
					values: [
						{ value: 'top', label: __('Top')},
						{ value: 'bottom', label: __('Bottom')},
						{ value: 'right', label: __('Right')},
					],
					help: __("A side of a link where the popup opens initialy.")
					+'\r\n'+__("In spite of this setting, changes a side to try not to hide the link as possible.")
					+__(" If you annoy movement of the popup when loading, 'Right' is recommended.")
					+__(" Even though 'Right' is selected, An audio control opens on the top or bottom side of the link.")
				},
				{
					path: 'settings.readcgi.media.autoplay',
					type: 'switch',
					values: [{ value: true, label: __('Auto play')},],
					help: __("Automatically starts playing when popped up.")
					+'\r\n'+__("Even though you turned this on, you might start playing manually according to the browser's policy.")
				},
				{
					path: 'settings.readcgi.media.delay',
					label: __('Popup delay'),
					type: 'number',
					range: [ 10, 1000 ],
					help: __("Delay in millisecond from when a link is pointed to when the popup open.")
					+'\r\n'+__("It is also delay from when the cursor leave the link or the popup to when the popup close.")
					+__(" Increase if you feel annoyance for the popup when the cursor passes a link, or unintended close of the popup when moving the cursor from the link to the popup.")
					+__(" Or decrease if you feel annoyance for delay of the popup.")
				},
			],
		},
	]
};

/**
 * Schema of list of treads view.
 * @type {SettingTool.Schema.Item}
 */
var ListOfThreadsSchema = {
	id: "settings-listOfThreads",
	title: __('List of threads view (subback.html)'),
	path: 'settings.subback.enable',
	type: 'switch',
	values: [{ value: true, label: __('Enable')},],
	help: __("Enables the extension on the list of threads.")
	+'\r\n'+__("Turn this off if you want the extension not to work the list of threads."),
	subset: [
		{
			label: __('Default order'),
			path: 'settings.subback.defaultOrder',
			type: 'rotary',
			values: [
				{ value: 'no', 	label: __('Original')},
				{ value: 'title', label: __('Title')},
				{ value: 'num', label: __('Post count')},
			],
			help: __("Default order of threads.")
			+__("<ul><li>'Original': In original order.</li>")
			+__("<li>'Title': Sorted by title.</li>")
			+__("<li>'Post count': In order of number of posts</li></ul>")
		},
		{
			path: 'settings.subback.notMakeNewTab',
			type: 'switch',
			values: [{ value: true, label: __('Opens in existing tab')},],
			help: __("Opens thread view in existing tab.")
			+'\r\n'+__("You can also open in new tab by clicking with Ctrl key.")
			+__(" If you turn this off, opens in new tab."),
		},
		{
			path: 'settings.subback.linkToAll',
			type: 'switch',
			values: [{ value: true, label: __('Link to all posts')},],
			help: __("Links thread title to all posts view.")
			+'\r\n'+__("If you turn this off, links to latest 50 posts view.")
			+__(" In any case, you can open the other view by clicking number above the title or number of posts below the title.")
		},
	]
};

/**
 * Schema of list of boards view.
 * @type {SettingTool.Schema.Item}
 */
var BoardsViewSchema = {
	id: "settings-listOfBoards",
	title: __('List of boards (bbstable.html)'),
	path: 'settings.bbsmenu.enable',
	type: 'switch',
	values: [{ value: true, label: __('Enable')},],
	help: __("Enables the extension on the list of boards.")
	+'\r\n'+__("Turn this off if you want the extension not to work on the list of boards."),
	subset: [
		{
			path: 'settings.bbsmenu.notMakeNewTab',
			type: 'switch',
			values: [{ value: true, label: __('Shows link on existing tab')},],
			help: __("Opens the board page in existing tab.")
			+'\r\n'+__("You can also open in new tab by clicking with Ctrl key.")
			+__(" If you turn this off, opens in new tab."),
		},
		{
			path: 'settings.bbsmenu.linkToAll',
			type: 'switch',
			values: [{ value: true, label: __('Link to list of thread')},],
			help: __("Links board title to list of thread.")
			+'\r\n'+__(" If you turn this off, links to the top page of the board.")
		},
	]
};

/**
 * Schema of footer tool bar.
 * @type {SettingTool.Schema.Item}
 */
var FooterToolBarSchema = {
	id: "settings-footerToolbar",
	title: __('Footer toolbar'),
	help: __("Shows the footer toolbar at the bottom of the window.")
	+'\r\n'+__("It still works even if you set to hide.")
	+__(" Disable each view If you want the bar to be turned off completely."),
	subset: [
		{
			path: 'settings.footerCtrl.enable',
			type: 'switch',
			values: [
				{ value: true, label: __('Show')},
				{ value: false, label: __('Hide')},
			],
			help: __("Visibility of the footer tool bar.")
		},
		{
			path: 'settings.footerCtrl.animateScroll',
			type: 'switch',
			values: [{ value: true, label: __('Scroll animation')},],
			help: __("Animates when the page scrolls by a button or key."),
		},
		{
			title: __('Shortcut keys'),
			help: __("Shortcut keys of buttons in the toolbar.")
			+'\r\n'+__("To set keys, focus each field and press a key with/without modification key - Shift, Ctrl, Command, Alt, Meta - as you like.")
			+__(" To reset, press Escape key. So Escape key can not be assigned.")
			+__(" To use Ctrl key for modification is not recomended because it might be assinged by the browser."),
			subset: [
				{
					label: __('Scroll to an upper item'),
					path: 'settings.footerCtrl.key.up',
					type: 'keycode',
				},
				{
					label: __('Scroll to a lower item'),
					path: 'settings.footerCtrl.key.down',
					type: 'keycode',
				},
				{
					label: __('Scroll to upper hidden items'),
					path: 'settings.footerCtrl.key.pageup',
					type: 'keycode',
				},
				{
					label: __('Scroll to lower hidden items'),
					path: 'settings.footerCtrl.key.pagedown',
					type: 'keycode',
				},
				{
					label: __('Scroll to top'),
					path: 'settings.footerCtrl.key.top',
					type: 'keycode',
				},
				{
					label: __('Scroll to bottom'),
					path: 'settings.footerCtrl.key.bottom',
					type: 'keycode',
				},
				{
					label: __('Scroll to a previous item'),
					path: 'settings.footerCtrl.key.prev',
					type: 'keycode',
				},
				{
					label: __('Scroll to a next item'),
					path: 'settings.footerCtrl.key.next',
					type: 'keycode',
				},
				{
					label: __('Scroll to bookmark'),
					path: 'settings.footerCtrl.key.toBookmark',
					type: 'keycode',
				},
				{
					label: __('Jump to list of boards'),
					path: 'settings.footerCtrl.key.toBoards',
					type: 'keycode',
				},
				{
					label: __('Jump to list of threads'),
					path: 'settings.footerCtrl.key.toThreads',
					type: 'keycode',
				},
				{
					label: __('Get all posts'),
					path: 'settings.footerCtrl.key.updateAll',
					type: 'keycode',
				},
				{
					label: __('Update the page'),
					path: 'settings.footerCtrl.key.update',
					type: 'keycode',
				},
				{
					label: __('Update from the last post'),
					path: 'settings.footerCtrl.key.updateLast',
					type: 'keycode',
				},
				{
					label: __('Update from the bookmark'),
					path: 'settings.footerCtrl.key.updateBookmark',
					type: 'keycode',
				},
			],
		},
	],
};

/**
 * Schema of vertical lines.
 * @type {SettingTool.Schema.Item}
 */
var VerticalLinesSchema = {
	id: "settings-verticalLines",
	title: __('Vertical lines'),
	help: __("Settings for vertical lines in list of threads and list of boards view."),
	subset: [
		{
			path: 'settings.vlines.half2fullKana',
			type: 'switch',
			values: [{ value: true, label: __('Half width to fill')},],
			help: __("Converts half width kana to full width katakana.")
			+'\r\n'+__("Half width kana will not be upright in mixed orientation."),
		},
		{
			path: 'settings.vlines.toAscii',
			type: 'switch',
			values: [{ value: true, label: __('To ASCII')},],
			help: __("Converts characters to ASCII as possible.")
			+'\r\n'+__("It makes a title shorter a little.")
		},
		{
			label: __('Text orientation'),
			path: 'settings.vlines.orientation',
			type: 'rotary',
			values: [
				{ value: 'mixed', label: __('Mixed')},
				{ value: 'upright', label: __('Upright')},
				{ value: 'sideways', label: __('Sideways')},
			],
			help: __("Text orientation.")
			+__("<ul><li>'Mixed': Upright and sideways texts are mixed.")
			+__(" Japanese will be upright, and English will be sideways.</li>")
			+__("<li>'Upright': All texts are upright.</li>")
			+__("<li>'Sideways': All texts are sideways.</li></ul>")
			+__("If you set this to 'Sideways', It is better to set following 'Combination for upright' to 'Off' and clear 'Combined terms'."),
		},
		{
			label: __('Combination for upright'),
			path: 'settings.vlines.combineUprightChars',
			type: 'rotary',
			values: [
				{ value: 0, label: __('Off')},
				{ value: 1, label: __('-1-')},
				{ value: 2, label: __('-2-')},
				{ value: 3, label: __('-3-')},
				{ value: 4, label: __('-4-')},
			],
			help: __("Number of characters to be combined and made upright.")
			+'\r\n'+__("It makes a title shorter a little.")
		},
		{
			label: __('Combined terms'),
			path: 'settings.vlines.combineUprightTerms',
			type: 'text',
			help: __("Terms combined and made upright in spite of 'Combination for upright' settings.")
			+'\r\n'+__("Separate by '|' for more than a term. '.', '&#92;w' and '&#92;d' can be used for wildcards, but '&#92;.' must be used instead of '.'.")
			+__(" Actualy, you can use regular expression.")
		},
		{
			label: __('Delay from resizing'),
			path: 'settings.vlines.resizeDelay',
			type: 'number',
			range:[100, 2000],
			help: __("Delay in millisecond from window resizing to relayout.")
			+'\r\n'+__("Delay is necessary to prevent frequent relayout during drag.")
			+__(" Increase if you annoy frequent relayout during drag.")
			+__(" Or, decrease if you annoy delay when maximize or normalize window.")
		},
	],
};

/**
 * Schema for settings.
 * @type {SettingTool.Schema}
 */
var SettingsSchema = [
	{
		id: "settings-basic",
		title: __("Basic settings"),
		subset: [
			{
				label: __('Language'),
				path: 'settings.language',
				type: 'rotary',
				values: [
					{	value: 'auto', label: __('Auto')	},
					{	value: 'en', label: 'English'	},
					{	value: 'ja', label: __('Japanese')	},
				],
			},
			{
				path: 'settings.enable',
				type: 'switch',
				values: [{ value: true, label: __('Enable the extension')},],
				help: __("Enables the extension.")
				+'\r\n'+__("Turn this off if you want the extension not to work on all pages.")
			},
		],
	},
	ThreadViewSchema,
	ListOfThreadsSchema,
	BoardsViewSchema,
	FooterToolBarSchema,
	VerticalLinesSchema,
];

	return SettingsSchema;
}