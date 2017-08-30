const fetch = require('node-fetch')
const moment = require('moment')
const marked = require('marked')

function authenticate (options) {
  const headers = Object.assign({}, options.headers || {})
  const auth = Buffer.from(`${options.auth.username}:${options.auth.token}`).toString('base64')
  headers['Authorization'] = `Basic ${auth}`
  return Object.assign({}, options, {headers})
}

function getRepoList ({org, headers}) {
  return fetch(`https://api.github.com/orgs/${org}/repos`, {headers})
    .then(res => res.json())
}

function getReleasesForRepoList (options, repoList) {
  return Promise
    .all(repoList.map(repo => getReleasesForRepo(options, repo)))
    .then(releaseLists => {
      return releaseLists.filter(releaseList => releaseList.length)
    })
    .then(releaseLists => {
      return releaseLists.reduce((rl1, rl2) => rl1.concat(rl2), [])
    })
}

function getReleasesForRepo ({org, headers}, repo) {
  return fetch(`https://api.github.com/repos/${org}/${repo.name}/releases`, {headers})
    .then(res => res.json())
    .then(releases => releases.map(release => Object.assign(release, {
      repo,
      bodyHtml: marked(release.body),
      date: moment(release.created_at).format('YYYY-MM-DD')
    })))
}

function sortReleases (release1, relase2) {
  return moment(release1.created_at).unix() > moment(relase2.created_at).unix() ? -1 : 1
}

function listReleases (options) {
  options = authenticate(options)
  return getRepoList(options)
    .then(repos => getReleasesForRepoList(options, repos))
    .then(releases => releases.sort((r1, r2) => sortReleases(r1, r2)))
}

module.exports = {listReleases}
