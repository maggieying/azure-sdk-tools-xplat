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

    suite('azure config', function () {
        test('Config List Basic', function (done) {
            async.series([
             //config list
            function (callback) {
                helper.ExecuteCmd(["azure config list --json"], function (err, results) {
                        
                        // TODO currently output not in JSON.
                        // BUG:  https://github.com/WindowsAzure/azure-sdk-tools-xplat/issues/321
                        console.log(results);
                        var configList = JSON.parse(results);
                        

                        console.log(configList);
                        assert.equal(results, "");
                        callback();
                    })
            },

             // TODO after the bug is fixed need to continue to automate
             
             //azure config set name1 value1
             //azure config set name1 value2
             //azure config list
             //azure config delete name1
             //azure config delete name2
             //azure config list

            ], function (err, results) {
                done();
            });
        });
    });
})