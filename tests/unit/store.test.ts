import { describe, it, expect } from 'vitest';
import { createTaskLocal } from '@/lib/store';

describe('Store', () => {
  describe('createTaskLocal', () => {
    it('should create a task with required fields', () => {
      const task = createTaskLocal({ title: 'Test task' });
      
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test task');
      expect(task.status).toBe('BACKLOG');
      expect(task.priority).toBe('MEDIUM');
      expect(task.creator).toBe('MOBY');
      expect(task.needsReview).toBe(false);
      expect(task.position).toBe(0);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept optional description', () => {
      const task = createTaskLocal({ 
        title: 'Test', 
        description: 'A description' 
      });
      
      expect(task.description).toBe('A description');
    });

    it('should accept optional priority', () => {
      const task = createTaskLocal({ 
        title: 'Test', 
        priority: 'URGENT' 
      });
      
      expect(task.priority).toBe('URGENT');
    });

    it('should accept optional creator', () => {
      const task = createTaskLocal({ 
        title: 'Test', 
        creator: 'STEPHAN' 
      });
      
      expect(task.creator).toBe('STEPHAN');
    });

    it('should generate unique IDs', () => {
      const task1 = createTaskLocal({ title: 'Task 1' });
      const task2 = createTaskLocal({ title: 'Task 2' });
      
      expect(task1.id).not.toBe(task2.id);
    });
  });
});
