﻿define(['F2'], function(F2) {

	describe('F2', function() {

		beforeEach(function() {
			window.test = {};
		});

		describe('config', function() {

			it('should not throw with unrecognized keys', function() {
				function set() {
					F2.config({
						__test__: true
					});
				}

				expect(set).not.toThrow();
			});

			it('should return current config when called', function() {
				expect(F2.config()).toBeDefined();
			});

			it('should not set loadDependencies if the config.loadDependencies is not a function', function() {
				var resetConfig = F2.config({
					loadDependencies: null
				});
				var setConfig = F2.config({
					loadDependencies: ""
				});
				expect(setConfig.loadDependencies).toBe(null);
			});

			it('should not set loadInlineScripts if the config.loadInlineScripts is not a function', function() {
				var resetConfig = F2.config({
					loadInlineScripts: null
				});
				var setConfig = F2.config({
					loadInlineScripts: ""
				});
				expect(setConfig.loadInlineScripts).toBe(null);
			});

			it('should not set loadScripts if the config.loadScripts is not a function', function() {
				var resetConfig = F2.config({
					loadScripts: null
				});
				var setConfig = F2.config({
					loadScripts: ""
				});
				expect(setConfig.loadScripts).toBe(null);
			});

			it('should not set loadStyles if the config.loadStyles is not a function', function() {
				var resetConfig = F2.config({
					loadStyles: null
				});
				var setConfig = F2.config({
					loadStyles: ""
				});
				expect(setConfig.loadStyles).toBe(null);
			});

			it('should not set ui.modal if the config.ui.modal is not a function', function() {
				var resetConfig = F2.config({
					ui: {
						modal: null
					}
				});
				var setConfig = F2.config({
					ui: {
						modal: ""
					}
				});
				expect(setConfig.ui.modal).toBe(null);
			});

			it('should not set ui.toggleLoading if the config.ui.toggleLoading is not a function', function() {
				var resetConfig = F2.config({
					ui: {
						toggleLoading: null
					}
				});
				var setConfig = F2.config({
					ui: {
						toggleLoading: ""
					}
				});
				expect(setConfig.ui.toggleLoading).toBe(null);
			});

		});

		describe('guid', function() {

			it('should be unique over 100,000 iterations', function() {
				var seen = {};
				var iterations = 100000;
				var allUnique = true;

				while (iterations--) {
					var guid = F2.guid();

					if (seen[guid]) {
						allUnique = false;
						break;
					}

					seen[guid] = true;
				}

				expect(allUnique).toBe(true);
			});

			// http://www.cryptosys.net/pki/uuid-rfc4122.html
			it('should be RFC4122 v4 compliant', function() {
				var guid = F2.guid();
				var complies = false;
				var conditions = [
					// Should be 36 characters
					function() {
						return guid.length === 36;
					},
					// First char of 3rd block should be 4
					// First char of 4th block should be a, b, 8, or 9
					function() {
						return guid[14] === "4" && ({
							8: true,
							9: true,
							a: true,
							b: true
						})[guid[19]];
					},
					// There should be 5 blocks
					// Block 1 should be 8 chars
					// Block 2 should be 4 chars
					// Block 3 should be 4 chars
					// Block 4 should be 4 chars
					// Block 5 should be 12 chars
					function() {
						var blocks = guid.split("-");

						return blocks.length === 5 && blocks[0].length === 8 && blocks[1].length === 4 && blocks[2].length === 4 && blocks[3].length === 4 && blocks[4].length === 12;
					}
				];

				// Test all conditions
				for (var i = 0, len = conditions.length; i < len; i++) {
					complies = conditions[i]();

					if (!complies) {
						break;
					}
				}

				expect(complies).toBe(true);
			});

		});

		describe('load', function() {

			it('should pass loaded manifest to the callback', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/single'
				}];

				F2.load(configs, function(manifests) {
					expect(manifests.length).toBe(1);
					F2.unload(manifests);
					done();
				});
			});

			it('should pass an error instead of manifest to the callback when requests fail', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/error'
				}];

				F2.load(configs, function(manifests) {
					expect(manifests[0].error).toBeDefined();
					done();
				});
			});

			it('should load a single app on same domain', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/single'
				}];

				F2.load(configs, function(manifests) {
					expect(window.test.com_test_basic).toBeDefined();
					F2.unload(manifests);
					done();
				});
			});

			it('should change relative script/style paths to be absolute', function(done) {
				var scriptsWorked = false;
				var stylesWorked = false;

				F2.config({
					loadScripts: function(scripts, cb) {
						scriptsWorked = (
							scripts[0].indexOf('../') === -1 &&
							scripts[1].indexOf('./') === -1 &&
							scripts[2].indexOf('//') !== -1
						);

						require([scripts[0]], function() {
							cb();
						});
					},
					loadStyles: function(styles, cb) {
						stylesWorked = styles[0].indexOf('../') === -1;
						cb();
					}
				});

				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/paths'
				}];

				F2.load(configs, function(manifests) {
					expect(scriptsWorked).toBe(true);
					expect(stylesWorked).toBe(true);
					F2.unload(manifests);

					// Undo our config
					F2.config({
						loadScripts: null,
						loadStyles: null
					});

					done();
				});
			});

			it('should load multiple unbatched apps on same domain', function(done) {

				console.info(F2.config());

				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/single'
				}, {
					appId: 'com_test_inherited',
					manifestUrl: '/apps/single'
				}];

				F2.load(configs, function(manifests) {
					expect(window.test.com_test_basic).toBeDefined();
					expect(window.test.com_test_inherited).toBeDefined();
					F2.unload(manifests);
					done();
				});
			});

			it('should load multiple batched apps on same domain', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/multiple',
					enableBatchRequests: true
				}, {
					appId: 'com_test_inherited',
					manifestUrl: '/apps/multiple',
					enableBatchRequests: true
				}];

				F2.load(configs, function(manifests) {
					expect(window.test.com_test_basic).toBeDefined();
					expect(window.test.com_test_inherited).toBeDefined();
					F2.unload(window.test.com_test_basic.instanceId);
					F2.unload(window.test.com_test_inherited.instanceId);
					done();
				});
			});

			it('should load duplicate apps on same domain with unique instanceIds', function(done) {
				var configs = [{
					appId: 'com_test_duplicate',
					manifestUrl: '/apps/duplicate',
					enableBatchRequests: true
				}, {
					appId: 'com_test_duplicate',
					manifestUrl: '/apps/duplicate',
					enableBatchRequests: true
				}];

				F2.load(configs, function(manifests) {
					var id1 = window.test.com_test_duplicate[0].instanceId;
					var id2 = window.test.com_test_duplicate[1].instanceId;
					expect(id1).not.toBe(id2);
					F2.unload(manifests);
					done();
				});
			});

			it('should load a single app on an external domain', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: 'http://127.0.0.1:8080/apps/single_jsonp'
				}];

				F2.load(configs, function(manifests) {
					expect(window.test.com_test_basic).toBeDefined();
					F2.unload(manifests);
					done();
				});
			});

			it('should load multiple apps on different domains', function(done) {
				var configs = [{
					appId: 'com_test_inherited',
					manifestUrl: '/apps/single'
				}, {
					appId: 'com_test_basic',
					manifestUrl: 'http://127.0.0.1:8080/apps/single_jsonp'
				}];

				F2.load(configs, function(manifests) {
					var id1 = window.test.com_test_basic.instanceId;
					var id2 = window.test.com_test_inherited.instanceId;
					expect(id1).toBeDefined();
					expect(id2).toBeDefined();
					expect(id1).not.toBe(id2);
					F2.unload(id1, id2);
					done();
				});
			});

			it('should allow requests to be aborted on same domain', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/slow'
				}];

				var reqs = F2.load(configs, function(manifests) {
					expect(window.test.com_test_basic).not.toBeDefined();
					done();
				});
				reqs.abort();
			});

			it('should allow requests to be aborted on different domains', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: 'http://127.0.0.1:8080/apps/single_jsonp_slow'
				}];

				var reqs = F2.load(configs, function() {
					expect(window.test.com_test_basic).not.toBeDefined();
					done();
				});
				reqs.abort();
			});

		});

		describe('new', function() {

			it('should create new instances of F2', function() {
				expect(F2.new()).not.toBe(F2);
				expect(F2.new()).not.toBe(F2.new());
			});

		});

		describe('onetimeToken', function() {

			it('should return a guid', function() {
				var LocalF2 = F2.new();
				expect(LocalF2.onetimeToken()).toBeDefined();
			});

			it('should throw when called more than once', function() {
				var LocalF2 = F2.new();

				function attemptToGetTokenTwice() {
					LocalF2.onetimeToken();
					LocalF2.onetimeToken();
				}

				expect(attemptToGetTokenTwice).toThrow();
			});

			it('should throw after \'F2.load\' is called', function(done) {
				var LocalF2 = F2.new();

				function attemptToGetToken() {
					LocalF2.onetimeToken();
				}

				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/slow'
				}];

				// Load some apps and abort immediately
				var reqs = LocalF2.load(configs, function() {
					expect(attemptToGetToken).toThrow();
					done();
				});
				reqs.abort();
			});

		});

		describe('unload', function() {

			it('should allow multiple apps to be removed at once', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/single'
				}, {
					appId: 'com_test_inherited',
					manifestUrl: '/apps/single'
				}];

				F2.load(configs, function(manifests) {
					F2.unload(manifests);
					expect(window.test.com_test_basic).not.toBeDefined();
					expect(window.test.com_test_inherited).not.toBeDefined();
					done();
				});
			});

			it('should call the app\'s dispose() method', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/single'
				}];

				F2.load(configs, function(manifests) {
					F2.unload(manifests);
					expect(window.test.com_test_basic).not.toBeDefined();
					done();
				});
			});

			it('should remove by instanceId', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/single'
				}];

				F2.load(configs, function(manifests) {
					F2.unload(manifests[0].instanceId);
					expect(window.test.com_test_basic).not.toBeDefined();
					done();
				});
			});

			it('should remove by root', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/single'
				}];

				F2.load(configs, function(manifests) {
					F2.unload(manifests[0].root);
					expect(window.test.com_test_basic).not.toBeDefined();
					done();
				});
			});

			it('should automatically remove an app\'s events (when context was specified)', function(done) {
				var configs = [{
					appId: 'com_test_basic',
					manifestUrl: '/apps/single'
				}];

				F2.load(configs, function(manifests) {
					F2.unload(manifests);
					F2.emit('com_test_basic-context');
					expect(window.test.com_test_basic).not.toBeDefined();
					done();
				});
			});

			it('should not throw if an instance can\'t be found', function() {
				function attempt() {
					F2.unload(123);
				}

				expect(attempt).not.toThrow();
			});

			it('should not throw if the app\'s dispose() method is undefined', function(done) {
				var configs = [{
					appId: 'com_test_no_dispose',
					manifestUrl: '/apps/single'
				}];

				F2.load(configs, function(manifests) {
					function attempt() {
						F2.unload(manifests);
					}

					expect(attempt).not.toThrow();
					done();
				});
			});

		});

	});

});
