/**
* Copyright 2012 Microsoft Corporation
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
var async = require('async');
var assert = require('assert');
var testhelper = require('./testhelper.js');
var helper = new testhelper();

suite('Tests', function () {
    suite('site start/stop', function () {
        var siteName;
        setup(function (done) {
            siteName = helper.GenerateRandomWebsiteName();
            helper.GetSiteLocation(function (locationList) {
                helper.ExecuteCmd(["cd artifacts",
                    "mkdir " + siteName,
                    "cd " + siteName,
                    "azure site create " + siteName + " --location \"" + locationList[0] + "\" --git --json"
                ], function (err, results) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
            });
        });

        teardown(function (done) {
            helper.CheckSiteNameExistence(siteName, function (isSiteNameStillThere) {
                if (isSiteNameStillThere) {
                    helper.ExecuteCmd(["azure site delete -q " + siteName + "  --json"], function (siteDeleteErr, siteDeleteResult) {
                        if (siteDeleteErr) {
                            console.log("Fail to cleanup because site delete throws");
                            throw siteDeleteErr;
                        }
                    });
                }
                done();
            });
        });

        test('Site start/stop: in service directory, no params', function (done) {
            async.series([
            // Site stop: in service directory, no params
                function (callback) {
                    helper.ExecuteCmd([
                    "cd artifacts/" + siteName,
                    "azure site stop --json"], function (err, results) {
                        if (err) {
                            throw err;
                        }

                        helper.CheckSiteStatus(siteName, function (state) {
                            console.log('state: ' + state);
                            assert.equal(state, "Stopped");

                            callback();
                        });

                    });
                },

            // Site start: in service directory, no params
                function (callback) {
                    helper.ExecuteCmd([
                    "cd artifacts/" + siteName,
                    "azure site start --json"], function (err, results) {
                        if (err) {
                            throw err;
                        }

                        helper.CheckSiteStatus(siteName, function (state) {
                            console.log('state: ' + state);
                            assert.equal(state, "Running");

                            callback();
                        });

                    });
                },
            ], function () {
                done();
            });
        });

        test('Site start/stop out of service directory, no params', function (done) {

            var RunningStatus = "Running";
            var StoppedStatus = "Stopped";
            var ExecuteCmdAndCheckStatus = function (command, expectedState, callback) {
                helper.ExecuteCmd([command], function (err, results) {
                    if (err) {
                        throw err;
                    }

                    helper.CheckSiteStatus(siteName, function (state) {
                        console.log('state: ' + state);
                        assert.equal(state, expectedState);

                        callback();
                    });
                });
            };

            async.series([
            // Site stop, valid name, stopped
                function (callback) {
                    ExecuteCmdAndCheckStatus("azure site stop " + siteName + " --json", StoppedStatus, callback);
                },

            // Site stop out of service directory, no params
            // Site stop, valid name, running
                function (callback) {
                    ExecuteCmdAndCheckStatus("azure site stop " + siteName + " --json", StoppedStatus, callback);
                },

            // Site start out of service directory, no params
            // Site start, valid name, stopped
                function (callback) {
                    ExecuteCmdAndCheckStatus("azure site start " + siteName + " --json", RunningStatus, callback);
                },

            // Site start, valid name, running
                function (callback) {
                    ExecuteCmdAndCheckStatus("azure site start " + siteName + " --json", RunningStatus, callback);
                },
            ], function () {
                done();
            });
        });      
    });

    suite('site start/stop; negative', function () {
          test('Site start/stop: invalid name', function (done) {

            async.series([

                // Site start, invalid name
                function (callback) {
                    helper.ExecuteCmd(["azure site start someInvalidName --json"], function (err, results) {
                        if (err) {
                            console.log(err);
                            callback();
                        } else {
                            throw new Error("");
                        }
                    });
                },

                // Site stop, invalid name
                function (callback) {
                    helper.ExecuteCmd(["azure site stop someInvalidName --json"], function (err, results) {
                        if (err) {
                            console.log(err);
                            callback();
                        } else {
                            throw new Error("");
                        }
                    });
                },
            ], function () {
                done();
            });
        });
    });
})