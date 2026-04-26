import { describe, expect, test } from '../../tests/runner';
import { teamFromSlug } from './teamSlugs';

describe('teamFromSlug', () => {
  test('canonical English slugs resolve to the right team', () => {
    expect(teamFromSlug('argentina')).toBe('ARG');
    expect(teamFromSlug('brazil')).toBe('BRA');
    expect(teamFromSlug('spain')).toBe('ESP');
    expect(teamFromSlug('france')).toBe('FRA');
    expect(teamFromSlug('portugal')).toBe('POR');
    expect(teamFromSlug('england')).toBe('ENG');
  });

  test('native-language aliases work', () => {
    expect(teamFromSlug('brasil')).toBe('BRA');
    expect(teamFromSlug('espana')).toBe('ESP');
    expect(teamFromSlug('alemania')).toBe('GER');
    expect(teamFromSlug('allemagne')).toBe('GER');
    expect(teamFromSlug('alemanha')).toBe('GER');
  });

  test('three-letter team codes work as slugs', () => {
    expect(teamFromSlug('arg')).toBe('ARG');
    expect(teamFromSlug('bra')).toBe('BRA');
    expect(teamFromSlug('esp')).toBe('ESP');
  });

  test('strips leading/trailing slashes', () => {
    expect(teamFromSlug('/argentina')).toBe('ARG');
    expect(teamFromSlug('/argentina/')).toBe('ARG');
    expect(teamFromSlug('argentina/')).toBe('ARG');
  });

  test('lowercases input', () => {
    expect(teamFromSlug('Argentina')).toBe('ARG');
    expect(teamFromSlug('BRAZIL')).toBe('BRA');
  });

  test('strips diacritics so accented forms work', () => {
    expect(teamFromSlug('españa')).toBe('ESP');
    expect(teamFromSlug('türkiye')).toBe('TUR');
    expect(teamFromSlug('équateur')).toBe('ECU');
  });

  test('multi-word countries use hyphens', () => {
    expect(teamFromSlug('south-korea')).toBe('KOR');
    expect(teamFromSlug('south-africa')).toBe('RSA');
    expect(teamFromSlug('united-states')).toBe('USA');
    expect(teamFromSlug('cape-verde')).toBe('CPV');
    expect(teamFromSlug('saudi-arabia')).toBe('KSA');
    expect(teamFromSlug('new-zealand')).toBe('NZL');
  });

  test('returns null for unknown slugs', () => {
    expect(teamFromSlug('atlantis')).toBeNull();
    expect(teamFromSlug('zzz')).toBeNull();
    expect(teamFromSlug('')).toBeNull();
    expect(teamFromSlug('/')).toBeNull();
  });

  test('USA and US both work (host country)', () => {
    expect(teamFromSlug('usa')).toBe('USA');
    expect(teamFromSlug('us')).toBe('USA');
    expect(teamFromSlug('united-states')).toBe('USA');
  });

  test('Türkiye spellings all work', () => {
    expect(teamFromSlug('turkey')).toBe('TUR');
    expect(teamFromSlug('turkiye')).toBe('TUR');
    expect(teamFromSlug('türkiye')).toBe('TUR');
  });
});
