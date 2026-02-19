import React from 'react';
import Link from '@docusaurus/Link';

function flattenToc(items, depth = 0) {
  const result = [];
  for (const item of items) {
    result.push({...item, depth});
    if (item.children?.length) {
      result.push(...flattenToc(item.children, depth + 1));
    }
  }
  return result;
}

function TOCItemTree({toc, className, linkClassName, isChild}) {
  if (!toc.length) return null;
  if (isChild) return null;

  const flat = flattenToc(toc);
  return (
    <ul className={className}>
      {flat.map((heading) => (
        <li key={heading.id} className={heading.depth > 0 ? 'toc-h3' : undefined}>
          <Link
            to={`#${heading.id}`}
            className={linkClassName ?? undefined}
            dangerouslySetInnerHTML={{__html: heading.value}}
          />
        </li>
      ))}
    </ul>
  );
}

export default React.memo(TOCItemTree);
