const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const execa = require('execa')

const writeFile = promisify(fs.writeFile)

const updateEnvVars = (envVars) => {
  Object.keys(envVars).forEach((key) => {
    process.env[key] = envVars[key]
  })
}

exports.updateEnvVars = updateEnvVars

exports.gitEmptyCommit = (cwd, message) =>
  execa('git', ['commit', '--allow-empty', '-m', message], { cwd })

exports.getCommitHashes = async (cwd) => {
  const { stdout } = await execa.command('git log --pretty=%H', { cwd })
  const hashes = stdout.split('\n').reverse()

  return hashes
}

exports.updatePushEnvVars = (cwd, to) => {
  updateEnvVars({
    GITHUB_WORKSPACE: cwd,
    GITHUB_EVENT_NAME: 'push',
    GITHUB_SHA: to,
  })
}

exports.createPushEventPayload = async (
  cwd,
  { before = null, to, forced = false },
) => {
  const payload = {
    after: to,
    before,
    forced,
  }
  const eventPath = path.join(cwd, 'pushEventPayload.json')

  updateEnvVars({ GITHUB_EVENT_PATH: eventPath })
  await writeFile(eventPath, JSON.stringify(payload), 'utf8')
}

exports.createPullRequestEventPayload = async (cwd) => {
  const payload = {
    number: '1',
    repository: {
      owner: {
        login: 'aperdomob',
      },
      name: 'commitlint-github-action',
    },
  }

  const eventPath = path.join(cwd, 'pullRequestEventPayload.json')

  updateEnvVars({
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_REPOSITORY: 'aperdomob/commitlint-github-action',
  })
  await writeFile(eventPath, JSON.stringify(payload), 'utf8')
}

exports.updatePullRequestEnvVars = (cwd, to, options = {}) => {
  const { eventName = 'pull_request' } = options

  updateEnvVars({
    GITHUB_WORKSPACE: cwd,
    GITHUB_EVENT_NAME: eventName,
    GITHUB_SHA: to,
  })
}
