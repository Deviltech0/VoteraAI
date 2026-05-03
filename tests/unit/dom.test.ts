import { describe, it, expect } from 'vitest';
import { renderSafeHTML } from '../../src/utils/dom';

describe('dom utils', () => {
  it('should safely render HTML into container without using innerHTML', () => {
    const container = document.createElement('div');
    renderSafeHTML(container, '<p>Hello <span>World</span></p>');
    
    expect(container.childNodes.length).toBe(1);
    expect(container.querySelector('p')?.textContent).toBe('Hello World');
  });
});
