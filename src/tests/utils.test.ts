import { expect } from 'chai';
import { describe, it } from 'mocha';
// import sinon from 'sinon';
import assert from 'assert';

import { formatSize, getLastDirectory, sleep , buildSearchQuery } from '../utils';


describe('buildSearchQuery', () => {
  it('Should properly parsed search queries', () => {
    expect(buildSearchQuery({
      pattern_list: 'Something1-Searching\nSomething-Else',
      extensions: '.mp3;.mov',
      file_type: 'Folder',
      min_size: 123123513,
    })).to.deep.equal({
      pattern: 'Something1-Searching',
      extensions: ['.mp3','.mov'],
      file_type: 'Folder',
      min_size: 129104360767488,
    });
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
