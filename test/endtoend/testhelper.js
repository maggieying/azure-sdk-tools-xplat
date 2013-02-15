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
var exec = require('child_process').exec;
var async = require('async');
var events = require('events');

// Expose 'testhelper'
function testhelper() { }
exports = module.exports = testhelper;

testhelper.prototype.publishsettingFilePath = process.env.PUBLISHSETTINGS_FILE_PATH;
testhelper.prototype.deploymentUserName = process.env.DEPLOYMENT_USERNAME;
testhelper.prototype.deploymentPassword = process.env.DEPLOYMENT_PASSWORD;

testhelper.prototype.GenerateRandomWebsiteName = function () {
    return 'TestSite-' + testhelper.prototype.GenerateRandomString();
}

testhelper.prototype.GenerateRandomString = function () {
    return Math.random().toString().replace(".", "");
}

testhelper.prototype.ExecuteCmd = function (commandArr, callback) {
    var commands = commandArr.join(" && ");
    console.log('> Executing command: ' + commands.replace(/&&/g, "&& \n"));
    exec(commands, function (err, stdout, stderr) {
        if (err) {
            console.log("there is error from exec:"); // TODO remove
            console.log(err);
            callback(err, stdout); // TODO changing callback here to take 2 params -- might cause regression
        } else if (stderr) {
            // todo only hit when --json
            console.log("there is stderr from exec:"); // TODO remove 
            console.log(stderr);
            callback(stderr, stdout); // TODO changing callback here to take 2 params -- might cause regression
        } else {
            callback(null, stdout);
        }
    });
}

testhelper.prototype.SiteCreate = function (callback) {

    var ev = new events.EventEmitter();
    process.openStdin = function () { return ev; };

    ev.emit('password', 'password123');

    var websiteName = GenerateRandomWebsiteName();

    testhelper.prototype.ExecuteCmd(["cd\\",
            "mkdir " + websiteName,
            "cd " + websiteName,
            "azure site create " + websiteName + " --git --json",
            "express -f",
            "git add .",
            "git commit -m \"initial commit\"",
            "git push azure master"
            ],
            function (err, results) {
                if (err) {
                    throw err;
                }
                callback(null, results);
            });
}

testhelper.prototype.AccountImport = function(callback) {

    if (!publishsettingFilePath) {
        throw new Error('The environement variable PUBLISHSETTINGS_FILE_PATH is not set!');
    }

    console.log('Importing this publishsettings file: ' + publishsettingFilePath);
    var accountImportCmd = 'azure account import ' + publishsettingFilePath + ' --json';
    testhelper.prototype.ExecuteCmd([accountImportCmd], callback);
}

testhelper.prototype.AccountClear = function (callback) {
    var accountClearCmd = 'azure account clear --json';
    testhelper.prototype.ExecuteCmd([accountClearCmd], callback);
}

testhelper.prototype.CheckSiteNameExistence = function (siteName, callback) {

    testhelper.prototype.ExecuteCmd(["azure site list --json"], function (siteListErr, siteListResult) {
        if (siteListResult === "") {
            callback(false);
            return;
        }

        var jsonSiteList = JSON.parse(siteListResult);
        for (var i = 0; i < jsonSiteList.length; i++) {
            if (jsonSiteList[i].Name === siteName) {
                callback(true);
                return;
            }
        }

        callback(false);
        return;
    });
}

testhelper.prototype.CheckSiteStatus = function (siteName, callback) {
    testhelper.prototype.ExecuteCmd(["azure site list --json"], function (siteListErr, siteListResult) {
        var siteState = null;
        var jsonSiteList = JSON.parse(siteListResult);
        for (var i = 0; i < jsonSiteList.length; i++) {
            if (jsonSiteList[i].Name === siteName) {
                siteState = jsonSiteList[i].State;
            }
        }
        callback(siteState);
    });
}

testhelper.prototype.GetSiteLocation = function (callback) {
    testhelper.prototype.ExecuteCmd(["azure site location list --json"], function (err, result) {
        var jsonLocationResult = JSON.parse(result);
        var locations = new Array();
        for (var i = 0; i < jsonLocationResult.length; i++) {
            if (jsonLocationResult[i].Status == 'Ready') {
                locations.push(jsonLocationResult[i].GeoRegion);
            }
        }
        callback(locations);
    });
}