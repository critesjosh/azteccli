#!/usr/bin/env -S node --experimental-json-modules

const oclif = require("@oclif/core");

oclif
  .run()
  .then(require("@oclif/core/flush"))
  .catch(require("@oclif/core/handle"));
