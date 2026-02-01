import { describe, it, expect } from 'vitest';
import { createTaskSchema, updateTaskSchema, formatZodError } from '@/lib/validation';

describe('Validation', () => {
  describe('createTaskSchema', () => {
    it('should validate a minimal task', () => {
      const result = createTaskSchema.safeParse({ title: 'Test task' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test task');
        expect(result.data.priority).toBe('MEDIUM'); // default
        expect(result.data.creator).toBe('MOBY'); // default
      }
    });

    it('should reject empty title', () => {
      const result = createTaskSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only title', () => {
      const result = createTaskSchema.safeParse({ title: '   ' });
      expect(result.success).toBe(false);
    });

    it('should reject title over 200 chars', () => {
      const result = createTaskSchema.safeParse({ title: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from title', () => {
      const result = createTaskSchema.safeParse({ title: '  Test  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test');
      }
    });

    it('should accept valid priority', () => {
      const result = createTaskSchema.safeParse({ 
        title: 'Test', 
        priority: 'URGENT' 
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('URGENT');
      }
    });

    it('should reject invalid priority', () => {
      const result = createTaskSchema.safeParse({ 
        title: 'Test', 
        priority: 'INVALID' 
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid creator', () => {
      const result = createTaskSchema.safeParse({ 
        title: 'Test', 
        creator: 'STEPHAN' 
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.creator).toBe('STEPHAN');
      }
    });

    it('should accept valid projectId', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = createTaskSchema.safeParse({ 
        title: 'Test', 
        projectId: uuid 
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid projectId', () => {
      const result = createTaskSchema.safeParse({ 
        title: 'Test', 
        projectId: 'not-a-uuid' 
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateTaskSchema', () => {
    it('should allow partial updates', () => {
      const result = updateTaskSchema.safeParse({ title: 'New title' });
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const result = updateTaskSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate status', () => {
      const result = updateTaskSchema.safeParse({ status: 'IN_PROGRESS' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateTaskSchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should allow null projectId', () => {
      const result = updateTaskSchema.safeParse({ projectId: null });
      expect(result.success).toBe(true);
    });

    it('should allow needsReview boolean', () => {
      const result = updateTaskSchema.safeParse({ needsReview: true });
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean needsReview', () => {
      const result = updateTaskSchema.safeParse({ needsReview: 'yes' });
      expect(result.success).toBe(false);
    });
  });

  describe('formatZodError', () => {
    it('should format single error', () => {
      const result = createTaskSchema.safeParse({ title: '' });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted).toContain('Title is required');
      }
    });

    it('should join multiple errors', () => {
      const result = createTaskSchema.safeParse({ 
        title: '', 
        priority: 'INVALID' 
      });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted).toContain(',');
      }
    });
  });
});
