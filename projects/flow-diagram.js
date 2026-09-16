// Hand-built interactive SVG rendering of a simplified monthly usage graph:
// Start -> View 1 -> Report 1 -> Action 1 -> (branches) -> End

(function () {
  const mount = document.getElementById('flow-diagram-mount');
  if (!mount) return;

  const nodes = [
    { id: 'start', x: 40, y: 180, label: 'Start', type: 'Start', desc: 'The first event of the day for this user.' },
    { id: 'view1', x: 190, y: 180, label: 'View 1', type: 'View', desc: 'A saved combination of metrics and categories the user opened.' },
    { id: 'report1', x: 340, y: 180, label: 'Report 1', type: 'Report', desc: 'A specific chart or table inside that view.' },
    { id: 'action1', x: 490, y: 180, label: 'Action 1', type: 'Action', desc: 'A trigger that runs a plugin or rule against the data in that report.', members: { Item: { 'SKU A': 2, 'SKU B': 300 }, Location: { 'Loc X': 2, 'Loc Y': 300 } } },
    { id: 'view2', x: 640, y: 90, label: 'View 2', type: 'View', desc: 'A second view opened after the first action completed.' },
    { id: 'report2', x: 790, y: 90, label: 'Report 2', type: 'Report', desc: 'The report reviewed inside View 2.' },
    { id: 'action2', x: 940, y: 90, label: 'Action 2', type: 'Action', desc: 'A second action fired against Report 2.', members: { Item: { 'SKU C': 5 }, Location: { 'Loc Z': 5 } } },
    { id: 'view3', x: 640, y: 270, label: 'View 3', type: 'View', desc: 'An alternate view some users open instead of View 2.' },
    { id: 'report3', x: 790, y: 270, label: 'Report 3', type: 'Report', desc: 'The report reviewed inside View 3.' },
    { id: 'action3', x: 940, y: 270, label: 'Action 3', type: 'Action', desc: 'A third action fired against Report 3.', members: { Item: { 'SKU D': 1 }, Location: { 'Loc W': 1 } } },
    { id: 'end', x: 1090, y: 180, label: 'End', type: 'End', desc: 'The last event of the day for this user.' },
  ];

  const edges = [
    { from: 'start', to: 'view1', freq: 24 },
    { from: 'view1', to: 'report1', freq: 24 },
    { from: 'report1', to: 'action1', freq: 22 },
    { from: 'action1', to: 'view2', freq: 14 },
    { from: 'view2', to: 'report2', freq: 14 },
    { from: 'report2', to: 'action2', freq: 12 },
    { from: 'action2', to: 'end', freq: 12 },
    { from: 'action1', to: 'view3', freq: 8 },
    { from: 'view3', to: 'report3', freq: 8 },
    { from: 'report3', to: 'action3', freq: 7 },
    { from: 'action3', to: 'end', freq: 7 },
  ];

  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1140 360');
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.display = 'block';
  svg.style.background = 'var(--paper-2)';

  const tooltip = document.createElement('div');
  tooltip.style.cssText = 'position:fixed;pointer-events:none;background:var(--ink);color:var(--paper);font-family:var(--sans);font-size:12.5px;line-height:1.4;padding:8px 12px;border-radius:6px;max-width:220px;opacity:0;transition:opacity .12s ease;z-index:50;';
  document.body.appendChild(tooltip);

  function showTip(evt, text) {
    tooltip.textContent = text;
    tooltip.style.left = (evt.clientX + 14) + 'px';
    tooltip.style.top = (evt.clientY + 14) + 'px';
    tooltip.style.opacity = '1';
  }
  function hideTip() { tooltip.style.opacity = '0'; }

  // edges first (so nodes draw on top)
  edges.forEach(e => {
    const a = byId[e.from], b = byId[e.to];
    const path = document.createElementNS(NS, 'path');
    const midX = (a.x + b.x) / 2;
    const d = `M ${a.x + 45} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x - 45} ${b.y}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--line-strong)');
    path.setAttribute('stroke-width', Math.max(1.5, Math.min(6, e.freq / 5)));
    path.style.cursor = 'pointer';
    path.addEventListener('mouseenter', (evt) => {
      path.setAttribute('stroke', 'var(--accent-dark)');
      showTip(evt, `Ran ${e.freq}× this month`);
    });
    path.addEventListener('mousemove', (evt) => showTip(evt, `Ran ${e.freq}× this month`));
    path.addEventListener('mouseleave', () => {
      path.setAttribute('stroke', 'var(--line-strong)');
      hideTip();
    });
    svg.appendChild(path);
  });

  const colors = { Start: 'var(--muted)', End: 'var(--muted)', View: 'var(--ink)', Report: 'var(--accent-dark)', Action: 'var(--ink)' };

  nodes.forEach(n => {
    const g = document.createElementNS(NS, 'g');
    g.style.cursor = 'pointer';

    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', n.x - 45);
    rect.setAttribute('y', n.y - 20);
    rect.setAttribute('width', 90);
    rect.setAttribute('height', 40);
    rect.setAttribute('rx', 8);
    rect.setAttribute('fill', n.type === 'Action' ? 'var(--ink)' : 'var(--paper)');
    rect.setAttribute('stroke', n.type === 'Report' ? 'var(--accent-dark)' : 'var(--line-strong)');
    rect.setAttribute('stroke-width', 1.5);
    g.appendChild(rect);

    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', n.x);
    text.setAttribute('y', n.y + 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-family', 'var(--mono)');
    text.setAttribute('font-size', '12');
    text.setAttribute('fill', n.type === 'Action' ? 'var(--paper)' : 'var(--ink)');
    text.textContent = n.label;
    g.appendChild(text);

    g.addEventListener('mouseenter', (evt) => showTip(evt, n.desc));
    g.addEventListener('mousemove', (evt) => showTip(evt, n.desc));
    g.addEventListener('mouseleave', hideTip);

    if (n.members) {
      g.addEventListener('click', () => toggleMemberPanel(n));
    }

    svg.appendChild(g);
  });

  mount.appendChild(svg);

  const caption = document.createElement('p');
  caption.className = 'doc-figure-caption';
  caption.style.marginTop = '2px';
  caption.textContent = 'Hover a node or edge for detail. Click an Action node to see the data it ran against.';
  mount.appendChild(caption);

  const panel = document.createElement('div');
  panel.style.cssText = 'display:none;margin-top:16px;border:1px solid var(--line-strong);border-radius:8px;padding:20px;';
  mount.appendChild(panel);

  function toggleMemberPanel(n) {
    if (panel.dataset.current === n.id && panel.style.display !== 'none') {
      panel.style.display = 'none';
      panel.dataset.current = '';
      return;
    }
    panel.dataset.current = n.id;
    panel.innerHTML = '';
    const title = document.createElement('h4');
    title.style.cssText = 'font-size:14px;margin-bottom:12px;';
    title.textContent = n.label + ': what it ran against this month';
    panel.appendChild(title);
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;';
    Object.entries(n.members).forEach(([dim, vals]) => {
      const col = document.createElement('div');
      const h = document.createElement('div');
      h.style.cssText = 'font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);margin-bottom:6px;';
      h.textContent = dim;
      col.appendChild(h);
      Object.entries(vals).forEach(([member, count]) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;font-size:13.5px;padding:4px 0;border-top:1px solid var(--line);';
        row.innerHTML = `<span>${member}</span><span style="font-family:var(--mono);color:var(--accent-dark)">${count}&times;</span>`;
        col.appendChild(row);
      });
      grid.appendChild(col);
    });
    panel.appendChild(grid);
    panel.style.display = 'block';
  }
})();
