#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
vows = require('vows'),
path = require('path'),
wd = require('wd'),
assert = require('assert'),
restmail = require('./lib/restmail.js'),
utils = require('./lib/utils.js'),
persona_urls = require('./lib/urls.js'),
CSS = require('./lib/css.js');

// add fancy helper routines to wd
require('./lib/wd-extensions.js');

// setup
var suite = vows.describe(path.relative("..", __dirname));
suite.options.error = false;

var browser = wd.remote();

function noError(err) {
  assert.ok(!err, err);
}

suite.addBatch({
  "starting a session": {
    topic: function() {
      browser.newSession(this.callback);
    },
    "succeeds": noError
  }
});

suite.addBatch({
  "loading sample rp": {
    topic: function() {
      browser.get(persona_urls["123done"], this.callback);
    },
    "succeeds": noError
  }
});

const theEmail = restmail.randomEmail(10);

suite.addBatch({
  "the sign in button becomes visible": {
    topic: function() {
      browser.waitForDisplayed({ which: CSS["123done.org"].signinButton }, this.callback);
    },
    "successfully": noError,
    "and clicking": {
      topic: function(err, element) {
        browser.clickElement(element, this.callback);
      },
      "succeeds": noError,
      "and selecting the dialog window": {
        topic: function() {
          browser.waitForWindow(CSS["persona.org"].windowName, this.callback);
        },
        "succeeds": noError
      }
    }
  }
});

suite.addBatch({
  "wait for input text box": {
    topic: function() {
      browser.elementByCss(CSS['dialog'].emailInput, this.callback);
    },
    "succeeds": noError,
    "and typing an email address": {
      topic: function(err, elem) {
        browser.type(elem, theEmail, this.callback);
      },
      "succeeds": noError,
      "and finding the next button": {
        topic: function() {
          browser.elementByCss(CSS['dialog'].newEmailNextButton, this.callback);
        },
        "succeeds": noError,
        "and clicking it": {
          topic: function(err, elem) {
            browser.clickElement(elem, this.callback);
          },
          "succeeds": noError
        }
      }
    }
  }
});

suite.addBatch({
  "finding password input": {
    topic: function() {
      browser.elementByCss(CSS['dialog'].choosePassword, this.callback);
    },
    "succeeds": noError,
    "and typing password": {
      topic: function(err, elem) {
        browser.type(elem, theEmail.split('@')[0], this.callback);
      },
      "succeeds": noError,
      "and finding the verify password input": {
        topic: function() {
          browser.elementByCss(CSS['dialog'].verifyPassword, this.callback);
        },
        "succeeds": noError,
        "and retyping password": {
          topic: function(err, elem) {
            browser.type(elem, theEmail.split('@')[0], this.callback);
          },
          "succeeds": noError,
          "and finding the next button": {
            topic: function() {
              browser.elementByCss(CSS['dialog'].createUserButton, this.callback);
            },
            "succeeds": noError,
            "and clicking it": {
              topic: function(err, elem) {
                browser.clickElement(elem, this.callback);
              },
              "succeeds": noError
            }
          }
        }
      }
    }
  }
});

suite.addBatch({
  "checking email": {
    topic: function() {
      restmail.getVerificationLink({ email: theEmail }, this.callback);
    },
    "finds email": function(err, link, email) {
      assert.isNull(err);
      assert.ok(link);
    },
    "and opening verification page": {
      topic: function(err, link, email) {
        var self = this;
        browser.closeCurrentBrowserWindow(function() {
          browser.get(link, self.callback);
        });
      },
      "causes redirect to 123done": {
        topic: function() {
          browser.waitForElementText(CSS['123done.org'].currentlyLoggedInEmail, this.callback);
        },
        "and proper email address is logged in": function(err, text) {
          assert.isNull(err);
          assert.strictEqual(text, theEmail);
        }
      }
    }
  }
});


suite.addBatch({
  "ending a session": {
    topic: function() {
      browser.quit(this.callback);
    },
    "succeeds": noError
  }
});

// run or export the suite.
if (process.argv[1] === __filename) suite.run();
else suite.export(module);
