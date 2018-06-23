
var sys = require('sys');
var fs = require('fs');
var path = require('path');
var {JSDOM} = require('jsdom');
var jquery = require('jquery');
var regex_text = /__\((\'([^\']+)\'|\"([^\"]+)\")\)/g;
var regex_tag = /<[^>]+>|%[a-zA-Z_-]*%|\\[a-z]/g;

var src_dir = 'src';
var dest_dir = 'src/locale';
var tmplt_fn = 'template.json';
var tmplt_path = dest_dir + '/' + tmplt_fn;
var new_tmplt = {};
var old_tmplt = {};
if(fs.existsSync(tmplt_path)) {
	var json = fs.readFileSync(tmplt_path);
	old_tmplt = JSON.parse(json);
}

parseDir(src_dir);

new_tmplt['//expired'] = true;
for(var key in old_tmplt) {
	if(key && key.substr(0,2)!=='//' && !(key in new_tmplt)) {
		new_tmplt[key] = '';
	}
}

sys.print('writing '+tmplt_path+'\r\n');
fs.writeFileSync(tmplt_path, getJsonStr(new_tmplt));

updateLocales(dest_dir);

//
function parseDir(dir) {
	sys.print('In '+dir+'\r\n');
	var files = fs.readdirSync(dir);
	files = files.map(function(fn){
		return dir+'/'+fn;
	});
	var htmls = files.filter(function(fn){
		return fs.statSync(fn).isFile() && (path.extname(fn)==='.html');
	});
	var scripts = files.filter(function(fn){
		return fs.statSync(fn).isFile() && (path.extname(fn)==='.js');
	});
	var subdirs = files.filter(function(fn){
		return fs.statSync(fn).isDirectory();
	});
	htmls.map(parseHtml);
	scripts.map(parseJs);
	subdirs.map(parseDir);
}

function parseHtml(fn) {
	sys.print('parsing '+fn+'\r\n');
	new_tmplt['//'+fn] = true;
	var content = fs.readFileSync(fn);
	var dom = new JSDOM(content);
	var $ = jquery(dom.window);
	var cnt = 0;
	gettext('body');
	if(cnt==0) delete new_tmplt['//'+fn];

	function gettext(exp) {
		$(exp).contents().each(function(){
			if(this.nodeType==1) {
				gettext(this);
			} else if(this.nodeType==3) {
				var text = $(this).text();
				text = text.replace(/^\s+|\s+$/g, '');
				if(text && /[a-zA-Z]/.test(text)) {
					new_tmplt[text] = '';
					cnt++;
				}
			}
		});
	}
}

function parseJs(fn) {
	sys.print('parsing '+fn+'\r\n');
	new_tmplt['//'+fn] = true;
	var content = fs.readFileSync(fn);
	var cnt = 0;
	while((match =regex_text.exec(content))) {
		var key = match[2];
		if(!key) key = match[3];
		if(!key) continue;
		new_tmplt[key] = removeStr(key);
		cnt++;
	}
	if(cnt==0) delete new_tmplt['//'+fn];
}

function updateLocales(dir) {
	var files = fs.readdirSync(dir);
	files = files.map(function(fn){
		return dir+'/'+fn;
	});
	files = files.filter(function(fn){
		return fs.statSync(fn).isFile() && (path.extname(fn)==='.json') 
				&& fn.substr(-tmplt_fn.length)!==tmplt_fn;
	})
	files.map(updateLocaleFile);
}

function updateLocaleFile(fn) {
	sys.print('updating '+fn+'\r\n');
	var json = fs.readFileSync(fn);
	var locale = JSON.parse(json);
	var new_locale = Object.assign({}, new_tmplt);
	for(var key in locale) {
		if(key.substr(0,2)==='//') continue;
		if((key in new_locale)) {
			new_locale[key] = locale[key];
		}
	}
	var back = fn+'.bak';
	if(fs.existsSync(back)) fs.unlinkSync(back);
	fs.renameSync(fn, back);
	fs.writeFileSync(fn, getJsonStr(new_locale));
}

function getJsonStr(obj) {
	var str = JSON.stringify(obj, null, '\t');
	str = str.replace(/: \"/g, ':\r\n\t"');
	return str;
}

function removeStr(str) {
	rep = '';
	while((match =regex_tag.exec(str))) {
		rep += match[0];
	}
	return rep;
}