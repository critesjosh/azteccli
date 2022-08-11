import {expect, test} from '@oclif/test'

describe('setwallet', () => {
  test
  .stdout()
  .command(['setwallet'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['setwallet', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
