/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview wall of hidding content.
 * @since  2018.06.16 Apply to jQuery.
 */

/**
 * Class wall.
 * hide content and show loading mark.
 * @param {boolean} b_show Show wall if true. 
 * @param {string|boolean} loading Name of mark. Or shows default mark if true. otherwise hides.
 */
var Wall = function(b_show, loading) {
	this.$elm = $('<div id="wall"><div class="mark-container"></div></div>');
	$('body').append(this.$elm);
	this.loading = yjd.Loading('#wall>.mark-container', {
		visible: false,
		size: '150px',
		style: {
			display: 'block',
		},
		marks: {
			loading: {
				animation: {
					timing: 'ease-in-out'
				},
				dot: {
					num: 16,
					color: '#88f',
					width: .2,
					height: .08,
				}
			}
		}
	});
	if(b_show===undefined) b_show = false;
	if(loading==undefined) loading = false;
	this.show(b_show, loading);
}

/**
 * Show or Hide wall and loading mark.
 * @param {boolean} b_show Show wall if true. 
 * @param {string|boolean} loading Name of mark. Or shows default mark if true. otherwise hides.
 */
Wall.prototype.show = function(b_show, loading) {
	if(b_show) {
		if(loading===undefined) loading = false;
		if(loading===true) loading = undefined;
		this.$elm.css('display', 'block');
		this.loading.show(loading);
		if(loading) {
			this.$elm.css('z-index', '20');
		}
	} else {
		this.$elm.css('display', 'none');
		this.loading.show(false);
		this.$elm.css('z-index', '');
	}
};