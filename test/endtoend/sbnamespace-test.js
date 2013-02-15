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

var sbnamespace1;
var sbnamespace2;

suite('Tests', function () {

    setup(function (done) {
        var rdmString = helper.GenerateRandomString();
        sbnamespace1 = "sb1-" + rdmString;
        sbnamespace2 = "sb2-" + rdmString;

        // make sure there is no sb namespace prior to the execution of the tests
        DeleteAnyExistingSBNamespaces(done);
    });

    teardown(function (done) {
        DeleteAnyExistingSBNamespaces(done);
    });

    test('Sb namespace list/create/delete', function (done) {

        async.series([

        // sb namespace create; no param
        function (callback) {
            CreateSBNamspaceAndVerify(sbnamespace1, callback);
        },

        // sb namespace list; one namespace
        function (callback) {
            ListSBNamespaceAndCheckLength(1, callback);
        },

        // sb namespace create; no param
        function (callback) {
            CreateSBNamspaceAndVerify(sbnamespace2, callback);
        },

        // sb namespace list; multiple namespaces
        function (callback) {
            ListSBNamespaceAndCheckLength(2, callback);
        },

        // wait for sb namespaces to be all in 'active' status
        function (callback) {
            WaitForSBNamespaceToBeActive(sbnamespace1, function (callback2) {
                WaitForSBNamespaceToBeActive(sbnamespace2, callback)
            });
        },

        // sb namespace delete; valid name
        function (callback) {
            helper.ExecuteCmd(["azure sb namespace delete " + sbnamespace1 + " --json"], function (err, results) {
                if (err) {
                    throw err;
                }

                // verify
                WaitForSBNamespaceToBeDeleted(sbnamespace1, function (callback2) {
                    ListSBNamespaceAndCheckLength(1, callback2);
                });
            });
        },


        // sb namespace delete; valid name
        function (callback) {
            helper.ExecuteCmd(["azure sb namespace delete " + sbnamespace2 + " --json"], function (err, results) {
                if (err) {
                    throw err;
                }

                // verify
                WaitForSBNamespaceToBeDeleted(sbnamespace1, function (callback2) {
                    ListSBNamespaceAndCheckLength(1, callback2);
                });
            });
        }
        ]);
    });

    //suite('Negative', function () {
    //    test('sb namespace check; with name param; unavailable name', function (done) {
    //        helper.ExecuteCmd(["azure sb namespace check $$ --location \"West US\" --json"], function (err, result) {
    //            if (!err) {
    //                throw new Error("Should throw an error but no error was thrown");
    //            }

    //            // TODO err when parsing json
    //            var resultJson = JSON.parse(result);

    //            // TODO more testing validation here needed once the format of the json output is defined...
    //            
    //            done();
    //        });
    //    });

    //    test('sb namespace create; name is invalid', function (done) {
    //        helper.ExecuteCmd(["azure sb namespace check a --json"], function (err, result) {
    //            if (!err) {
    //                throw new Error("Should throw an error but no error was thrown");
    //            }

    //            // TODO err when parsing json
    //            var resultJson = JSON.parse(result);

    //            // TODO more testing validation here needed once the format of the json output is defined...
    //            
    //            done();
    //        });
    //    });

    //    test('sb namespace show; invalid name as param', function (done) {
    //        helper.ExecuteCmd(["azure sb namespace show a --json"], function (err, result) {
    //            if (!err) {
    //                throw new Error("Should throw an error but no error was thrown");
    //            }

    //            // TODO err when parsing json
    //            var resultJson = JSON.parse(result);

    //            // TODO more testing validation here needed once the format of the json output is defined...
    //            
    //            done();
    //        });
    //    });

    //     test('sb namespace delete; invalid name as param', function (done) {
    //        helper.ExecuteCmd(["azure sb namespace delete 1234 --json"], function (err, result) {
    //            if (!err) {
    //                throw new Error("Should throw an error but no error was thrown");
    //            }

    //            // TODO err when parsing json
    //            var resultJson = JSON.parse(result);

    //            // TODO more testing validation here needed once the format of the json output is defined...
    //            
    //            done();
    //        });
    //    });

    //});

})


var WaitForSBNamespaceToBeActive = function (sbnamespaceName, callback) {
    // call callback() when status is active
    helper.ExecuteCmd(["azure sb namespace show " + sbnamespaceName + " --json"], function (err, results) {

        if (err) {
            throw err;
        }

        var jsonResults = JSON.parse(results);
        var status = jsonResults.Status;
        console.log("Status:" + status);
        if (status === "Active") {status
            callback();
        } else {
            setTimeout(function () {
                WaitForSBNamespaceToBeActive(sbnamespaceName, callback);
            }, 10000);
        }
    });
};

var WaitForSBNamespaceToBeDeleted = function (sbnamespaceName, callback) {
    // call callback() when the sb namespace doesn't exists anymore
    helper.ExecuteCmd(["azure sb namespace show " + sbnamespaceName + " --json"], function (err, results) {
        if (err) {
            console.log("Expected error thrown which means the sb namesapce has been successfully deleted")
            callback();
        } else {
            var jsonResults = JSON.parse(results);
            var status = jsonResults.Status;
            console.log("Status:" + status);
            setTimeout(function () {
                WaitForSBNamespaceToBeDeleted(sbnamespaceName, callback);
            }, 10000);
        }
    });
};

var ListSBNamespaceAndCheckLength = function (expectedLength, callback) {
    helper.ExecuteCmd(["azure sb namespace list --json"], function (err, results) {
        if (err) {
            throw err;
        }

        var jsonResults = JSON.parse(results);
        assert.equal(jsonResults.length, expectedLength);
        callback();
    });
};

var CreateSBNamspaceAndVerify = function(sbNamespaceName, callback) {
    var region = "West US";
    helper.ExecuteCmd(["azure sb namespace create " + sbNamespaceName + " \"" + region + "\" --json"], function (err, results) {
        if (err) {
            throw err;
        }

        // verify json output data
        var newlyCreatedSBNS = JSON.parse(results);
        assert.equal(newlyCreatedSBNS.Name, sbNamespaceName);
        assert.equal(newlyCreatedSBNS.Region, region);
        assert.equal(newlyCreatedSBNS.Enabled, "true");
        assert.notStrictEqual(newlyCreatedSBNS.DefaultKey, "");
        assert.notStrictEqual(newlyCreatedSBNS.Status, "");
        assert.notStrictEqual(newlyCreatedSBNS.CreatedAt, "");
        assert.notStrictEqual(newlyCreatedSBNS.AcsManagementEndpoint, "");
        assert.notStrictEqual(newlyCreatedSBNS.ServicebusEndpoint, "");
        assert.notStrictEqual(newlyCreatedSBNS.ConnectionString, "");
        assert.notStrictEqual(newlyCreatedSBNS.SubscriptionId, ""); // TODO - check the curr subscriptionId
        callback();
    });
}

var DeleteAnyExistingSBNamespaces = function (callback) {
    helper.ExecuteCmd(["azure sb namespace list --json"], function (listErr, listResults) {
        if (listErr) {
            throw listErr;
        }

        if (listResults !== "") {
            var sbNamespaceList = JSON.parse(listResults);

            var deleteSBNamespace = function (item, deleteCallback) {
                if (item.Status === 'Active') {
                    helper.ExecuteCmd(["azure sb namespace delete " + item.Name + " --json"], function (deleteErr, deleteResults) {
                        if (deleteErr) {
                            throw deleteErr;
                        }
                        WaitForSBNamespaceToBeDeleted(item.Name, deleteCallback);
                    })
                } else {
                    console.log(item.Name + "'s status is " + item.Status);
                    deleteCallback();
                }
            };

            async.forEach(sbNamespaceList, deleteSBNamespace, function (err) {
                if (err) {
                    throw err;
                }

                callback();
            });
        }
        else {
            callback();
        }
    });
}