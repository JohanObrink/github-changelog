const chai = require('chai')
const expect = chai.expect
const {stub, match} = require('sinon')
const proxyquire = require('proxyquire')
chai.use(require('sinon-chai'))

function response (status, body) {
  if (typeof status !== 'number') {
    body = status
    status = 200
  }
  return {
    status,
    json: stub().resolves(body)
  }
}

describe('releases', () => {
  let listReleases
  let fetch
  let org, auth, options
  beforeEach(() => {
    org = 'some-org'
    auth = {username: 'some-user', token: 'some-token'}
    options = {
      org,
      auth
    }

    fetch = stub().resolves(response([]))
    const releases = proxyquire(`${process.cwd()}/lib/releases`, {
      'node-fetch': fetch
    })
    listReleases = releases.listReleases
  })
  it('uses Basic auth', () => {
    const headers = {'Authorization': 'Basic c29tZS11c2VyOnNvbWUtdG9rZW4='}
    return listReleases(options)
      .then(() => {
        expect(fetch)
          .calledOnce
          .calledWith(match.string, {headers})
      })
  })
  it('lists all repos in an org', () => {
    return listReleases(options)
      .then(() => {
        expect(fetch)
          .calledOnce
          .calledWith('https://api.github.com/orgs/some-org/repos')
      })
  })
  it('reads releases from every repo', () => {
    const repos = [{name: 'repo1'}, {name: 'repo2'}, {name: 'repo3'}]
    fetch
      .withArgs('https://api.github.com/orgs/some-org/repos')
      .resolves(response(repos))

    return listReleases(options)
      .then(() => {
        expect(fetch.callCount, 'callCount').to.equal(4)

        expect(fetch.getCall(1))
          .calledWith('https://api.github.com/repos/some-org/repo1/releases')
        expect(fetch.getCall(2))
          .calledWith('https://api.github.com/repos/some-org/repo2/releases')
        expect(fetch.getCall(3))
          .calledWith('https://api.github.com/repos/some-org/repo3/releases')
      })
  })
  it('adds repo info to release', () => {
    const repos = [{name: 'repo1'}]
    const releases = [{name: 'release1', body: ''}]
    fetch
      .withArgs('https://api.github.com/orgs/some-org/repos')
      .resolves(response(repos))
    fetch
      .withArgs('https://api.github.com/repos/some-org/repo1/releases')
      .resolves(response(releases))

    return listReleases(options)
      .then(res => {
        expect(res[0].repo).to.eql(repos[0])
      })
  })
  it('filters out repos without releases', () => {
    const repos = [{name: 'repo1'}, {name: 'repo2'}, {name: 'repo3'}]
    const releases1 = [{name: 'release1-1', body: '', created_at: '2017-08-28T06:54:15Z'}]
    const releases2 = []
    const releases3 = [{name: 'release3-1', body: '', created_at: '2017-06-30T06:54:15Z'}]
    fetch
      .withArgs('https://api.github.com/orgs/some-org/repos')
      .resolves(response(repos))
    fetch
      .withArgs('https://api.github.com/repos/some-org/repo1/releases')
      .resolves(response(releases1))
    fetch
      .withArgs('https://api.github.com/repos/some-org/repo2/releases')
      .resolves(response(releases2))
    fetch
      .withArgs('https://api.github.com/repos/some-org/repo3/releases')
      .resolves(response(releases3))

    return listReleases(options)
      .then(res => {
        expect(res).to.eql([releases1[0], releases3[0]])
      })
  })
  it('sorts releases by date', () => {
    const repos = [{name: 'repo1'}, {name: 'repo2'}, {name: 'repo3'}]
    const releases1 = [{name: 'release1-1', body: '', created_at: '2017-08-28T06:54:15Z'}]
    const releases2 = [{name: 'release2-1', body: '', created_at: '2017-08-30T06:54:15Z'}]
    const releases3 = [{name: 'release3-1', body: '', created_at: '2017-06-30T06:54:15Z'}]
    fetch
      .withArgs('https://api.github.com/orgs/some-org/repos')
      .resolves(response(repos))
    fetch
      .withArgs('https://api.github.com/repos/some-org/repo1/releases')
      .resolves(response(releases1))
    fetch
      .withArgs('https://api.github.com/repos/some-org/repo2/releases')
      .resolves(response(releases2))
    fetch
      .withArgs('https://api.github.com/repos/some-org/repo3/releases')
      .resolves(response(releases3))

    return listReleases(options)
      .then(res => {
        expect(res).to.eql([releases2[0], releases1[0], releases3[0]])
      })
  })
})
