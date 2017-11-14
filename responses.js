//
// Roundcube Responses Plugin
//

// plugin class
plugin_responses = function plugin_responses() {
	var self = this;

	// plugin name space
	this.key = function key(name) {
		return 'plugin.responses.' + name; // keep in sync with *.php
	}

	// environment variable
	this.env = function env(name) {
		return rcmail.env[self.key(name)];
	}

	// plugin client logger
	this.log = function log(text, force) {
		if (self.env('enable_logging') || force) {
			if (console && console.log) {
				var name = arguments.callee.caller.name;
				var entry = self.key(name);
				var color = force ? 'color: #8B0000' : 'color: #000080'; // red:blue
				console.log('%c' + entry + ': ' + text, color);
			}
		}
	};

	// provide localization
	this.localize = function localize(name) {
		return rcmail.get_label(name, 'responses');
	}

	// capitalize first letter
	this.cap = function cap(text) {
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	// guess 'full/head/tail' from 'name'
	this.parse_name = function parse_name(item) {
		var name = item.name.trim();

		// "tail, head" user@host
		if (name.indexOf(',') >= 0) {
			var split = name.split(',');
			item.head = self.cap(split[split.length - 1].trim());
			item.tail = self.cap(split[0].trim());
			item.full = item.head + ' ' + item.tail;
			return;
		}

		// "head tail" user@host
		if (name.indexOf(' ') >= 0) {
			var split = name.split(' ');
			item.head = self.cap( (split[0].trim()));
			item.tail = self.cap(split[split.length - 1].trim());
			item.full = item.head + ' ' + item.tail;
			return;
		}

		// head.tail@host
		if (name.indexOf('.') >= 0) {
			var split = name.split('.');
			item.head = self.cap( (split[0].trim()));
			item.tail = self.cap(split[split.length - 1].trim());
			item.full = item.head + ' ' + item.tail;
			return;
		}

		// user@host
		{
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
			text: text,
			name: '',
			full: '',
			head: '',
			tail: '',
			mail: '',
		};
		// empty entry
		if (text.length == 0) {
			return item;
		}
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
		// catch-all
		self.log('unsupported addr format', true);
		return item;
	}

	// function replacement: see editor.js/rcube_text_editor.replace()
	this.rcube_text_editor_replace = function rcube_text_editor_replace(text,
	format) {
		self.log('not used since rcmail v 1.3', true);
	};

	// function replacement: see app.js/rcube_webmail.insert_response()
	this.rcube_webmail_insert_response = function rcube_webmail_insert_response(key) {
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

		var form_subj = $('form #compose-subject');
		if (!form_subj.length) {
			self.log('invalid form_subj', true);
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

		var subj_text = form_subj.val();
		var from_text = form_from.text();
		var to_text = form_to.text();
		var cc_text = form_cc.text();

		self.log('subj_text: ' + subj_text);
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
			subj: subj_text,
			from_text: from_text,
			from_name: from.name,
			from_full: from.full,
			from_head: from.head,
			from_tail: from.tail,
			from_mail: from.mail,
			to_text: to_text,
			to_name: make_list(to_list, 'name'),
			to_full: make_list(to_list, 'full'),
			to_head: make_list(to_list, 'head'),
			to_tail: make_list(to_list, 'tail'),
			to_mail: make_list(to_list, 'mail'),
			cc_text: cc_text,
			cc_name: make_list(cc_list, 'name'),
			cc_full: make_list(cc_list, 'full'),
			cc_head: make_list(cc_list, 'head'),
			cc_tail: make_list(cc_list, 'tail'),
			cc_mail: make_list(cc_list, 'mail'),
		};

		var format = self.detect_format(response);
		var origin = self.var_subst(template, mapping);
		var directive_list = self.directive_extract(origin)
		var result = self.directive_remove(origin);

		self.log('format=' + format);
		self.log('mapping=' + self.json_encode(mapping, 4));

		// see editor.js/replace
		var input = { };
		switch (format) {
		case 'html':
			input.html = result;
			break;
		case 'text':
			input.text = result;
			break;
		default:
			input.text = result;
			self.log("invalid format=" + format, true);
		}

		// apply changes to compose message
		function perform_insert() {
			rcmail.editor.replace(input);
			self.directive_apply(directive_list);
		}

		if (self.env('switch_format')) {
			if (self.switch_format(format)) {
				// time for editor replacement
				window.setTimeout(perform_insert, 250);
			}
		} else {
			perform_insert();
		}

	}

	// erase directives from the response text
	this.directive_remove = function directive_remove(response) {
		var source = response.split('\n');
		var target = [];
		var rx = new RegExp(self.env('directive_pattern'), 'i');
		for (var item = 0; item < source.length; item++) {
			var line = source[item];
			if (rx.test(line)) {
				continue;
			} else {
				target.push(line);
			}
		}
		return target.join('\n');
	}

	// apply directives to the live compose message
	this.directive_apply = function directive_apply(directive_list) {
		$.each(directive_list, function apply(_, directive) {
				switch (directive.key) {
				case 'subject_replace':
					self.subject_replace(directive.value);
					break;
				default:
					self.log("invalid directive=" + directive.key, true);
				}
			})
	}

	// extract directive list from response text
	this.directive_extract = function directive_extract(response) {
		var source = response.split('\n');
		var target = [];
		var rx = new RegExp(self.env('directive_pattern'), 'i');
		for (var item = 0; item < source.length; item++) {
			var line = source[item];
			if (rx.test(line)) {
				var directive = { };
				var match = rx.exec(line);
				directive.key = match[1];
				directive.value = match[2];
				target.push(directive);
			}
		}
		return target;
	}

	// directive: replace response subject
	this.subject_replace = function subject_replace(value) {
		var form_subj = $('form #compose-subject');
		if (form_subj.length == 0) {
			self.log('invalid subject input', true);
			return false;
		}
		self.log('value=' + value);
		form_subj.val(value);
	}

	// change editor mode (text vs html)
	this.switch_format = function switch_format(format) {
		var select = $('select[name=editorSelector]');
		if (select.length == 0) {
			self.log('invalid select', true);
			return false;
		}
		if (format == 'html' && select.val() == 'html') {
			self.log('keep: ' + format);
			return true;
		}
		if (format == 'text' && select.val() == 'plain') {
			self.log('keep: ' + format);
			return true;
		}
		self.log('change: ' + format);
		var result = rcmail.toggle_editor({
			html: (format == 'html'),
		});
		if (result) {
			switch (format) {
			case 'html':
				select.val('html');
				break;
			case 'text':
				select.val('plain');
				break;
			default:
				self.log('invalid format result: ' + format, true);
			}
		}
		return result;
	}

	// workaround for missing 'format' in rcmail/settings ui
	this.detect_format = function detect_format(response) {
		var name = response.name || '';
		var rx_name = new RegExp(self.env('format_regex_name'), 'i');
		if (rx_name.test(name.trim())) {
			self.log('matched: name');
			return 'html';
		}
		var text = response.text || '';
		var rx_text = new RegExp(self.env('format_regex_text'), 'i');
		if (rx_text.test(text.trim())) {
			self.log('matched: text');
			return 'html';
		}
		if (response.format) {
			self.log('defined: item');
			return response.format; // FIXME settings support
		}
		return 'text';
	}

	// convert object to text
	this.json_encode = function json_encode(json, tabs) {
		return JSON.stringify(json, null, tabs);
	}

	// convert text to object
	this.json_decode = function json_decode(text) {
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

	// verify addr/name parser during development
	this.test_parse_addr = function test_parse_addr() {
		// data set
		var list = [//
			{
				source: 'user@host',
				target: {
					"text": "user@host",
					"name": "user",
					"full": "User",
					"head": "User",
					"tail": "User",
					"mail": "user@host",
				}
			}, {
				source: '<user@host>',
				target: {
					"text": "<user@host>",
					"name": "user",
					"full": "User",
					"head": "User",
					"tail": "User",
					"mail": "user@host",
				}
			}, {
				source: 'name user@host',
				target: {
					"text": "name user@host",
					"name": "name",
					"full": "Name",
					"head": "Name",
					"tail": "Name",
					"mail": "user@host",
				}
			}, {
				source: 'name <user@host>',
				target: {
					"text": "name <user@host>",
					"name": "name",
					"full": "Name",
					"head": "Name",
					"tail": "Name",
					"mail": "user@host",
				}
			}, {
				source: '"name" <user@host>',
				target: {
					"text": "\"name\" <user@host>",
					"name": "name",
					"full": "Name",
					"head": "Name",
					"tail": "Name",
					"mail": "user@host",
				}
			}, {
				source: 'head.tail@host',
				target: {
					"text": "head.tail@host",
					"name": "head.tail",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "head.tail@host",
				}
			}, {
				source: 'head.body.tail@host',
				target: {
					"text": "head.body.tail@host",
					"name": "head.body.tail",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "head.body.tail@host",
				}
			}, {
				source: 'head tail user@host',
				target: {
					"text": "head tail user@host",
					"name": "head tail",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "user@host",
				}
			}, {
				source: 'head body tail user@host',
				target: {
					"text": "head body tail user@host",
					"name": "head body tail",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "user@host",
				}
			}, {
				source: 'head tail <user@host>',
				target: {
					"text": "head tail <user@host>",
					"name": "head tail",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "user@host",
				}
			}, {
				source: 'head body tail <user@host>',
				target: {
					"text": "head body tail <user@host>",
					"name": "head body tail",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "user@host",
				}
			}, {
				source: '"head tail" <user@host>',
				target: {
					"text": "\"head tail\" <user@host>",
					"name": "head tail",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "user@host",
				}
			}, {
				source: 'tail, head <user@host>',
				target: {
					"text": "tail, head <user@host>",
					"name": "tail, head",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "user@host",
				}
			}, {
				source: 'tail, head body <user@host>',
				target: {
					"text": "tail, head body <user@host>",
					"name": "tail, head body",
					"full": "Head body Tail",
					"head": "Head body",
					"tail": "Tail",
					"mail": "user@host",
				}
			}, {
				source: 'tail, body, head <user@host>',
				target: {
					"text": "tail, body, head <user@host>",
					"name": "tail, body, head",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "user@host",
				}
			}, {
				source: '"tail, head" <user@host>',
				target: {
					"text": "\"tail, head\" <user@host>",
					"name": "tail, head",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "user@host",
				}
			}, {
				source: '"tail, head body" <user@host>',
				target: {
					"text": "\"tail, head body\" <user@host>",
					"name": "tail, head body",
					"full": "Head body Tail",
					"head": "Head body",
					"tail": "Tail",
					"mail": "user@host",
				}
			}, {
				source: '"tail, body, head" <user@host>',
				target: {
					"text": "\"tail, body, head\" <user@host>",
					"name": "tail, body, head",
					"full": "Head Tail",
					"head": "Head",
					"tail": "Tail",
					"mail": "user@host",
				}
			},
			];
		// apply tests
		$.each(list, function test(_, entry) {
				var source = entry.source;
				var target = entry.target;
				var item = self.parse_addr(source);
				var is_ok = true;
				for (var key in target) {
					if (target[key] != item[key]) {
						is_ok = false;
					}
				}
				// report errors
				if (!is_ok) {
					self.log(source + '=' + self.json_encode(item, 4), true);
				}
			});
	}

	//
	this.is_plugin_active = function is_plugin_active() {
		return self.env('activate_plugin');
	}

	// plugin setup
	this.initialize = function initialize() {

		if (self.is_plugin_active()) {
			self.log('enabled');
		} else {
			self.log('disabled');
			return;
		}

		rcmail.env.editor_warned = self.env('editor_warned');

		rcmail.insert_response = //
		self.rcube_webmail_insert_response.bind(rcmail);

		// not used
		//		rcmail.editor.replace = //
		//			self.rcube_text_editor_replace.bind(rcmail.editor);
	}

	self.initialize();
	self.test_parse_addr();

}

// plugin scope
if (window.rcmail && !rcmail.is_framed()) {

	// plugin instance
	rcmail.addEventListener('init', function(param) {
			plugin_responses.instance = new plugin_responses();
		});

}
