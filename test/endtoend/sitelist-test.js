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
var assert = require('assert');
var testhelper = require('./testhelper.js');
var helper = new testhelper();

suite('Tests', function () {

    test('site list - no sites', function (done) {
        helper.ExecuteCmd(["azure site list --json"], function (err, result) {
            if (err) {
                throw err;
            }
            assert.equal(result, "");
            done();
        });
    });

    suite('site list', function () {

        var siteNames = new Array();
        setup(function (done) {
            helper.GetSiteLocation(function (locationList) {

                if (locationList.length == 0) {
                    throw new Error("There is no GeoRegion available for site to create");
                }

                siteNames.push(helper.GenerateRandomWebsiteName());
                siteNames.push(helper.GenerateRandomWebsiteName());

                helper.ExecuteCmd([
                    "azure site create " + siteNames[0] + " --location \"" + locationList[0] + "\" --json",
                    "azure site create " + siteNames[1] + " --location \"" + locationList[0] + "\" --json"
                ], function (err, results) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
            })
        });

        teardown(function (done) {
            helper.ExecuteCmd(["azure site delete -q " + siteNames[0] + " --json",
                "azure site delete -q " + siteNames[1] + " --json",
            ], function (err, siteDeleteErr) {
                if (siteDeleteErr) {
                    console.log("Fail to cleanup because site delete throws");
                    throw siteDeleteErr;
                }
                done();
            });
        });

        test('site list, multiple sites', function (done) {
            helper.ExecuteCmd(["azure site list --json"], function (err, result) {
                if (err) {
                    throw err;
                }
                var siteList = JSON.parse(result);

                assert.equal(siteList.length, 2);
                for (var i = 0; i < siteList.length; i++) {
                    assert.equal(siteNames.indexOf(siteList[i].Name) > -1, true);
                }

                done();
            });
        });
    });
})