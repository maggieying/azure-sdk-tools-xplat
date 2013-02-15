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
var http = require("http");
var testhelper = require('./testhelper.js');
var helper = new testhelper();

suite('Kudu Tests', function () {

    test('Kudu apps: express app', function (done) {

        var siteName = helper.GenerateRandomWebsiteName();
        async.series([
        // 1.  Create azure site and create hello work app from express scarfolding
        function (callback) {
            helper.ExecuteCmd(["cd artifacts",
            "mkdir " + siteName,
            "cd " + siteName,
            "express", // assuming express is installed...
            "azure site create " + siteName + " --location \"West US\" --git --json",
            ], function (err, results) {
                console.log('here');
                if (err) {
                    throw err;
                }

                callback();
            });
        },

        // 2.  Change remote url to include password
        function (callback) {
            helper.ExecuteCmd(["cd artifacts/" + siteName,
            "git remote -v"], function (err, results) {
                if (err) {
                    throw err;
                }

                console.log(results);

                if (helper.deploymentUserName == undefined || helper.deploymentPassword == undefined) {
                    throw new Error("The deployment username/password environment variable needs to be set");
                }

                var url = results.match(/https:\/\/(.*)(.git)/)[0];
                url = url.replace(helper.deploymentUserName, helper.deploymentUserName + ":" + helper.deploymentPassword);

                helper.ExecuteCmd(["cd artifacts/" + siteName,
                "git remote set-url azure " + url], function (setErr, setResults) {
                    if (setErr) {
                        throw setErr;
                    }
                    console.log(setResults);
                    callback();
                });
            });
        },

        // 3.  Deploy service to azure                
        function (callback) {
            helper.ExecuteCmd(["cd artifacts/" + siteName,
                "git add .",
                "git commit -m \"initial commit\" -q",
                "git push --quiet azure master"], function (err, results) {
                    callback(); // swallowing error if there is git error...
                });
        },

        // 4. Call the service
        function (callback) {
            helper.ExecuteCmd(["cd artifacts/" + siteName,
                "azure site show --json "], function (err, result) {
                    var siteShowResult = JSON.parse(result);
                    var options = {
                        host: siteShowResult.site.HostNames
                    }
                    http.get(options, function (response) {
                        console.log("Got response: " + response.statusCode);

                        response.on("data", function (body) {
                            console.log("BODY: " + body);
                            assert.equal(true, body.toString().indexOf("Welcome to Express") > -1)
                            callback();
                        });
                    });
                });
        },

        // 5.  Delete site
            function (callback) {
                helper.ExecuteCmd(["cd artifacts/" + siteName,
                    "azure site delete -q --json "], function (err, result) {
                        callback();
                    });
            }

        ], function (err, results) {
            if (err) {
                throw new Error(err);
            }
            done();
        });
    });
})

