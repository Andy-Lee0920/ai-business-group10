import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const route = 'app/api/community/posts/[postId]/empathy/route.ts';

describe('community empathy route contract', () => {
  it('toggles empathy for the current couple actor through the public community post endpoint', () => {
    expect(existsSync(route)).toBe(true);
    const source = readFileSync(route, 'utf8');

    expect(source).toContain("from('community_post_empathies')");
    expect(source).toContain('actor_couple_id');
    expect(source).toContain('actor_role');
    expect(source).toContain('.delete()');
    expect(source).toContain('.insert(');
    expect(source).toContain('{ active:');
  });
});
