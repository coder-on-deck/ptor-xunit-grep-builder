#!/usr/bin/env node
const _ = require('lodash')
const fs = require('fs-extra')
const glob = require('glob')
const args = require('minimist')(process.argv.slice(2))
const X2JS = require('x2js')
const xml2json = new X2JS()
const chalk = require('chalk')
const path = require('path')
// console.log(args)
const files = glob.sync(args.files || './**/failed-tests-*.xml')
if (args.help) {
  console.log(`
        Writes all the failing test cases found in xunit reports. to be used with protractor --grep option

            ptor-xunit-grep-builder ${chalk.red('--tests')} ${chalk.red('--files')}="./reports/protractor/**/*.xml"

        Writes count of all the failing test cases found in xunit reports.

          ptor-xunit-grep-builder ${chalk.red('--count')} ${chalk.red('--tests')} ${chalk.red('--files')}="./reports/protractor/**/*.xml"

        Writes all the report filenames with failing tests. to be used with protractor --specs option

            ptor-xunit-grep-build ${chalk.red('--filenames')} ${chalk.red('--file-suffix')} .xml ${chalk.red('--files')}="./reports/protractor/**/*.xml"




    `)
  process.exit(0)
}
if (args.count && args.tests) {
  const count = _(files)
        .map((f) => fs.readFileSync(f).toString())
        .map((xmlContent) => xml2json.xml2js(xmlContent))
        .map('testsuites')
        .map('testsuite')
        .flatten()
        .filter((t) => t._failures > 0)
        .map('testcase')
        .flatten()
        .map((t) => `${t._classname} ${t._name}`)
        .size()
  console.log(count)
} else if (args.tests) {
    // console.log('finding tests', files.length, args.files);
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
} else { // filenames
  const fileSuffix = args.fileSuffix || '.xml'

  const results = _(files)
        .map((f) => ({filename: f, content: fs.readFileSync(f).toString()}))
        .map(({filename, content}) => ({filename: '**/' + path.basename(filename, fileSuffix), content: xml2json.xml2js(content)}))
        .map(({filename, content}) => ({filename, failures: _([content.testsuites.testsuite]).flatten().some((t) => t._failures > 0)}))
        .filter(({failures}) => failures > 0)
        .map('filename')
        .value().join(',')

  console.log(results)
}
