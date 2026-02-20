const fs = require('fs');
const path = require('path');

function parseGroupsFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];
  const yaml = match[1];
  const groups = [];
  let current = null;
  for (const line of yaml.split('\n')) {
    const labelMatch = line.match(/^\s+-\s+label:\s*(.+)/);
    const iconMatch = line.match(/^\s+icon:\s*(.+)/);
    const positionMatch = line.match(/^\s+position:\s*(\d+)/);
    if (labelMatch) {
      current = {label: labelMatch[1].trim(), icon: null, position: 0};
      groups.push(current);
    } else if (current && iconMatch) {
      current.icon = iconMatch[1].trim();
    } else if (current && positionMatch) {
      current.position = parseInt(positionMatch[1], 10);
    }
  }
  return groups;
}

function buildPositionMap(docs) {
  const map = new Map();
  for (const doc of docs) {
    if (doc.sidebarPosition != null) map.set(doc.id, doc.sidebarPosition);
  }
  return map;
}

// Find the common sourceDirName prefix for a set of docs.
// If all top-level docs share a single subfolder, return it.
// e.g. docs in notes/notes.md and notes/reading-pipeline.md → 'notes'
// Mixed dirs like '.', 'email', 'email/config' → '.'
function findCommonDir(docs) {
  const topDirs = new Set();
  for (const doc of docs) {
    const dir = doc.sourceDirName;
    // Get the first path segment
    const top = dir === '.' ? '.' : dir.split('/')[0];
    topDirs.add(top);
  }
  // If all docs share exactly one non-root top dir, use it
  if (topDirs.size === 1) {
    const dir = [...topDirs][0];
    return dir;
  }
  return '.';
}

async function mintysaurusSidebarItemsGenerator({
  defaultSidebarItemsGenerator,
  item,
  docs,
  version,
  ...args
}) {
  const groupsFile = path.join(version.contentPath, '_groups.md');
  let groups = [];
  try {
    const content = fs.readFileSync(groupsFile, 'utf-8');
    groups = parseGroupsFrontmatter(content);
  } catch {
    return defaultSidebarItemsGenerator({item, docs, version, ...args});
  }

  if (groups.length === 0) {
    return defaultSidebarItemsGenerator({item, docs, version, ...args});
  }

  const groupMap = new Map(groups.map(g => [g.label, g]));
  const posMap = buildPositionMap(docs);

  const groupedDocs = new Map();
  const ungroupedDocs = [];

  for (const doc of docs) {
    const group = doc.frontMatter.sidebar_group;
    if (group && groupMap.has(group)) {
      if (!groupedDocs.has(group)) groupedDocs.set(group, []);
      groupedDocs.get(group).push(doc);
    } else if (!group) {
      ungroupedDocs.push(doc);
    }
  }

  // Generate ungrouped items
  const ungroupedItems = await defaultSidebarItemsGenerator({
    item,
    docs: ungroupedDocs,
    version,
    ...args,
  });

  // Generate group categories
  const groupCategories = [];
  for (const group of groups) {
    const groupDocs = groupedDocs.get(group.label) || [];
    if (groupDocs.length === 0) continue;

    // Determine the best dirName for this group's docs
    const commonDir = findCommonDir(groupDocs);
    const genItem = {...item, dirName: commonDir};

    const items = await defaultSidebarItemsGenerator({
      item: genItem,
      docs: groupDocs,
      version,
      ...args,
    });

    groupCategories.push({
      type: 'category',
      label: group.label,
      collapsible: false,
      collapsed: false,
      className: group.icon ? `sidebar-icon-${group.icon}` : undefined,
      items,
    });
  }

  // Merge and sort
  const allItems = [
    ...ungroupedItems.map(item => ({
      ...item,
      _pos: (item.type === 'doc' && posMap.has(item.id)) ? posMap.get(item.id) : 999,
    })),
    ...groupCategories.map(cat => ({
      ...cat,
      _pos: groups.find(g => g.label === cat.label)?.position ?? 999,
    })),
  ];
  allItems.sort((a, b) => (a._pos ?? 999) - (b._pos ?? 999));

  return allItems.map(({_pos, ...rest}) => rest);
}

module.exports = mintysaurusSidebarItemsGenerator;
