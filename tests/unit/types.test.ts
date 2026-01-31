import { describe, it, expect } from 'vitest';
import { COLUMNS, PRIORITIES, CREATORS, Status, Priority, Creator } from '@/lib/types';

describe('Types', () => {
  describe('COLUMNS', () => {
    it('should have three columns in correct order', () => {
      expect(COLUMNS).toHaveLength(3);
      expect(COLUMNS[0].id).toBe('BACKLOG');
      expect(COLUMNS[1].id).toBe('IN_PROGRESS');
      expect(COLUMNS[2].id).toBe('DONE');
    });

    it('should have titles for all columns', () => {
      COLUMNS.forEach(col => {
        expect(col.title).toBeDefined();
        expect(col.title.length).toBeGreaterThan(0);
      });
    });
  });

  describe('PRIORITIES', () => {
    it('should have four priority levels', () => {
      expect(PRIORITIES).toHaveLength(4);
    });

    it('should include LOW, MEDIUM, HIGH, URGENT', () => {
      const values = PRIORITIES.map(p => p.value);
      expect(values).toContain('LOW');
      expect(values).toContain('MEDIUM');
      expect(values).toContain('HIGH');
      expect(values).toContain('URGENT');
    });

    it('should have colors for all priorities', () => {
      PRIORITIES.forEach(p => {
        expect(p.color).toMatch(/^bg-/);
      });
    });
  });

  describe('CREATORS', () => {
    it('should have two creators', () => {
      expect(CREATORS).toHaveLength(2);
    });

    it('should include MOBY and STEPHAN', () => {
      const values = CREATORS.map(c => c.value);
      expect(values).toContain('MOBY');
      expect(values).toContain('STEPHAN');
    });

    it('should have emojis for all creators', () => {
      const moby = CREATORS.find(c => c.value === 'MOBY');
      const stephan = CREATORS.find(c => c.value === 'STEPHAN');
      expect(moby?.emoji).toBe('🐋');
      expect(stephan?.emoji).toBe('👤');
    });
  });
});
