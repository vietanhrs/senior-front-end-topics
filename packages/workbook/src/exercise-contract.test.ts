import { describe, expect, test } from 'bun:test';
import { EXERCISE_ACCEPTANCE_CRITERIA } from './ui';

describe('senior exercise contract', () => {
  test('covers test strategy, performance, failure modes, and trade-offs', () => {
    expect(EXERCISE_ACCEPTANCE_CRITERIA.map((criterion) => criterion.id)).toEqual([
      'unit-test',
      'e2e-test',
      'performance-budget',
      'failure-case',
      'trade-off',
    ]);
  });

  test('keeps each criterion reviewable', () => {
    for (const criterion of EXERCISE_ACCEPTANCE_CRITERIA) {
      expect(criterion.label.length).toBeGreaterThan(5);
      expect(criterion.detail.length).toBeGreaterThan(40);
    }
  });
});
