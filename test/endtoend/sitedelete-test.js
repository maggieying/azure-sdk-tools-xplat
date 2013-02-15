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
    suite('site delete', function () {
        var siteName;
        setup(function (done) {
            siteName = helper.GenerateRandomWebsiteName();
            helper.GetSiteLocation(function (locationList) {
                helper.ExecuteCmd(["cd artifacts",
                    "mkdir " + siteName,
                    "cd " + siteName,
                    "azure site create " + siteName + " --location \"" + locationList[0] + "\" --git --json" // TODO - how about variation without --git?
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

        test('Site delete: in service directory, no params', function (done) {
            helper.ExecuteCmd([
            "cd artifacts/" + siteName,
            "azure site delete -q --json"], function (err, results) {
                if (err) {
                    throw err;
                }

                helper.CheckSiteNameExistence(siteName, function (isSiteNameStillThere) {
                    assert.equal(isSiteNameStillThere, false);
                    done();
                });
            });
        });

        test('Site delete out of service directory, no params', function (done) {
            helper.ExecuteCmd(["azure site delete " + siteName + " -q --json"], function (err, results) {
                if (err) {
                    throw err;
                }

                helper.CheckSiteNameExistence(siteName, function (isSiteNameStillThere) {
                    assert.equal(isSiteNameStillThere, false);
                    done();
                });
            });
        });


        test('Site delete, valid name, stopped', function (done) {
            helper.ExecuteCmd(["azure site stop " + siteName], function (siteStopErr, siteStopResults) {
                if (siteStopErr) {
                    throw siteStopErr;
                }

                helper.ExecuteCmd(["azure site delete " + siteName + " -q --json", ], function (err, results) {
                    if (err) {
                        throw err;
                    }

                    helper.CheckSiteNameExistence(siteName, function (isSiteNameStillThere) {
                        assert.equal(isSiteNameStillThere, false);
                        done();
                    });
                });
            });
        });

        test('Site delete, invalid name', function (done) {
            helper.ExecuteCmd(["azure site delete someRandomPrefix-" + siteName + " -q --json"], function (err, result) {

                if (!err) {
                    throw new Error('error should occur when deleting a site with invalid name');
                }

                done();
            });
        });
    })
})