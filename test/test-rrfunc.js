/*\
title: $:/plugins/rimir/typed/test/test-rrfunc.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for typed rrfunc filter operator.

\*/
"use strict";

describe("typed: rrfunc filter operator", function() {

	var rrfuncModule;

	beforeEach(function() {
		rrfuncModule = require("$:/plugins/rimir/typed/modules/filters/rrfunc.js");
	});

	it("should export the rrfunc function", function() {
		expect(rrfuncModule.rrfunc).toBeDefined();
		expect(typeof rrfuncModule.rrfunc).toBe("function");
	});

	it("should return empty array when widget is null", function() {
		var source = function(callback) { callback({title: "input"}, "input"); };
		var operator = {operands: ["someFunc"]};
		var options = {widget: null};
		var result = rrfuncModule.rrfunc(source, operator, options);
		expect(result).toEqual([]);
	});

	it("should return empty array when widget is undefined", function() {
		var source = function(callback) { callback({title: "input"}, "input"); };
		var operator = {operands: ["someFunc"]};
		var options = {};
		var result = rrfuncModule.rrfunc(source, operator, options);
		expect(result).toEqual([]);
	});

	it("should return empty array when widget has no getVariableInfo", function() {
		var source = function(callback) { callback({title: "input"}, "input"); };
		var operator = {operands: ["someFunc"]};
		var options = {widget: {getVariable: function() { return undefined; }}};
		var result = rrfuncModule.rrfunc(source, operator, options);
		expect(result).toEqual([]);
	});

	it("should return empty array when getVariableInfo returns no srcVariable", function() {
		var source = function(callback) { callback({title: "input"}, "input"); };
		var operator = {operands: ["myFunc"]};
		var options = {
			widget: {
				getVariableInfo: function(name, opts) {
					return {text: "hello"};
				}
			}
		};
		var result = rrfuncModule.rrfunc(source, operator, options);
		expect(result).toEqual([]);
	});

	it("should return empty array when srcVariable is not a function definition", function() {
		var source = function(callback) { callback({title: "input"}, "input"); };
		var operator = {operands: ["myFunc"]};
		var options = {
			widget: {
				getVariableInfo: function(name, opts) {
					return {
						text: "hello",
						srcVariable: {isFunctionDefinition: false}
					};
				}
			}
		};
		var result = rrfuncModule.rrfunc(source, operator, options);
		expect(result).toEqual([]);
	});

	it("should return resultList when function definition provides it", function() {
		var source = function(callback) { callback({title: "input"}, "input"); };
		var operator = {operands: ["myFunc"]};
		var options = {
			widget: {
				getVariableInfo: function(name, opts) {
					return {
						text: "first",
						resultList: ["alpha", "beta", "gamma"],
						srcVariable: {isFunctionDefinition: true}
					};
				}
			}
		};
		var result = rrfuncModule.rrfunc(source, operator, options);
		expect(result).toEqual(["alpha", "beta", "gamma"]);
	});

	it("should return [text] when no resultList is present", function() {
		var source = function(callback) { callback({title: "input"}, "input"); };
		var operator = {operands: ["myFunc"]};
		var options = {
			widget: {
				getVariableInfo: function(name, opts) {
					return {
						text: "single-result",
						srcVariable: {isFunctionDefinition: true}
					};
				}
			}
		};
		var result = rrfuncModule.rrfunc(source, operator, options);
		expect(result).toEqual(["single-result"]);
	});

	it("should pass operands as params to getVariableInfo", function() {
		var source = function(callback) { callback({title: "input"}, "input"); };
		var operator = {operands: ["myFunc", "arg1", "arg2"]};
		var capturedParams;
		var options = {
			widget: {
				getVariableInfo: function(name, opts) {
					capturedParams = opts.params;
					return {
						text: "result",
						srcVariable: {isFunctionDefinition: true}
					};
				}
			}
		};
		rrfuncModule.rrfunc(source, operator, options);
		expect(capturedParams).toEqual([{value: "arg1"}, {value: "arg2"}]);
	});

	it("should pass the correct function name to getVariableInfo", function() {
		var source = function(callback) { callback({title: "input"}, "input"); };
		var operator = {operands: ["MySpecialFunc"]};
		var capturedName;
		var options = {
			widget: {
				getVariableInfo: function(name, opts) {
					capturedName = name;
					return {
						text: "ok",
						srcVariable: {isFunctionDefinition: true}
					};
				}
			}
		};
		rrfuncModule.rrfunc(source, operator, options);
		expect(capturedName).toBe("MySpecialFunc");
	});

	it("should pass source function to getVariableInfo options", function() {
		var mySource = function(callback) { callback({title: "t"}, "t"); };
		var operator = {operands: ["fn"]};
		var capturedSource;
		var options = {
			widget: {
				getVariableInfo: function(name, opts) {
					capturedSource = opts.source;
					return {
						text: "ok",
						srcVariable: {isFunctionDefinition: true}
					};
				}
			}
		};
		rrfuncModule.rrfunc(mySource, operator, options);
		expect(capturedSource).toBe(mySource);
	});

	it("should return empty params array when only function name is given", function() {
		var source = function(callback) { callback({title: "t"}, "t"); };
		var operator = {operands: ["fn"]};
		var capturedParams;
		var options = {
			widget: {
				getVariableInfo: function(name, opts) {
					capturedParams = opts.params;
					return {
						text: "ok",
						srcVariable: {isFunctionDefinition: true}
					};
				}
			}
		};
		rrfuncModule.rrfunc(source, operator, options);
		expect(capturedParams).toEqual([]);
	});
});
