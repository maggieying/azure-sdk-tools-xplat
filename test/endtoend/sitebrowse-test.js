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
    test('site browse, invalid name', function (done) {
        helper.ExecuteCmd(["azure site browse FooBarNonExistenceSite --json"], function (err, result) {
            if (!err) {
                throw new Error("Should throw error but there is no error");
            }

            // TODO - output not valid json.
            // BUG:  https://github.com/WindowsAzure/azure-sdk-tools-xplat/issues/316
            console.log(result);
            var json = JSON.parse(result);
            
            done();
        });
    });
})