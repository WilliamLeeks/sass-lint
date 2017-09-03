/**
 * @fileoverview Tests for options.
 * @author Sindre Sorhus
 *
 * Updated for use with sass-lint under MIT licence
 * @license https://github.com/sasstools/sass-lint/blob/master/lib/format/LICENSE
 */

'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require('chai').assert,
    chalk = require('chalk'),
    proxyquire = require('proxyquire'),
    sinon = require('sinon');

// Chalk protects its methods so we need to inherit from it
// for Sinon to work.
const chalkStub = Object.create(chalk, {
  yellow: {
    value (str) {
      return chalk.yellow(str);
    },
    writable: true
  },
  red: {
    value (str) {
      return chalk.red(str);
    },
    writable: true
  }
});

chalkStub.yellow.bold = chalk.yellow.bold;
chalkStub.red.bold = chalk.red.bold;

const formatter = proxyquire('../../lib/format/formatters/stylish', { chalk: chalkStub });

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe('formatter:stylish', () => {
  let sandbox;
  const colorsEnabled = chalk.enabled;

  beforeEach(() => {
    chalk.enabled = false;
    sandbox = sinon.sandbox.create();
    sandbox.spy(chalkStub.yellow, 'bold');
    sandbox.spy(chalkStub.red, 'bold');
  });

  afterEach(() => {
    sandbox.verifyAndRestore();
    chalk.enabled = colorsEnabled;
  });

  describe('when passed no messages', () => {
    const code = [{
      filePath: 'foo.scss',
      messages: [],
      errorCount: 0,
      warningCount: 0
    }];

    it('should not return message', () => {
      const result = formatter(code);

      assert.equal(result, '');
      assert.equal(chalkStub.yellow.bold.callCount, 0);
      assert.equal(chalkStub.red.bold.callCount, 0);
    });
  });

  describe('when passed a single error message', () => {
    const code = [{
      filePath: 'foo.scss',
      errorCount: 1,
      warningCount: 0,
      messages: [{
        message: 'Unexpected foo.',
        severity: 2,
        line: 5,
        column: 10,
        ruleId: 'foo'
      }]
    }];

    it('should return a string in the correct format', () => {
      const result = formatter(code);

      assert.equal(result, '\nfoo.scss\n  5:10  error  Unexpected foo  foo\n\n\u2716 1 problem (1 error, 0 warnings)\n');
      assert.equal(chalkStub.yellow.bold.callCount, 0);
      assert.equal(chalkStub.red.bold.callCount, 1);
    });
  });

  describe('when passed a single warning message', () => {
    const code = [{
      filePath: 'foo.scss',
      errorCount: 0,
      warningCount: 1,
      messages: [{
        message: 'Unexpected foo.',
        severity: 1,
        line: 5,
        column: 10,
        ruleId: 'foo'
      }]
    }];

    it('should return a string in the correct format', () => {
      const result = formatter(code);

      assert.equal(result, '\nfoo.scss\n  5:10  warning  Unexpected foo  foo\n\n\u2716 1 problem (0 errors, 1 warning)\n');
      assert.equal(chalkStub.yellow.bold.callCount, 1);
      assert.equal(chalkStub.red.bold.callCount, 0);
    });
  });

  describe('when passed multiple messages', () => {
    const code = [{
      filePath: 'foo.scss',
      errorCount: 1,
      warningCount: 1,
      messages: [{
        message: 'Unexpected foo.',
        severity: 2,
        line: 5,
        column: 10,
        ruleId: 'foo'
      }, {
        message: 'Unexpected bar.',
        severity: 1,
        line: 6,
        column: 11,
        ruleId: 'bar'
      }]
    }];

    it('should return a string with multiple entries', () => {
      const result = formatter(code);

      assert.equal(result, '\nfoo.scss\n  5:10  error    Unexpected foo  foo\n  6:11  warning  Unexpected bar  bar\n\n\u2716 2 problems (1 error, 1 warning)\n');
      assert.equal(chalkStub.yellow.bold.callCount, 0);
      assert.equal(chalkStub.red.bold.callCount, 1);
    });
  });

  describe('when passed multiple files with 1 message each', () => {
    const code = [{
      filePath: 'foo.scss',
      errorCount: 1,
      warningCount: 0,
      messages: [{
        message: 'Unexpected foo.',
        severity: 2,
        line: 5,
        column: 10,
        ruleId: 'foo'
      }]
    }, {
      errorCount: 0,
      warningCount: 1,
      filePath: 'bar.scss',
      messages: [{
        message: 'Unexpected bar.',
        severity: 1,
        line: 6,
        column: 11,
        ruleId: 'bar'
      }]
    }];

    it('should return a string with multiple entries', () => {
      const result = formatter(code);

      assert.equal(result, '\nfoo.scss\n  5:10  error  Unexpected foo  foo\n\nbar.scss\n  6:11  warning  Unexpected bar  bar\n\n\u2716 2 problems (1 error, 1 warning)\n');
      assert.equal(chalkStub.yellow.bold.callCount, 0);
      assert.equal(chalkStub.red.bold.callCount, 1);
    });

    it('should add errorCount', () => {
      code.forEach(c => {
        c.errorCount = 1;
        c.warningCount = 0;
      });

      const result = formatter(code);

      assert.equal(result, '\nfoo.scss\n  5:10  error  Unexpected foo  foo\n\nbar.scss\n  6:11  warning  Unexpected bar  bar\n\n\u2716 2 problems (2 errors, 0 warnings)\n');
      assert.equal(chalkStub.yellow.bold.callCount, 0);
      assert.equal(chalkStub.red.bold.callCount, 1);
    });

    it('should add warningCount', () => {
      code.forEach(c => {
        c.errorCount = 0;
        c.warningCount = 1;
      });

      const result = formatter(code);

      assert.equal(result, '\nfoo.scss\n  5:10  error  Unexpected foo  foo\n\nbar.scss\n  6:11  warning  Unexpected bar  bar\n\n\u2716 2 problems (0 errors, 2 warnings)\n');
      assert.equal(chalkStub.yellow.bold.callCount, 0);
      assert.equal(chalkStub.red.bold.callCount, 1);
    });
  });

  // TODO need to add fatal flags for this to work
  // describe('when passed one file not found message', () => {
  //   const code = [{
  //     filePath: 'foo.scss',
  //     errorCount: 1,
  //     warningCount: 0,
  //     messages: [{
  //       fatal: true,
  //       message: 'Couldn\'t find foo.scss.'
  //     }]
  //   }];
  //
  //   it('should return a string without line and column', () => {
  //     const result = formatter(code);
  //
  //     assert.equal(result, '\nfoo.scss\n  0:0  error  Couldn\'t find foo.scss\n\n\u2716 1 problem (1 error, 0 warnings)\n');
  //     assert.equal(chalkStub.yellow.bold.callCount, 0);
  //     assert.equal(chalkStub.red.bold.callCount, 1);
  //   });
  // });
});
