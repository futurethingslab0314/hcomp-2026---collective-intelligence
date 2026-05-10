import React from 'react';

import type { ContentBlock, RichTextSpan } from '../lib/notionContent';

function renderRichText(spans: RichTextSpan[], keyPrefix: string) {
  if (!spans.length) {
    return null;
  }

  return spans.map((span, index) => {
    const content = (
      <span
        className={[
          span.bold ? 'font-bold text-white' : '',
          span.italic ? 'italic font-serif' : '',
          span.underline ? 'underline underline-offset-4' : '',
          span.strikethrough ? 'line-through' : '',
          span.code ? 'font-mono text-[0.95em] bg-white/10 px-1.5 py-0.5 rounded' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {span.text}
      </span>
    );

    if (span.href) {
      return (
        <a
          key={`${keyPrefix}-${index}`}
          href={span.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-teal hover:text-white transition-colors underline underline-offset-4"
        >
          {content}
        </a>
      );
    }

    return <React.Fragment key={`${keyPrefix}-${index}`}>{content}</React.Fragment>;
  });
}

function renderListItem(
  block: Extract<ContentBlock, { type: 'bulleted_list_item' | 'numbered_list_item' }>,
  index: number,
  ordered: boolean,
) {
  return (
    <li key={`${block.type}-${index}`} className="space-y-3">
      <div className="flex items-start gap-3 text-white/75 leading-relaxed">
        <span className="mt-1.5 shrink-0 text-brand-teal font-bold">{ordered ? `${index + 1}.` : '•'}</span>
        <div className="flex-1">{renderRichText(block.richText, `${block.type}-${index}`)}</div>
      </div>
      {block.children?.length ? (
        <div className="pl-8">
          <NotionContentRenderer blocks={block.children} />
        </div>
      ) : null}
    </li>
  );
}

export default function NotionContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        if (block.type === 'heading_1') {
          return (
            <h1 key={`block-${index}`} className="text-3xl md:text-4xl font-display font-bold text-white">
              {renderRichText(block.richText, `h1-${index}`)}
            </h1>
          );
        }

        if (block.type === 'heading_2') {
          return (
            <h2 key={`block-${index}`} className="text-2xl md:text-3xl font-display font-bold text-white">
              {renderRichText(block.richText, `h2-${index}`)}
            </h2>
          );
        }

        if (block.type === 'heading_3') {
          return (
            <h3 key={`block-${index}`} className="text-xl md:text-2xl font-bold text-white">
              {renderRichText(block.richText, `h3-${index}`)}
            </h3>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p key={`block-${index}`} className="text-sm md:text-base text-white/70 leading-relaxed font-light">
              {renderRichText(block.richText, `p-${index}`)}
            </p>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={`block-${index}`}
              className="border-l-2 border-brand-blue/40 pl-6 text-white/70 italic font-serif text-base md:text-lg"
            >
              {renderRichText(block.richText, `quote-${index}`)}
            </blockquote>
          );
        }

        if (block.type === 'callout') {
          return (
            <div key={`block-${index}`} className="glass rounded-[2rem] border border-white/10 p-6">
              <p className="text-sm md:text-base text-white/75 leading-relaxed">
                {renderRichText(block.richText, `callout-${index}`)}
              </p>
            </div>
          );
        }

        if (block.type === 'divider') {
          return <div key={`block-${index}`} className="h-px bg-white/10" />;
        }

        if (block.type === 'bulleted_list') {
          return (
            <ul key={`block-${index}`} className="space-y-4">
              {block.items.map((item, itemIndex) => renderListItem(item, itemIndex, false))}
            </ul>
          );
        }

        if (block.type === 'numbered_list') {
          return (
            <ol key={`block-${index}`} className="space-y-4">
              {block.items.map((item, itemIndex) => renderListItem(item, itemIndex, true))}
            </ol>
          );
        }

        if (block.type === 'table') {
          return (
            <div key={`block-${index}`} className="overflow-x-auto glass rounded-[2rem] border border-white/10">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr
                      key={`row-${rowIndex}`}
                      className={rowIndex === 0 ? 'bg-white/10 border-b border-white/10' : 'border-b border-white/5'}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`cell-${rowIndex}-${cellIndex}`}
                          className={`p-4 align-top ${rowIndex === 0 ? 'text-[10px] uppercase tracking-widest font-bold text-white/90' : 'text-sm text-white/70 leading-relaxed'}`}
                        >
                          {renderRichText(cell, `table-${rowIndex}-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
