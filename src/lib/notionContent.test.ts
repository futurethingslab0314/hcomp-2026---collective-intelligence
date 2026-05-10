import test from 'node:test';
import assert from 'node:assert/strict';

import { coalesceDocumentBlocks, extractNotionId } from './notionContent';

test('extractNotionId returns raw IDs from slugged page references', () => {
  assert.equal(
    extractNotionId('General-Instructions-35ca7f1b413c80dbb890fd84191ffa09'),
    '35ca7f1b413c80dbb890fd84191ffa09',
  );
  assert.equal(
    extractNotionId('https://www.notion.so/workspace/General-Instructions-35ca7f1b413c80dbb890fd84191ffa09'),
    '35ca7f1b413c80dbb890fd84191ffa09',
  );
  assert.equal(extractNotionId('35ba7f1b413c802aad53d85c1128b724'), '35ba7f1b413c802aad53d85c1128b724');
});

test('coalesceDocumentBlocks merges adjacent list items into list groups', () => {
  const result = coalesceDocumentBlocks([
    { type: 'paragraph', richText: [] },
    { type: 'bulleted_list_item', richText: [{ text: 'One' }] },
    { type: 'bulleted_list_item', richText: [{ text: 'Two' }] },
    { type: 'numbered_list_item', richText: [{ text: 'Three' }] },
    { type: 'numbered_list_item', richText: [{ text: 'Four' }] },
  ]);

  assert.deepEqual(result, [
    { type: 'paragraph', richText: [] },
    {
      type: 'bulleted_list',
      items: [
        { type: 'bulleted_list_item', richText: [{ text: 'One' }] },
        { type: 'bulleted_list_item', richText: [{ text: 'Two' }] },
      ],
    },
    {
      type: 'numbered_list',
      items: [
        { type: 'numbered_list_item', richText: [{ text: 'Three' }] },
        { type: 'numbered_list_item', richText: [{ text: 'Four' }] },
      ],
    },
  ]);
});
