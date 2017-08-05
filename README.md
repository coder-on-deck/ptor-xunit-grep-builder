# Description

Given XML reports from protractor, this library will construct the `grep` param to run the failing tests

Supports sharded configuration

# HOW TO USE

install this library

```bash
npm install -g ptor-xunit-grep-builder
```


configure your protractor to export reports to xml (in `onPrepare()` phase )

```javascript
// for sharded configuration
jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
  consolidateAll: true,
  savePath: savePath + '/each',
  filePrefix: 'failed-test-' + uuid()
}));

// for regular configuration
jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
  consolidateAll: true,
  savePath: savePath
}));

// alternatively, to have support for specs as well
// tested on configuration for running in parallel. 
return global.browser.getProcessedConfig().then((config) => {
  const filename = () => {
    try {
      return config.specs[0].split('/').slice(-1)[0]; // return entire name (e.g. name.ptor.js) - this will be appended with .xml later on
    } catch (e) {
      return 'failed-test-' + uuid();
    }
  };
  const filenameValue = filename();
  global.jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
    consolidateAll: true,
    savePath: savePath + '/each/',
    filePrefix: filenameValue
  }));

  logger.info('filename is', filenameValue);
});

```

add a retry code to you build script - her is an example

```bash
#!/usr/bin/env bash

print_attempt(){
    echo "#########################################################################################"
    echo "                          attempt ${i}                                                   "
    echo "#########################################################################################"
}

clean_reports () {
rm -rf ./reports/protractor/**/failed-test-*.xml
}

run_tests () {
    print_attempt
    echo PTOR_SUITE=${PTOR_SUITE}
    GREP_PARAMS=`ptor-xunit-grep-builder --tests --files=./reports/protractor/*/each/*.xml`
    SPECS_PARAMS=`ptor-xunit-grep-builder --filenames --files=./reports/protractor/*/each/*.xml`
    echo "GREP PARAMS=${GREP_PARAMS}"
    echo "SPECS PARAMS=${SPECS_PARAMS}"

    if  [ "$GREP_PARAMS" = "" ]; then
        echo "ERROR::: grep params is empty but retrying..."
        exit 1
    fi

    if  [ "$SPECS_PARAMS" = "" ]; then
        echo "ERROR::: specs params is empty but retrying..."
        exit 1
    fi

    clean_reports
    ./node_modules/.bin/protractor --specs=${SPECS_PARAMS} --grep="${GREP_PARAMS}" protractor.conf.js
}

first_run () {
    print_attempt
    clean_reports
    ./node_modules/.bin/protractor --suite=${PTOR_SUITE} protractor.conf.js
}
i=1
# run first time and then retry over and over again
first_run || ( for i in 2 3 4 5 6 7 8 9; do run_tests $i && break || sleep 5; done )
```
