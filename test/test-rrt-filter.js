/*\
title: $:/plugins/rimir/typed/test/test-rrt-filter.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for typed rrt-filter filter operator.

\*/
"use strict";

describe("typed: rrt-filter operator", function() {

	var rrtFilterModule;

	beforeEach(function() {
		rrtFilterModule = require("$:/plugins/rimir/typed/modules/filters/rrt-filter.js");
	});

	function makeSource(titles) {
		return function(callback) {
			for(var i = 0; i < titles.length; i++) {
				var title = titles[i];
				callback(title.tiddler || null, title.title || title);
			}
		};
	}

	function makeSourceSimple(titlesArray) {
		return function(callback) {
			for(var i = 0; i < titlesArray.length; i++) {
				callback(null, titlesArray[i]);
			}
		};
	}

	it("should export the rrt-filter function", function() {
		expect(rrtFilterModule["rrt-filter"]).toBeDefined();
		expect(typeof rrtFilterModule["rrt-filter"]).toBe("function");
	});

	it("should pass all titles through when widget is null", function() {
		var source = makeSourceSimple(["A", "B", "C"]);
		var operator = {operand: "$:/state/filter"};
		var result = rrtFilterModule["rrt-filter"](source, operator, {widget: null, wiki: null});
		expect(result).toEqual(["A", "B", "C"]);
	});

	it("should pass all titles through when filterState is empty", function() {
		var source = makeSourceSimple(["A", "B"]);
		var operator = {operand: ""};
		var widget = {getVariable: function() { return "task"; }};
		var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: new $tw.Wiki()});
		expect(result).toEqual(["A", "B"]);
	});

	it("should pass all titles through when type-key variable is missing", function() {
		var source = makeSourceSimple(["A", "B"]);
		var operator = {operand: "$:/state/filter"};
		var widget = {getVariable: function() { return undefined; }};
		var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: new $tw.Wiki()});
		expect(result).toEqual(["A", "B"]);
	});

	it("should pass all titles through when type tiddler not found", function() {
		var wiki = new $tw.Wiki();
		var source = makeSourceSimple(["A", "B"]);
		var operator = {operand: "$:/state/filter"};
		var widget = {
			getVariable: function() { return "nonexistent"; },
			getVariableInfo: function() { return {resultList: []}; }
		};
		var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
		expect(result).toEqual(["A", "B"]);
	});

	describe("with full wiki setup", function() {
		var wiki, widget;

		beforeEach(function() {
			wiki = new $tw.Wiki();
			wiki.addIndexersToWiki();

			// Type definition for "task"
			wiki.addTiddler({title: "Type: Task", "rrt.type": "type", key: "task", text: ""});

			// Field definitions
			wiki.addTiddler({title: "Field: Name", "rrt.type": "field", key: "name", typed: "text"});
			wiki.addTiddler({title: "Field: Status", "rrt.type": "field", key: "status", typed: "enum:open closed"});
			wiki.addTiddler({title: "Field: Owner", "rrt.type": "field", key: "owner", typed: "reference"});

			// Test data tiddlers
			wiki.addTiddler({title: "Task1", "rrt.type": "task", name: "Fix login bug", status: "open", owner: "Alice"});
			wiki.addTiddler({title: "Task2", "rrt.type": "task", name: "Add dashboard", status: "closed", owner: "Bob"});
			wiki.addTiddler({title: "Task3", "rrt.type": "task", name: "Update login page", status: "open", owner: "Alice Bob"});

			widget = {
				getVariable: function(name) {
					if(name === "type-key") return "task";
					return undefined;
				},
				getVariableInfo: function(name, opts) {
					if(name === "rrt.fields") {
						return {resultList: ["name", "status", "owner"]};
					}
					return null;
				}
			};
		});

		function sourceWithTiddlers(titles) {
			return function(callback) {
				for(var i = 0; i < titles.length; i++) {
					var t = wiki.getTiddler(titles[i]);
					callback(t, titles[i]);
				}
			};
		}

		it("should pass all through when no filter state tiddlers exist", function() {
			var source = sourceWithTiddlers(["Task1", "Task2", "Task3"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1", "Task2", "Task3"]);
		});

		it("should filter by text substring (3+ chars)", function() {
			wiki.addTiddler({title: "$:/state/filter/name", text: "login"});
			var source = sourceWithTiddlers(["Task1", "Task2", "Task3"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1", "Task3"]);
		});

		it("should skip text filter shorter than 3 chars", function() {
			wiki.addTiddler({title: "$:/state/filter/name", text: "lo"});
			var source = sourceWithTiddlers(["Task1", "Task2", "Task3"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1", "Task2", "Task3"]);
		});

		it("should be case-insensitive for text search", function() {
			wiki.addTiddler({title: "$:/state/filter/name", text: "LOGIN"});
			var source = sourceWithTiddlers(["Task1", "Task2", "Task3"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1", "Task3"]);
		});

		it("should filter by enum field (exact match from selected values)", function() {
			wiki.addTiddler({title: "$:/state/filter/status", text: "open"});
			var source = sourceWithTiddlers(["Task1", "Task2", "Task3"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1", "Task3"]);
		});

		it("should filter by enum with multiple selected values", function() {
			wiki.addTiddler({title: "$:/state/filter/status", text: "open closed"});
			var source = sourceWithTiddlers(["Task1", "Task2", "Task3"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1", "Task2", "Task3"]);
		});

		it("should filter by reference field (any match)", function() {
			wiki.addTiddler({title: "$:/state/filter/owner", text: "Alice"});
			var source = sourceWithTiddlers(["Task1", "Task2", "Task3"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1", "Task3"]);
		});

		it("should match reference when item has space-separated values", function() {
			wiki.addTiddler({title: "$:/state/filter/owner", text: "Bob"});
			var source = sourceWithTiddlers(["Task1", "Task2", "Task3"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task2", "Task3"]);
		});

		it("should combine multiple filters with AND logic", function() {
			wiki.addTiddler({title: "$:/state/filter/status", text: "open"});
			wiki.addTiddler({title: "$:/state/filter/owner", text: "Alice"});
			var source = sourceWithTiddlers(["Task1", "Task2", "Task3"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1", "Task3"]);
		});

		it("should skip blank filter values", function() {
			wiki.addTiddler({title: "$:/state/filter/name", text: "   "});
			var source = sourceWithTiddlers(["Task1", "Task2", "Task3"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1", "Task2", "Task3"]);
		});

		it("should exclude items with empty field value for enum filter", function() {
			wiki.addTiddler({title: "Task4", "rrt.type": "task", name: "No status", status: "", owner: "Carol"});
			wiki.addTiddler({title: "$:/state/filter/status", text: "open"});
			var source = sourceWithTiddlers(["Task1", "Task4"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1"]);
		});

		it("should handle tiddler not in wiki gracefully via source callback", function() {
			var source = function(callback) {
				callback(null, "NonExistent");
				callback(wiki.getTiddler("Task1"), "Task1");
			};
			wiki.addTiddler({title: "$:/state/filter/status", text: "open"});
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: widget, wiki: wiki});
			expect(result).toEqual(["Task1"]);
		});

		it("should handle field definition not found (defaults to text type)", function() {
			// Add a filter state for a field that has no definition tiddler
			wiki.addTiddler({title: "$:/state/filter/unknown-field", text: "test"});
			// Widget returns field list including unknown-field
			var customWidget = {
				getVariable: function(name) {
					if(name === "type-key") return "task";
					return undefined;
				},
				getVariableInfo: function(name) {
					if(name === "rrt.fields") {
						return {resultList: ["unknown-field"]};
					}
					return null;
				}
			};
			var source = sourceWithTiddlers(["Task1"]);
			var operator = {operand: "$:/state/filter"};
			var result = rrtFilterModule["rrt-filter"](source, operator, {widget: customWidget, wiki: wiki});
			// "test" is 4 chars, Task1 doesn't have "unknown-field", so empty string doesn't contain "test"
			expect(result).toEqual([]);
		});
	});
});
