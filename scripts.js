document.addEventListener('DOMContentLoaded', () => {
  initChildTreeHeights();
  initToggle();
  initExpandCollapseAll();
  initSearch();
  initTooltips();
  updateSearchCount('');
});

/* ─── TOGGLE SECTIONS ─── */

function initToggle() {
  document.querySelectorAll('.section-hub').forEach(hub => {
    hub.addEventListener('click', () => {
      const treeId = hub.getAttribute('aria-controls');
      const tree = document.getElementById(treeId);
      const isExpanded = hub.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        collapseTree(tree, hub);
      } else {
        expandTree(tree, hub);
      }
    });
  });
}

function expandTree(tree, hub) {
  tree.classList.remove('collapsed');
  tree.classList.remove('collapsing');
  tree.style.maxHeight = tree.scrollHeight + 'px';
  hub.setAttribute('aria-expanded', 'true');
  const arrow = hub.querySelector('.toggle-arrow');
  if (arrow) {
    arrow.classList.remove('collapsed');
    arrow.textContent = '\u25BC';
  }
}

function collapseTree(tree, hub) {
  tree.classList.add('collapsing');
  tree.style.maxHeight = tree.scrollHeight + 'px';
  requestAnimationFrame(() => {
    tree.style.maxHeight = '0px';
    tree.classList.add('collapsed');
  });
  tree.addEventListener('transitionend', function handler() {
    tree.classList.remove('collapsing');
    tree.removeEventListener('transitionend', handler);
  });
  hub.setAttribute('aria-expanded', 'false');
  const arrow = hub.querySelector('.toggle-arrow');
  if (arrow) {
    arrow.classList.add('collapsed');
    arrow.textContent = '\u25B6';
  }
}

/* ─── EXPAND ALL / COLLAPSE ALL ─── */

function initExpandCollapseAll() {
  const expandBtn = document.getElementById('expand-all');
  const collapseBtn = document.getElementById('collapse-all');

  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      document.querySelectorAll('.section-hub').forEach(hub => {
        const tree = document.getElementById(hub.getAttribute('aria-controls'));
        if (tree && hub.getAttribute('aria-expanded') === 'false') {
          expandTree(tree, hub);
        }
      });
    });
  }

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      document.querySelectorAll('.section-hub').forEach(hub => {
        const tree = document.getElementById(hub.getAttribute('aria-controls'));
        if (tree && hub.getAttribute('aria-expanded') === 'true') {
          collapseTree(tree, hub);
        }
      });
    });
  }
}

/* ─── SEARCH / FILTER ─── */

function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => filterLeaves(input.value.trim()), 200);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      filterLeaves('');
      input.blur();
    }
  });
}

function filterLeaves(query) {
  const leaves = document.querySelectorAll('.leaf');
  const lowerQuery = query.toLowerCase();
  let visibleCount = 0;

  leaves.forEach(leaf => {
    const title = (leaf.dataset.title || '').toLowerCase();
    const url = (leaf.dataset.url || '').toLowerCase();
    const tooltipEl = leaf.querySelector('.tooltip');
    const tooltipText = tooltipEl ? tooltipEl.textContent.toLowerCase() : '';

    if (!query || title.includes(lowerQuery) || url.includes(lowerQuery) || tooltipText.includes(lowerQuery)) {
      leaf.classList.remove('leaf--hidden');
      leaf.classList.toggle('leaf--highlight', !!query);
      visibleCount++;
    } else {
      leaf.classList.add('leaf--hidden');
      leaf.classList.remove('leaf--highlight');
    }
  });

  // Auto-expand sections with matches, collapse empty ones when searching
  if (query) {
    document.querySelectorAll('.section-col, section.section-col').forEach(col => {
      const tree = col.querySelector('.child-tree');
      const hub = col.querySelector('.section-hub');
      if (!tree || !hub) return;
      const hasVisible = tree.querySelectorAll('.leaf:not(.leaf--hidden)').length > 0;
      if (hasVisible) {
        expandTree(tree, hub);
      } else {
        collapseTree(tree, hub);
      }
    });
  }

  // Hide subcategory labels with no visible siblings
  document.querySelectorAll('.subcat-label').forEach(label => {
    let nextSibling = label.nextElementSibling;
    let hasVisibleLeaf = false;
    while (nextSibling && !nextSibling.classList.contains('subcat-label')) {
      if (nextSibling.classList.contains('leaf') && !nextSibling.classList.contains('leaf--hidden')) {
        hasVisibleLeaf = true;
        break;
      }
      nextSibling = nextSibling.nextElementSibling;
    }
    label.style.display = (query && !hasVisibleLeaf) ? 'none' : '';
  });

  // Recalculate max-heights for expanded trees after filtering
  document.querySelectorAll('.child-tree:not(.collapsed)').forEach(el => {
    el.style.maxHeight = el.scrollHeight + 'px';
  });

  updateSearchCount(query, visibleCount, leaves.length);
}

function updateSearchCount(query, visibleCount, totalCount) {
  const countEl = document.getElementById('search-count');
  if (!countEl) return;

  if (!query) {
    const total = totalCount || document.querySelectorAll('.leaf').length;
    countEl.textContent = total + ' pages';
  } else {
    countEl.textContent = visibleCount + ' of ' + totalCount + ' pages';
  }
}

/* ─── TOOLTIPS (TOUCH/CLICK/FOCUS) ─── */

function initTooltips() {
  const leaves = document.querySelectorAll('.leaf[tabindex="0"]');

  leaves.forEach(leaf => {
    const tooltip = leaf.querySelector('.tooltip');
    if (!tooltip) return;

    // Show on focus (keyboard navigation)
    leaf.addEventListener('focus', () => {
      tooltip.classList.add('tooltip--visible');
    });
    leaf.addEventListener('blur', () => {
      tooltip.classList.remove('tooltip--visible');
    });

    // Toggle on click/touch (mobile)
    leaf.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = tooltip.classList.contains('tooltip--visible');

      // Hide all other tooltips first
      document.querySelectorAll('.tooltip--visible').forEach(t => {
        t.classList.remove('tooltip--visible');
      });

      if (!isVisible) {
        tooltip.classList.add('tooltip--visible');
      }
    });
  });

  // Dismiss tooltips when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.tooltip--visible').forEach(t => {
      t.classList.remove('tooltip--visible');
    });
  });

  // Dismiss on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.tooltip--visible').forEach(t => {
        t.classList.remove('tooltip--visible');
      });
    }
  });
}

/* ─── INIT MAX HEIGHTS + RESIZE ─── */

function initChildTreeHeights() {
  document.querySelectorAll('.child-tree').forEach(el => {
    el.style.maxHeight = el.scrollHeight + 'px';
  });

  window.addEventListener('resize', debounce(() => {
    document.querySelectorAll('.child-tree:not(.collapsed)').forEach(el => {
      el.style.maxHeight = el.scrollHeight + 'px';
    });
  }, 250));
}

/* ─── UTILITY ─── */

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
