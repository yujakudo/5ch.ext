/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Initial data of storage.
 * @since  2018.03.30  initial coding.
 */

/**
 * Initial data.
 */
var InitialData = {
	pageInfo: {},
	blockList: {},
	bookmarks: {},
	settings: {
		language: 'auto',
		enable: true,
		autoJump: true,
		blockDuration: 30,
		footerCtrl: {
			enable: true,
			animateScroll: true,
			key: {
				up: yjd.key.codes.UP,
				down: yjd.key.codes.DOWN,
				pageup: yjd.key.codes.UP | yjd.key.codes.SHIFT,
				pagedown: yjd.key.codes.DOWN | yjd.key.codes.SHIFT,
				top: yjd.key.codes.UP | yjd.key.codes.ALT,
				bottom: yjd.key.codes.DOWN | yjd.key.codes.ALT,
				prev: yjd.key.codes.LEFT,
				next: yjd.key.codes.RIGHT,
				toBookmark: yjd.key.codes.SLASH,
				toBoards: yjd.key.codes.Z | yjd.key.codes.ALT,
				toThreads: yjd.key.codes.X | yjd.key.codes.ALT,
				updateAll: yjd.key.codes.A | yjd.key.codes.ALT,
				update: yjd.key.codes.U | yjd.key.codes.ALT,
				updateBookmark: yjd.key.codes.B | yjd.key.codes.ALT,
				updateLast: yjd.key.codes.L | yjd.key.codes.ALT,
			},
		},
		readcgi: {
			enable: true,
			usePopup: true,
			useMetaCtrl: true,
			colorId: true,
			extendCss: false,
			animate: true,
			animationDuration: 300,
			hideBlocked: false,
			indentSize: 32,
			minPostWidth: 400,
			link: {
				openNewTab: true,
				correct: true,
				direct: false,
				disableAnchor: true,
			},
			form: {
				backAfterPost: true,
				fillSage: true,
				maxWidth: 720,
				smallFields: true,
				slide: true,
				quotSymbol: '＞',
			},
			media: {
				enable: true,
				initWidth: 640,
				initHeight: 360,
				sizeAdjust: 'stretch',
				autoplay: true,
				delay: 200,
				defaultAttach: 'top',
			},
		},
		subback: {
			enable: true,
			defaultOrder: 'no',
			notMakeNewTab: true,
			linkToAll: true,
		},
		bbsmenu: {
			enable: true,
			notMakeNewTab: true,
			linkToAll: true,
		},
		vlines: {
			half2fullKana: true,
			orientation: 'mixed',
			toAscii: true,
			combineUprightChars: 3,
			combineUprightTerms: 'part',
			resizeDelay: 500,
		},
	},
	timestamp: 0,
};
