import { describe, expect, it } from 'vitest';
import { type GithubRelease, parseRelease, pickLatest } from './app-release';

const sha = 'a'.repeat(64);
const rel = (over: Partial<GithubRelease> = {}): GithubRelease => ({
  tag_name: 'v1.1',
  name: 'FleetTrack 1.1',
  body: `Faster sync\n\nversion-code: 2\nsha256: ${sha}`,
  draft: false,
  prerelease: false,
  published_at: '2026-10-09T10:00:00Z',
  assets: [{ id: 7, name: 'FleetTrack-1.1.apk', size: 3_300_000 }],
  ...over,
});

describe('app releases', () => {
  it('parses metadata and keeps the rest as notes', () => {
    const r = parseRelease(rel({ body: `Faster sync\nversion-code: 3\nsha256: ${sha}\nmin-version-code: 2` }))!;
    expect(r).toMatchObject({ versionName: '1.1', versionCode: 3, minVersionCode: 2, sha256: sha, notes: 'Faster sync', assetId: 7 });
  });
  it('rejects releases without an APK, a version code or a valid sha256', () => {
    expect(parseRelease(rel({ assets: [] }))).toBeNull();
    expect(parseRelease(rel({ body: `sha256: ${sha}` }))).toBeNull();
    expect(parseRelease(rel({ body: 'version-code: 2\nsha256: nothex' }))).toBeNull();
    expect(parseRelease(rel({ draft: true }))).toBeNull();
  });
  it('picks the highest version code and skips prereleases unless allowed', () => {
    const list = [rel(), rel({ tag_name: 'v1.2', body: `version-code: 3\nsha256: ${sha}`, prerelease: true })];
    expect(pickLatest(list)?.versionCode).toBe(2);
    expect(pickLatest(list, true)?.versionCode).toBe(3);
  });
});
