/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Class of media popup
 * @since  2018.05.05  initial coding.
 */

/**
 * @typedef MediaPopup.Options
 * @property {string|Element|jQuery} exp jQuery expression of parent element to attach popup.
 * @property {string} applyFunc jQuery function to attach.
 * @property {number} delay Delay of open and close.
 * @property {number} initWidth Initial width of popup.
 * @property {number} initHeight Initial height of popup.
 * @property {number} sizeAdjust How to adjust popup size. 'full', 'stretch', or 'inside'.
 * @property {number} defaultAttach Default side of parent to attach popup. 'top', 'bottom', 'left', or 'right'.
 * @property {number} headerHeight Height of header of the view in pixel.
 * @property {number} footerHeight Height of footer of the view in pixel.
 * @property {boolean} autoplay Whether automaticaly start play or not.
 */
/**
 * Class of media popup preview.
 * @param {MediaPopup.Options} options Options
 */
var MediaPopup = function(options) {
	options = $.extend({
		exp: null,
		applyFunc: 'append',
		delay: 200,
		initWidth: 640,
		initHeight: 480,
		sizeAdjust: 'full',
		defaultAttach: 'top',
		headerHeight: 0,
		footerHeight: 0,
		autoplay: false,
	}, options);
	PopupBox.call(this, options);
	this.monitor_iid = null;
};
/**
 * @typedef MediaPopup.Sites.Info
 * @property {RegExp} pattern Match pattern to get ID
 * @property {string} html HTML to insert popup. it often iframe tag.
 * @property {string} aptoplay expression of autoplay.
 * @property {number} monitorSize Number of call to monitorSize.
 */
/**
 * Information of specific sites.
 * Is hash array(object) and keys are domain.
 * @type {MediaPopup.Sites.Info[]}
 */
MediaPopup.sites = {
	'youtube.com': {
		pattern: /^\/watch\?v=([^&]{8,})(&(.+))?/,
		html: '<iframe width="%width%" height="%height%"'
		+' src="https://www.youtube.com/embed/%1%?rel=0%autoplay%"'
		+' frameborder="0" allowfullscreen></iframe>',
		autoplay: '&amp;autoplay=1',
		monitorSize: 1,
	},
	'youtu.be': {
		pattern: /^\/([^\?]{8,})(\?(.+))?/,
		html: '<iframe width="%width%" height="%height%"'
		+' src="https://www.youtube.com/embed/%1%?rel=0%autoplay%"'
		+' frameborder="0" allowfullscreen></iframe>',
		autoplay: '&amp;autoplay=1',
		monitorSize: 1,
	},
	'dailymotion.com': {
		pattern: /^\/video\/([^?]{6,})(\?(.+))?/,
		html: '<iframe frameborder="0" width="%width%" height="%height%"'
		+' src="//www.dailymotion.com/embed/video/%1%%autoplay%"'
		+' allowfullscreen="" allow="autoplay"></iframe>',
		autoplay: '?autoPlay=1',
		monitorSize: 1,
	},
	'dai.ly': {
		pattern: /^\/([^?]{6,})(\?(.+))?/,
		html: '<iframe frameborder="0" width="%width%" height="%height%"'
		+' src="//www.dailymotion.com/embed/video/%1%%autoplay%"'
		+' allowfullscreen="" allow="autoplay"></iframe>',
		autoplay: '?autoPlay=1',
		monitorSize: 1,
	},
	'imgur.com': {
		pattern: /^\/([^\?\.]{6,})(.[\w]+)?/,
		html: '<blockquote class="imgur-embed-pub" lang="en" data-id="%1%">'
		+'<a href="//imgur.com/%1%"></a></blockquote>'
		+'<script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>',
		monitorSize: 1,
		initialSize: [540, 500],
		// margin: [70, 0, 65, 0],
	},
};

/**
 * Media type information.
 * Keys are media type. values are list of extentions.
 * @type {object}
 */
MediaPopup.types = {
	'image': [
		'.png', '.apng', '.gif', '.bmp', '.svg',
		'.jpeg', '.jpg', '.jpe', '.jfif', '.jfi', '.jif',

	],
	'video': [
		'.ogm', '.ogv', '.ogg', '.webm', '.mp4'
	],
	'audio': [
		'.oga', '.mp3', '.wav',
		'.oups', '.flac', '.fla'
	],
};

MediaPopup.prototype = $.extend({}, PopupBox.prototype);

/**
 * @typedef MediaPopup.MediaInfo
 * @property {boolean} enable Enable.
 * @property {string} [site] Domain of site if url is for media in the site.
 * @property {string} [embed] HTML code to embed the media
 * @property {string} [expectedType] expected media type if the url is not for specific site.
 * 	'video', 'audio', or 'image'.
 * @property {string} url URL.
 * @property {string} protocol Protocol field like 'http://'.
 * @property {string} host Host name.
 * @property {string} path URL path including first '/'.
 * @property {string} search Get method query after '?'. Not include '?'.
 * @property {string} segment Segment after '#'. Not include '#'.
 */
/**
 * Get media information.
 * @param {string} url URL
 * @return {MediaPopup.MediaInfo} media information.
 */
MediaPopup.prototype.getMediaInfo = function(url) {
	var info = extractUrl(url);
	info.expectedType = null;
	info.site = null;
	info.enable = false;
	if(!info.host) return info;
	var path = info.path+'?'+info.search;
	var domain = info.host.split('.');
	domain = domain[domain.length-2]+'.'+domain[domain.length-1];
	for(var site in MediaPopup.sites) {
		if(site!==domain) continue;
		var siteInfo = MediaPopup.sites[site];
		var match
		if((match = path.match(siteInfo.pattern))) {
			match = match.map((x)=>{return x?x:''});
			info.site = site;
			info.embed = siteInfo.html.fill(match);
			info = $.extend(info, siteInfo);
		}
		break;
	}
	if(!info.site) {
		var ext = info.path.substr(info.path.lastIndexOf('.')).toLowerCase();
		var pos = ext.indexOf(':');
		if(pos>0) ext = ext.substr(0,pos);
		if(ext.length==4 || ext.length==5) searchExt(ext);
		if(!info.expectedType && info.search) {
			if(info.search.match(/format=(\w{3,4})(?!\w)/)) {
				searchExt('.'+RegExp.$1);
			} else if(info.search.match(/file=([\d\w_\-]*)\.(\w{3,4})(?!\w)/)) {
				searchExt('.'+RegExp.$2);
			}
		}
	}
	if(info.site || info.expectedType) info.enable = true;

	return info;
	//
	function searchExt(ext) {
		for(var type in MediaPopup.types) {
			var types = MediaPopup.types[type];
			if(types.indexOf(ext)>=0) {
				info.expectedType = type;
				break;
			}
		}
	}
};

/**
 * Render popup.
 */
MediaPopup.prototype.render = function() {
	this.$elm = $('<div class="media-popup">'
		+'<div class="media-container"></div>'
		+'</div>'
	);
};

/**
 * Bind handlers.
 */
MediaPopup.prototype.bind = function() {
	this.$container = $('.media-container', this.$elm);
	this.$container.on('click', 'img', function (event) {
		jumpTo($(this).attr('src'), true, event);
	});
};

/**
 * Set new options.
 * @param {MediaPopup.Options} options.
 */
MediaPopup.prototype.setOptions = function(options) {
	this.options = $.extend(this.options, options);
	$('a[data-media-w]').removeAttr('data-media-w').removeAttr('data-media-h');
};

/**
 * Procedure when the popup opened.
 * @param {Event} event object 
 * @param {MediaPopup.MediaInfo} minfo information of media.
 */
MediaPopup.prototype.openBox = function(event, minfo) {
	if(typeof minfo==='string') minfo = extractUrl(minfo.url);
	if(!minfo.enable) {
		this.close(); 
		return;
	}
	//	initialize plece and container size. It's temporal
	var place = this.initPlace(event.target, minfo);
	var size = [ this.options.initWidth, this.options.initHeight ];
	var $link = $(event.target);
	if($link.attr('data-media-w')) {
		size[0] = Number($link.attr('data-media-w'));
		size[1] = Number($link.attr('data-media-h'));
	} else if(minfo.expectedType==='audio') {
		size = [ 300, 32 ];
	}
	this.updatePlace(place, size[0], size[1]);
	this.$container.css({ width: place.w, height: place.h });
	if(minfo.site) {
		this.siteHandler(minfo, place);
	} else {
		MediaPopup.prototype[minfo.expectedType+'Handler'].call(this, minfo, place);		
	}
};

/**
 * @typedef MediaPopup.place
 * @property {Element} elm Parent element.
 * @property {string} attach Side of parent element to attach.
 * @property {number} init_w Width of initial size.
 * @property {number} init_h Height of initial size.
 * @property {number} top_space Space from top of the view to top of the parent.
 * @property {number} bottom_space Space from bottom of the view to bottom of the parent.
 * @property {number} max_w Maximum width that popup can be inflated.
 * @property {number} max_h Maximun height that popup can be inflated.
 * @property {number} w Width of current size.
 * @property {number} h Height of current size.
 * @property {MediaPopup.MediaInfo} minfo information of media.
 */
/**
 * Initialize popup size and place.
 * @param {Element} elm Parent element.
 * @param {MediaPopup.MediaInfo} minfo information of media.
 * @return {MediaPopup.Place} information of place.
 */
MediaPopup.prototype.initPlace = function(elm, minfo) {
	var win = this.windowSize();
	//	rect of the element hovered
	var rect = this.parent.getBoundingClientRect();
	var place = {elm:elm, minfo:minfo};

	place.attach = this.options.defaultAttach;
	place.init_w = this.options.initWidth;
	place.init_h = this.options.initHeight;
	place.top_space = rect.top - win.y;
	place.bottom_space = win.h - rect.bottom;
	place.w = place.init_w;
	place.h = place.init_h;
	place.max_w = win.w;
	place.max_h = win.h;
	if(this.options.sizeAdjust==='inside') {
		place.max_w = place.init_w;
		place.max_h = place.init_h;
	}
	this.ppb.attach = place.attach;
	this.ppb.align = null;
	return place;
};

/**
 * Update popup place.
 * @param {MediaPopup.Place} information of place.
 * @param {number} m_w Width of the media.
 * @param {number} m_h Height of the media.
 */
MediaPopup.prototype.updatePlace = function(place, m_w, m_h) {
	var win = this.windowSize();
	if(m_w==0 || m_h==0) return false;
	place.m_w = m_w;
	place.m_h = m_h;
	place.aspect = m_w / m_h;
	//	if 'stretch', max size needs to be update.
	if(this.options.sizeAdjust==='stretch') {
		if(place.aspect >= place.init_w/place.init_h) {
			place.max_w = win.w;
			place.max_h = place.init_h;
		} else {
			place.max_w = place.init_w;
			place.max_h = win.h;
		}
	}
	//	if site content has margin, the margin can be place outside.
	if(place.margin) {
		if(m_h > place.max_h) {
			place.m_h = m_h - place.margin[0] - place.margin[2];
			place.m_top = -place.margin[0];
		}
		if(m_w > place.max_w) {
			place.m_w = m_w - place.margin[1] - place.margin[3];
			place.m_left = -place.margin[3];
		}
		place.aspect = place.m_w / place.m_h;
	}
	//	default size is media size.
	place.w = place.m_w;
	place.h = place.m_h;
	//	media size goes over the max width or max height.
	if(place.m_w>place.max_w || place.m_h>place.max_h) {
		if(place.aspect >= place.max_w/place.max_h) {
			place.w = place.max_w;
			place.h = place.w / place.aspect;
		} else if(!place.minfo.site) {	//	should not change iframe width.
			place.h = place.max_h;
			place.w = place.h * place.aspect;
		}
	}
	//	decide attach side.
	place.attach = this.options.defaultAttach;
	if(place.attach!=='right') {
		var b_in_top = (place.h <= place.top_space);
		var b_in_bottom = (place.h <= place.bottom_space);
		if(!b_in_top && !b_in_bottom) place.attach = 'right';
		else if(!b_in_top && b_in_bottom) place.attach = 'bottom';
		else if(b_in_top && !b_in_bottom) place.attach = 'top';
	}
	return true;
};

/**
 * Procedure when the url is for specific site.
 * @param {MediaPopup.Place} information of place.
 * @param {MediaPopup.MediaInfo} minfo information of media.
 */
MediaPopup.prototype.siteHandler = function(minfo, place) {
	var elm = this.$container[0];
	var autoplay = minfo.autoplay? minfo.autoplay: '';
	minfo.embed = minfo.embed.fill({
		width: place.w, height: place.h, autoplay: autoplay
	});
	this.$container.html(minfo.embed);
	this.place = null;
	if(minfo.margin)	place.margin = minfo.margin;
	this.monitorResize(minfo.monitorSize, place);
};

/**
 * Procedure when the url is for image.
 * @param {MediaPopup.Place} information of place.
 * @param {MediaPopup.MediaInfo} minfo information of media.
 */
MediaPopup.prototype.imageHandler = function(minfo, place) {
	var image = new Image();
	this.$container.append(image);
	this.monitorResize(1, place);
	image.src = minfo.url;
	$(image).bind('load', (event)=> {
		this.monitorResize(false, place);
		this.fixLoadedSize(place);
	}).bind('error', (event)=> {
		this.onError(event, place);
	});
};

/**
 * Procedure when the url is for video.
 * @param {MediaPopup.Place} information of place.
 * @param {MediaPopup.MediaInfo} minfo information of media.
 */
MediaPopup.prototype.videoHandler = function(minfo, place) {
	var $video = $('<video controls />');
	this.$container.append($video);
	this.monitorResize(1, place);
	$video.attr('src', minfo.url);
	$video.bind('loadedmetadata ', (event)=> {
		this.monitorResize(false, place);
		this.fixLoadedSize(place);
		if(this.options.autoplay) $video[0].play();
	}).bind('error', (event)=> {
		this.onError(event, place);
	});
};

/**
 * Procedure when the url is for audio.
 * @param {MediaPopup.Place} information of place.
 * @param {MediaPopup.MediaInfo} minfo information of media.
 */
MediaPopup.prototype.audioHandler = function(minfo, place) {
	var $audio = $('<audio controls />');
	this.$container.append($audio);
	this.monitorResize(1, place);
	$audio.attr('src', minfo.url);
	$audio.bind('loadedmetadata ', (event)=> {
		if(this.options.autoplay) $audio[0].play();
	}).bind('error', (event)=> {
		this.onError(event, place);
	});
};

/**
 * Error handler.
 * @param {Event} event event object
 * @param {MediaPopup.Place} information of place.
 */
MediaPopup.prototype.onError = function(event, place) {
	this.$container.html(
		'<span style="padding:4px 8px;background-color:#eee;">'
		+'<span style="color:red">&cross;</span>'
		+__('Load error')+'</span>'
	);
	this.monitorResize(false, place);
	this.fixLoadedSize(place);
};

/**
 * Fix place of popup.
 * @param {MediaPopup.Place} information of place.
 */
MediaPopup.prototype.fixLoadedSize = function (place) {
	//	Get media size
	var mediaElm = this.$container[0].children[0];
	var size = {	w: mediaElm.offsetWidth, h: mediaElm.offsetHeight	};
	if(mediaElm.tagName==='VIDEO' && mediaElm.videoWidth>0 && mediaElm.videoHeight>0) {
		size = {	w: mediaElm.videoWidth, h: mediaElm.videoHeight	};
	}
	//	store media size
	$(place.elm).attr('data-media-w', size.w).attr('data-media-h', size.h);
	//	update place
	res = this.updatePlace(place, size.w, size.h);
	if(!res) return;
	//	set media width.
	if(!place.minfo.site) $(mediaElm).css('width', ''+place.w+'px');
	if(place.m_top) $(mediaElm).css('top', ''+place.m_top+'px');
	this.$container.css({ width: 'auto', height: 'auto' });
	this.ppb.attach = place.attach;
	this.setPosition();
};

/**
 * Monitoring size of the media.
 * @param {number} turn Number of checking. If 0, just stops monitoring. If -1, monitoring once and stops.
 * @param {MediaPopup.Place} information of place.
 * @param {number} period Period of monitoring.
 */
MediaPopup.prototype.monitorResize = function(turn, place, period) {
	if(period===undefined) period = 500;
	if(this.monitor_iid) {
		clearInterval(this.monitor_iid);
		this.monitor_iid = null;
	}
	if(turn) {
		var mediaElm = this.$container[0].children[0];
		var prev_rect = mediaElm.getBoundingClientRect();
		var bind_iframe = (turn>0)? false: true;
		this.monitor_iid = setInterval( ()=>{
			if(!bind_iframe) {
				//	if an iframe is loaded, check after loaded that.
				$iframe = $('iframe', this.$container);
				if($iframe[0]) {
					mediaElm = this.$container[0].children[0];
					$iframe.css('margin', '0');
					$iframe.bind('load', (event)=> {
						this.monitorResize(-1, place, 100);
					});
					bind_iframe = true;
				}
			}
			var rect = mediaElm.getBoundingClientRect();
			if(turn<0 || prev_rect.width!=rect.width || prev_rect.height!=rect.height) {
				this.fixLoadedSize(place);
				prev_rect = rect;
				--turn;
			}
			if(turn>0) return;
			clearInterval(this.monitor_iid);
			this.monitor_iid = null;
		}, period);
	}
};

/**
 * Procedure when closed.
 * @param {Event} event event object
 */
MediaPopup.prototype.closeBox = function(event) {
	this.monitorResize(false);
	this.$container.html('');
	this.$container.css({ width: '', height: ''});
};
