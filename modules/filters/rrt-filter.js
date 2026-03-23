/*\
title: $:/plugins/rimir/typed/modules/filters/rrt-filter.js
type: application/javascript
module-type: filteroperator

Generic filter operator for typed entities.
Keeps input titles that match all active filters stored at a filter-state base path.

Usage: [rrt-filter<filter-state>]

Requires variables in scope:
  type-key — the rrt.type key (e.g. "task")

Filter state convention:
  <filter-state>/<field-key> — tiddler whose text field contains the filter value
  - text fields: substring match (triggers at 3+ chars)
  - enum fields: space-separated selected values (match any)
  - reference fields: space-separated selected titles (match any)

\*/

"use strict";

exports["rrt-filter"] = function(source, operator, options) {
	var filterState = operator.operand,
		wiki = options.wiki,
		widget = options.widget,
		results = [];

	if(!filterState || !widget) {
		source(function(tiddler, title) { results.push(title); });
		return results;
	}

	// Get type-key from variable scope
	var typeKey = widget.getVariable("type-key");
	if(!typeKey) {
		source(function(tiddler, title) { results.push(title); });
		return results;
	}

	// Find the type tiddler and get its fields
	var typeTiddlers = wiki.filterTiddlers("[all[shadows+tiddlers]rrt.type[type]key[" + typeKey + "]]");
	if(typeTiddlers.length === 0) {
		source(function(tiddler, title) { results.push(title); });
		return results;
	}
	var typeTid = typeTiddlers[0];

	// Resolve fields via rrt.fields function (aggregated from type + parent)
	var fieldsStr = "";
	var variableInfo = widget.getVariableInfo("rrt.fields", {params: [], source: function(callback) {}});
	if(variableInfo && variableInfo.resultList) {
		fieldsStr = variableInfo.resultList.join(" ");
	} else if(variableInfo && variableInfo.text) {
		fieldsStr = variableInfo.text;
	}
	var fieldKeys = fieldsStr.split(/\s+/).filter(function(f) { return f.length > 0; });

	// Build active filters: collect field-keys that have non-blank filter values
	var activeFilters = [];
	fieldKeys.forEach(function(fieldKey) {
		var stateTiddlerTitle = filterState + "/" + fieldKey;
		var stateTiddler = wiki.getTiddler(stateTiddlerTitle);
		if(stateTiddler) {
			var filterValue = (stateTiddler.fields.text || "").trim();
			if(filterValue.length > 0) {
				// Look up field definition to determine typed
				var fieldTids = wiki.filterTiddlers("[all[shadows+tiddlers]rrt.type[field]key[" + fieldKey + "]]");
				var typed = "text";
				if(fieldTids.length > 0) {
					var fieldTid = wiki.getTiddler(fieldTids[0]);
					if(fieldTid) {
						typed = (fieldTid.fields.typed || "text").trim();
					}
				}
				activeFilters.push({
					fieldKey: fieldKey,
					filterValue: filterValue,
					typed: typed
				});
			}
		}
	});

	// If no active filters, pass everything through
	if(activeFilters.length === 0) {
		source(function(tiddler, title) { results.push(title); });
		return results;
	}

	// Check each input title against all active filters
	source(function(tiddler, title) {
		if(!tiddler) {
			tiddler = wiki.getTiddler(title);
		}
		if(!tiddler) return;

		var pass = true;
		for(var i = 0; i < activeFilters.length; i++) {
			var af = activeFilters[i];
			var itemValue = (tiddler.fields[af.fieldKey] || "").toString().trim();

			if(af.typed === "text") {
				// Text: substring search, only if filter is 3+ chars
				if(af.filterValue.length >= 3) {
					if(itemValue.toLowerCase().indexOf(af.filterValue.toLowerCase()) === -1) {
						pass = false;
						break;
					}
				}
			} else if(af.typed.indexOf("enum:") === 0) {
				// Enum: item value must be one of the selected values
				var selected = af.filterValue.split(/\s+/);
				if(selected.indexOf(itemValue) === -1) {
					pass = false;
					break;
				}
			} else if(af.typed === "date") {
				// Skip date filters for now
			} else {
				// Reference field: item value (may be space-separated list) must contain at least one selected
				var selectedRefs = af.filterValue.split(/\s+/);
				var itemRefs = itemValue.split(/\s+/);
				var hasMatch = selectedRefs.some(function(ref) {
					return itemRefs.indexOf(ref) !== -1;
				});
				if(!hasMatch) {
					pass = false;
					break;
				}
			}
		}

		if(pass) {
			results.push(title);
		}
	});

	return results;
};
