/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview Class of help popup
 * @since  2018.06.02  initial coding.
 */

/**
 * Class of help popup
 * @constructor
 * @param {string} exp Selector expression to attach popup.
 */
var HelpPopup = function(exp) {
	PopupBox.call(this, {
		attach: 'top',
		align: 'center',
		exp: exp,
	});
};

HelpPopup.prototype = $.extend({}, PopupBox.prototype);

/**
 * Render popup
 */
HelpPopup.prototype.render = function() {
	this.$elm = $('<div class="help-popup"></div>');
};

/**
 * Bind handlers.
 */
HelpPopup.prototype.bind = function() {
};

/**
 * Procedure when opened.
 * Set view.
 * @param {Event} event event object 
 */
HelpPopup.prototype.openBox = function(event) {
	$item = $(event.target).closest('*[data-help]');
	var help = null;
	if($item[0]) {
		help = $item.attr('data-help');
		help = help.replace('\r\n', '<br/>')
	} else {
		help = $(event.target).html();
	}
	if(!help) {
		this.close();
		return;
	}
	this.$elm.html(help);
};

/**
 * Procedure when closed.
 * @param {Event} event event object
 */
HelpPopup.prototype.closeBox = function(event) {
};