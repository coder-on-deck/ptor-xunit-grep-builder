#!/usr/bin/env node
const _ = require('lodash')
const fs = require('fs-extra')
const glob = require('glob')
const args = require('minimist')(process.argv.slice(2))
const X2JS = require('x2js')
const xml2json = new X2JS()

const files = glob.sync(args.files || './**/failed-tests-*.xml')

const grepArgs = _(files)
    .map((f) => fs.readFileSync(f).toString())
    .map((xmlContent) => xml2json.xml2js(xmlContent))
    .map('testsuites')
    .map('testsuite')
    .flatten()
    .filter((t) => t._failures > 0)
    .map('testcase')
    .flatten()
    .map((t) => `${t._classname} ${t._name}`)
    .value().join('|')

const command = `${grepArgs}`
console.log(command)
