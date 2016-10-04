//
// Roundcube Responses Plugin
//

// plugin class
plugin_responses = function plugin_responses() {
	var self = this;

	// plugin name space
	this.key = function(name) {
		return 'plugin.responses.' + name; // keep in sync with *.php
	}

	// environment variable
	this.env = function(name) {
		return rcmail.env[self.key(name)];
	}

	// plugin client logger
	this.log = function(text, force) {
		if (self.env('enable_logging') || force) {
			var name = arguments.callee.caller.name;
			var entry = self.key(name);
			rcmail.log(entry + ': ' + text);
		}
	};

	// provide localization
	this.localize = function(name) {
		return rcmail.get_label(name, 'responses');
	}

	// capitalize first letter
	this.cap = function cap(text) {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	// guess full/head/tail name
	this.parse_name = function parse_name(item) {
		var name = item.name;
		if (name.indexOf(' ') >= 0) {
			// "head tail" user@host
			var split = name.split(' ');
			item.head = self.cap((split[0].trim()));
			item.tail = self.cap(split[split.length - 1].trim());
			item.full = item.head + ' ' + item.tail;
		} else if (name.indexOf(',') >= 0) {
			// "tail, head" user@host
			var split = name.split(',');
			item.head = self.cap(split[split.length - 1].trim());
			item.tail = self.cap(split[0].trim());
			item.full = item.head + ' ' + item.tail;
		} else if (name.indexOf('.') >= 0) {
			// head.tail@host
			var split = name.split('.');
			item.head = self.cap((split[0].trim()));
			item.tail = self.cap(split[split.length - 1].trim());
			item.full = item.head + ' ' + item.tail;
		} else {
			// user@host
			item.head = self.cap(name);
			item.tail = self.cap(name);
			item.full = self.cap(name);
		}
	}

	// email address components
	this.parse_addr = function parse_addr(text) {
		var text = text.trim();
		// result
		var item = {
			text : text,
			name : '',
			full : '',
			head : '',
			tail : '',
			mail : '',
		};
		// user@host
		var rx = /^[<]?([^<\s]+)@([^>\s]+)[>]?$/;
		if (rx.test(text)) {
			var match = rx.exec(text);
			item.name = match[1];
			item.mail = match[1] + '@' + match[2];
			self.parse_name(item);
			return item;
		}
		// name user@host
		var rx = /^([^"]+)[\s]+[<]?([^<\s]+@[^>\s]+)[>]?$/;
		if (rx.test(text)) {
			var match = rx.exec(text);
			item.name = match[1];
			item.mail = match[2];
			self.parse_name(item);
			return item;
		}
		// "name" user@host
		var rx = /^"([^"]+)"[\s]+[<]?([^<\s]+@[^>\s]+)[>]?$/;
		if (rx.test(text)) {
			var match = rx.exec(text);
			item.name = match[1];
			item.mail = match[2];
			self.parse_name(item);
			return item;
		}
		return item;
	}

	// function replacement: see editor.js/rcube_text_editor.replace()
	this.rcube_text_editor_replace = function rcube_text_editor_replace(text,
			format) {
		var ed = this.editor;
		// insert into tinymce editor
		if (ed) {
			ed.getWin().focus(); // correct focus in IE & Chrome
			format = format ? format : 'text';
			var content = '[invalid]';
			if (format == 'html') {
				content = text;
			}
			if (format == 'text') {
				content = rcmail.quote_html(text).replace(/\r?\n/g, '<br/>');
			}
			ed.selection.setContent(content, {
				format : format
			});
		}
		// replace selection in compose textarea
		else if (ed = rcube_find_object(this.id)) {
			var selection = $(ed).is(':focus') ? rcmail.get_input_selection(ed)
					: {
						start : 0,
						end : 0
					}, inp_value = ed.value;
			pre = inp_value.substring(0, selection.start), end = inp_value
					.substring(selection.end, inp_value.length);

			// insert response text
			ed.value = pre + text + end;

			// set caret after inserted text
			rcmail.set_caret_pos(ed, selection.start + text.length);
			ed.focus();
		}
	};

	// function replacement: see app.js/rcube_webmail.insert_response()
	this.rcube_webmail_insert_response = function rcube_webmail_insert_response(
			key) {
		self.log('key: ' + key);

		var response_mapa = rcmail.env.textresponses;
		if (!response_mapa) {
			self.log('invalid response_mapa', true);
			return false;
		}

		var response = response_mapa[key];
		var template = response ? response.text : null;
		if (!template) {
			self.log('invalid template', true);
			return false;
		}

		var form_from = $('form #_from option:selected');
		if (!form_from.length) {
			self.log('invalid form_from', true);
			return false;
		}

		var form_to = $('form #_to');
		if (!form_to.length) {
			self.log('invalid form_to', true);
			return false;
		}

		var form_cc = $('form #_cc');
		if (!form_cc.length) {
			self.log('invalid form_cc', true);
			return false;
		}

		var from_text = form_from.text();
		var to_text = form_to.text();
		var cc_text = form_cc.text();

		self.log('from_text: ' + from_text);
		self.log('to_text: ' + to_text);
		self.log('cc_text: ' + cc_text);

		var from = self.parse_addr(from_text);
		var to_list = $.map(to_text.split(','), function(text) {
			return self.parse_addr(text);
		});
		var cc_list = $.map(cc_text.split(','), function(text) {
			return self.parse_addr(text);
		});

		function make_list(list, name) {
			return $.map(list, function(item) {
				return item[name];
			}).join(', '); // space
		}

		// available fields
		var mapping = {
			from_text : from_text,
			from_name : from.name,
			from_full : from.full,
			from_head : from.head,
			from_tail : from.tail,
			from_mail : from.mail,
			to_text : to_text,
			to_name : make_list(to_list, 'name'),
			to_full : make_list(to_list, 'full'),
			to_head : make_list(to_list, 'head'),
			to_tail : make_list(to_list, 'tail'),
			to_mail : make_list(to_list, 'mail'),
			cc_text : cc_text,
			cc_name : make_list(cc_list, 'name'),
			cc_full : make_list(cc_list, 'full'),
			cc_head : make_list(cc_list, 'head'),
			cc_tail : make_list(cc_list, 'tail'),
			cc_mail : make_list(cc_list, 'mail'),
		};

		var text = self.var_subst(template, mapping);
		var format = self.detect_format(response);

		self.log('mapping=' + self.json_encode(mapping, 4));
		self.log('format=' + format);
		
		// TODO switch editor format

		this.editor.replace(text, format);
	}

	// workaround for missing format settings ui
	this.detect_format = function(response) {
		// format defined // FIXME
		// if (response.format) {
		// return response.format;
		// }
		var name = response.name;
		// format defined
		if (name.startsWith('html:')) {
			return 'html';
		}
		var text = response.text;
		// format guessed: "< .... >"
		if (/^[<][\s\S]+/.test(text) && /[\s\S]+[>]$/.test(text)) {
			return 'html';
		}
		return 'text';
	}

	// convert object to text
	this.json_encode = function(json, tabs) {
		return JSON.stringify(json, null, tabs);
	}

	// convert text to object
	this.json_decode = function(text) {
		return JSON.parse(text);
	}

	// substitution key format
	this.var_key = function(name) {
		var prefix = self.env('variable_prefix');
		var suffix = self.env('variable_suffix');
		return prefix + name + suffix;
	}

	// substitution template processor
	this.var_subst = function var_subst(template, mapping) {
		var result = template;
		$.each(mapping, function(key, value) {
			var match = new RegExp(self.var_key(key), 'g');
			result = result.replace(match, value);
		});
		return result;
	}

	// verify parser
	this.test_parse_addr = function() {
		var list = [ //
		'user@host', //
		'<user@host>', //
		'name user@host', //
		'name <user@host>', //
		'"name" <user@host>', //
		'head.tail@host', //
		'head tail user@host', //
		'head tail <user@host>', //
		'"head tail" <user@host>', //
		'"tail, head" <user@host>', //
		];
		$.each(list, function test(_, addr) {
			var item = self.parse_addr(addr);
			self.log(addr + '=' + self.json_encode(item, 4));
		});
	}

	// plugin setup
	this.initialize = function initialize() {
		self.log('...');

		rcmail.insert_response = //
		self.rcube_webmail_insert_response.bind(rcmail);

		rcmail.editor.replace = //
		self.rcube_text_editor_replace.bind(rcmail.editor);
	}

	self.initialize();
	// self.test_parse_addr();

}

// plugin scope
if (rcmail && !rcmail.is_framed()) {

	// plugin instance
	rcmail.addEventListener('init', function(param) {
		plugin_responses.instance = new plugin_responses();
	});

}
