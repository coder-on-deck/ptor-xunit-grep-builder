#!/usr/bin/env node
const _ = require('lodash')
const fs = require('fs-extra')
const glob = require('glob')
const args = require('minimist')(process.argv.slice(2))
const xml2json = require('xml2json')

const files = glob.sync(args.files || './**/failed-tests-*.xml')

const grepArgs = _(files)
    .map((f) => fs.readFileSync(f).toString())
    .map((xmlContent) => xml2json.toJson(xmlContent))
    .map((str) => JSON.parse(str))
    .map('testsuites')
    .map('testsuite')
    .flatten()
    .filter((t) => t.failures > 0)
    .map('testcase')
    .flatten()
    .map((t) => `${t.classname} ${t.name}`)
    .value().join('|')
const command = `${grepArgs}`
console.log(command)
