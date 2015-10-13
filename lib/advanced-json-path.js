function JSONPath(root, path) {
	var _TOKENS_ = ['..', '.', '[',  ']', '(', ')', '{', '}', '"', "'", '*', '?', ':', ',', '$', '@'];
	var _RE_TOKENS_ = [];
	
	var _NESTED_ = [];
	
	function escapeRegExp(str){
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	
	function Tree() {
		this.tree = [];
		
		this.push = function (node) {
			if (node === false) {
				return;
			}
			
			if (node instanceof Tree) {
				for (var i in node.tree) {
					this.tree.push(node.tree[i]);
				}
				return;
			}
			
			this.tree.push(node);
		}
		
		this.at = function (i) {
			if (typeof this.tree[i] == 'undefined') {
				return false;
			}
			return this.tree[i];
		},
		
		this.normalize = function () {
			if (this.tree.length == 0) {
				return false;
			}
			
			if (this.tree.length == 1) {
				return this.tree[0];
			}
			
			return this;
		}
	}
	
	var parser = {
		
		normalize_quotes: function (tokens) {
			var i=0;
			var quoted = false;
			var quote = false;
			while (i<tokens.length) {
				if (quote === false && (tokens[i] == '"' || tokens[i] == "'")) {
					quote = tokens[i];
				}
				
				var isQuote = (quote === tokens[i]);
				
				if (quoted) {
					tokens[i-1] += tokens.splice(i, 1)[0];
				} else {
					i++;
				}
				
				if (isQuote) {
					quoted = !quoted;
					if (!quoted) {
						quote = false;
					}
				}
			}
			
			if (quoted) {
				throw new Error(quote+' expected');
			}
		},
		
		normalize_brackets: function (open, close, tokens, i, level) {
			if (typeof i == 'undefined') {
				i = 0;
			}
			if (typeof level == 'undefined') {
				level = 0;
			}
			var inBracket = false;
			while (i < tokens.length) {
				var isOpen = (tokens[i] == open);
				var isClose = (tokens[i] == close);
				if (inBracket) {
					if (isOpen) {
						this.normalize_brackets(open, close, tokens, i, level+1);
					}
					
					var current = tokens.splice(i, 1)[0];
					if (isClose) {
						inBracket = false;
						this.normalize_brackets(open, close, tokens[i-1].tokens);
						if (level > 0) {
							return;
						}
					} else {
						tokens[i-1].tokens.push(current);
					}
				} else {
					if (isClose) {
						throw new Error('Unexpected '+close);
					}
					inBracket = isOpen;
					if (inBracket) {
						tokens[i] = {
							bracket: open+close,
							tokens: []
						};
					} else {
						if (typeof tokens[i] == 'object') {
							this.normalize_brackets(open, close, tokens[i].tokens);
						}
					}
					i++;
				}
			}
			
			if (inBracket) {
				throw new Error(close + ' expected');
			}
		},
		
		normalize_empty: function (tokens, trim) {
			var i = 0;
			while (i < tokens.length) {
				if (typeof tokens[i] == 'string') {
					if (
						tokens[i] === '' || 
						(trim && tokens[i].trim() === '')
					) {
						tokens.splice(i, 1);
						continue;
					}
					if (trim) {
						tokens[i] = tokens[i].trim();
					}
				}
				i++;
			}
		},
		
		normalize_dots: function (tokens) {
			var i = 0;
			var dot = false;
			while (i < tokens.length) {
				var isDot = (
					tokens[i] === '.' || 
					tokens[i] === '..'
				);
				
				if (dot && isDot) {
					throw new Error('Unexpected .');
				}
				
				dot = isDot;
				i++;
			}
		},
		
		normalize: function (path) {
			var tokens = path.split(
				new RegExp(
					'('+_RE_TOKENS_.join('|')+')'
				)
			);
			
			this.normalize_empty(tokens, false);
			this.normalize_quotes(tokens);
			this.normalize_empty(tokens, true);
			this.normalize_dots(tokens);
			this.normalize_brackets('[', ']', tokens);
			this.normalize_brackets('(', ')', tokens);
			this.normalize_brackets('{', '}', tokens);
			
			return tokens;
		},
		
		traverse_property: function (object, property) {
			if (typeof property == 'object') {
				var result = new Tree();
				for (var i in property) {
					result.push(
						this.traverse_property(object, property[i])
					);
				}
				return result.normalize();
			}
			
			if (object instanceof Tree) {
				var result = new Tree();
				for (var i in object.tree) {
					result.push(
						this.traverse_property(object.tree[i], property)
					);
				}
				return result.normalize();
			}
			
			if (
				typeof object == 'string' || 
				typeof object == 'undefined' ||
				typeof object[property] == 'undefined'
			) {
				return false;
			}
			
			return object[property];
		},
		
		traverse_properties: function (object) {
			if (typeof object != 'object') {
				return false;
			}
			
			var recursive = false;
			var result = new Tree();
			
			if (object instanceof Tree) {
				object = object.tree;
				recursive = true;
			}
			
			for (var i in object) {
				if (typeof object[i] == 'object') {
					result.push(
						recursive ?
							this.traverse_properties(object[i])
							:
							object[i]
					);
				}
			}
			
			return result.normalize();
		},
		
		traverse_tree: function (object) {
			var result = new Tree();
			if (typeof object != 'object') {
				return result;
			}
			
			result.push(object);
			for (var i in object) {
				result.push(
					this.traverse_tree(object[i])
				);
			}
			
			return result;
		},
		
		traverse_expression: function (object, token, refNested) {
			if (typeof refNested == 'undefined') {
				refNested = false;
			}
			
			var expression = '';
			if (object instanceof Tree) {
				object = object.tree;
			}
			
			if (typeof token == 'object') {
				if (token.bracket == '[]') {
					throw new Error('Unexpected []');
				}
				
				if (token.bracket == '{}') {
					var nestedID = _NESTED_.length;
					_NESTED_[nestedID] = this.traverse(object, token.tokens);
					return (refNested ?
						'_NESTED_['+nestedID+']'
						:
						_NESTED_[nestedID]
					);
				}
				
				for (var i in token.tokens) {
					if (typeof token.tokens[i] == 'object') {
						expression += this.traverse_expression(object, token.tokens[i], true);
					} else if (token.tokens[i] === '$') {
						expression += 'root';
					} else if (token.tokens[i] === '@') {
						expression += 'object';
					} else {
						expression += token.tokens[i];
					}
				}
			} else if (typeof token == 'string') {
				expression = token;
			}
			
			try {
				return eval(expression);
			} catch (e) {
				return false;
			}
		},
		
		traverse_index: function (object, token) {
			if (_TOKENS_.indexOf(token) >= 0) {
				if (token == '*') {
					return object;
				}
				throw new Error('Unexpected '+token);
			}
			var index = this.traverse_expression(object, token);
			return this.traverse_property(object, index);
		},
		
		traverse_condition: function (object, token) {
			if (typeof token == 'string') {
				throw new Error('Unexpected '+token);
			}
			if (token.bracket != '()') {
				throw new Error('Unexpected '+token.bracket);
			}
			
			if (this.traverse_expression(object, token)) {
				return object;
			}
			
			var result = new Tree;
			for (var i in object) {
				if (this.traverse_expression(object[i], token)) {
					result.push(object[i]);
				}
			}
			return result.normalize();
		},

		traverse_slice: function (object, tokens) {
			if (typeof object.slice == 'undefined') {
				return false;
			}
			if (tokens.length == 2) {
				return object.slice(
					this.traverse_expression(object, tokens[0])
				);
			}
			return object.slice(
				this.traverse_expression(object, tokens[0]), 
				this.traverse_expression(object, tokens[2])
			);
		},

		traverse_union: function (object, tokens) {
			var i = 1;
			while (i < tokens.length) {
				var comma = tokens.splice(i,1);
				if (comma != ',') {
					throw new Error(', expected');
				}
				i++;
			}
			
			var result = new Tree();
			for (i=0; i < tokens.length; i++) {
				if (_TOKENS_.indexOf(tokens[i]) >= 0) {
					throw new Error('Unexpected '+tokens[i]);
				}
				result.push(
					this.traverse_index(object, tokens[i])
				);
			}
			
			return result.normalize();
		},
		
		traverse_filter: function (object, tokens) {
			if (object instanceof Tree) {
				object = object.tree;
			}
			
			if (tokens.length == 0) {
				// none
				return object;
			} else if (tokens.length == 1) {
				// index
				return this.traverse_index(object, tokens[0]);
			} else if (tokens.length == 2 && tokens[0] == '?') {
				// condition
				return this.traverse_condition(object, tokens[1]);
			} else if (
				(tokens.length == 2 || tokens.length == 3) && 
				tokens[1] == ':'
			) {
				// slice
				return this.traverse_slice(object, tokens);
			} else if (tokens.length >= 3) {
				// union
				return this.traverse_union(object, tokens);
			}
			throw new Error('Unknown filter expression');
		},
		
		traverse: function (object, tokens) {
			for (var i=0; i<tokens.length; i++) {
				var current_token = tokens[i];
				
				if (current_token === '$') {
					object = root;
				} else if (current_token === '@') {
					continue;
				} else if (current_token === '.') {
					continue;
				} else if (current_token === '*') {
					object = this.traverse_properties(object);
				} else if (current_token === '..') {
					object = this.traverse_tree(object);
				} else if (typeof current_token == 'string') {
					if (_TOKENS_.indexOf(current_token) >= 0) {
						throw new Error('Unexpected '+current_token);
					}
					object = this.traverse_property(object, current_token);
				} else if (typeof current_token == 'object') {
					if (current_token.bracket == '{}') {
						throw new Error('Unexpected {}');
					} else if (current_token.bracket == '[]') {
						object = this.traverse_filter(object, current_token.tokens);
					} else if (current_token.bracket == '()') {
						object = this.traverse_property(
							object, 
							this.traverse_expression(object, current_token)
						);
					}
				}
			}
			
			if (object instanceof Tree) {
				return object.tree;
			}
			
			return object;
		}
	};
	
	if (_RE_TOKENS_.length == 0) {
		// _RE_TOKENS_ initialization
		for (var i=0; i<_TOKENS_.length; i++) {
			_RE_TOKENS_.push(
				escapeRegExp(_TOKENS_[i])
			);
		}
	}
	
	// _NESTED_ initialization
	_NESTED_ = [];
	
	return parser.traverse(
		root, 
		parser.normalize(path)
	);
}

if (typeof module === 'undefined') {
	window.JSONPath = JSONPath;
} else {
	module.exports = JSONPath;
}
