import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';
import assert from 'assert';

import { formatSize, getLastDirectory, sleep , buildSearchQuery, turnNicksIntoArray, getExcludedUsers, searchHistoryStats } from '../utils';

describe('buildSearchQuery', () => {
  it('Should properly parse search queries', () => {
    expect(buildSearchQuery({
      pattern_list: 'Something1-Searching\nSomething-Else',
      extensions: '.mp3;.mov',
      excluded: 'word1;word2',
      file_type: 'Folder',
      excluded_users: 'usera;userb',
      exact_match: true,
      priority: 0,
      queue_all: false,
      queue_dupe: 'no_dupes',
      remove_after_found: false,
      remove_dupe: false,
      target_directory: '',
      min_size: 123123513,
    }, 'Something1-Searching')).to.deep.equal({
      pattern: 'Something1-Searching',
      extensions: ['.mp3','.mov'],
      excluded: ['word1','word2'],
      file_type: 'Folder',
      min_size: 129104360767488,
    });
  });
});

describe('searchHistoryStats', () => {
  it('Should show correct times etc when db is populated', async () => {

    let dbFilePath = "./src/tests/data/db.json"
    const dateStub = sinon.stub(Date, 'now').returns(1633143902892);

    expect(await searchHistoryStats(dbFilePath)).to.deep.equal(
      { totalSearches: 2,
        oldestSearch: '2021-09-06T21:48:29.646Z',
        newestSearch: '2021-09-06T21:53:29.646Z',
        timeDifference: 300,
        timeSince: 2178693
      }
    );

    dateStub.restore();
  });

  it('Should show zeros etc when db is empty', async () => {

    let dbFilePath = "./src/tests/data/db_non_existent.json"

    expect(await searchHistoryStats(dbFilePath)).to.deep.equal(
      { totalSearches: 0,
        oldestSearch: 'no searches ran yet',
        newestSearch: 'no searches ran yet',
        timeDifference: 0,
        timeSince: 0,
      }
    );
  });

});

describe('turnNicksIntoArray', () => {
  it('Should turn string of nicks into clean array', () => {
    expect(
      turnNicksIntoArray(
        '#[prefix]-user/name (--[prefix-user/name]--, [prefix]username, [prefix]username, [prefix]username, username )'
      )
    ).to.deep.equal(
      [ '#[prefix]-user/name', '--[prefix-user/name]--', '[prefix]username', '[prefix]username', '[prefix]username', 'username' ]
    );
  });
});

describe('getExcludedUsers', () => {
  it('Should return array of users when users are listed', () => {
    expect(
      getExcludedUsers(
        '--[prefix-user/name]--;username2;[prefix]username'
      )
    ).to.deep.equal(
      [ '--[prefix-user/name]--', 'username2', '[prefix]username']
    );
  });
  it('Should return empty array when no users are listed', () => {
    expect(getExcludedUsers('')).to.deep.equal([]);
  });
  it('Should return single element array when one user is listed', () => {
    expect(getExcludedUsers('--[prefix-user/name]--')).to.deep.equal(['--[prefix-user/name]--']);
  });
});

describe('formatSize', () => {
  it('Should format bytes to MiB, GiB, TiB', () => {
    expect(formatSize(9812391156851)).to.equal('8.92 TB');
  });
  it('Should properly show Byte values', () => {
    expect(formatSize(1000)).to.equal('1000 B');
  });
});

describe('getLastDirectory', () => {
  it('Should return last folder of a path, when no trailing slash provided', () => {
    expect(getLastDirectory('/home/user/folder/2ndfolder/lastfolder')).to.equal('lastfolder');
  });
  it('Should return last folder of a path, when trailing slash provided', () => {
    expect(getLastDirectory('/home/user/folder/2ndfolder/lastfolder/')).to.equal('lastfolder');
  });
  it('Should return last folder, when root level folder', () => {
    expect(getLastDirectory('/home')).to.equal('home');
  });
  it('Should return full path if last folder can\'t be determined', () => {
    expect(getLastDirectory('/home/user//')).to.equal('/home/user//');
  });
});

describe('sleep', () => {
  it('Should sleep for specified amount', () => {
    sleep(100);
    assert.ok(true);
  });
});
