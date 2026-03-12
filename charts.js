/* ============================================
   CMO DB — Chart Visualizations (D3.js)
   ============================================ */

const Charts = (() => {
  // ── Shared constants ──
  const COLORS = {
    accent: '#4a9eff',
    air: '#4a9eff',
    surface: '#4caf50',
    land: '#c6893a',
    sub: '#9c27b0',
    radar: '#4a9eff',
    esm: '#ffc107',
    sonar: '#00bcd4',
    eo: '#ff9800',
    visual: '#8bc34a',
    ir: '#f44336',
    grid: 'rgba(255,255,255,0.08)',
    text: 'rgba(255,255,255,0.7)',
    textBright: 'rgba(255,255,255,0.95)',
  };

  function d3Ready() {
    return typeof d3 !== 'undefined';
  }

  // Shared tooltip singleton
  let _tooltip = null;
  function getTooltip() {
    if (!_tooltip) {
      _tooltip = document.createElement('div');
      _tooltip.className = 'chart-tooltip';
      document.body.appendChild(_tooltip);
    }
    return _tooltip;
  }

  function showTooltip(evt, html) {
    const tip = getTooltip();
    tip.innerHTML = html;
    tip.style.display = 'block';
    tip.style.left = (evt.pageX + 12) + 'px';
    tip.style.top = (evt.pageY - 12) + 'px';
  }

  function hideTooltip() {
    const tip = getTooltip();
    tip.style.display = 'none';
  }

  // ── Escape HTML ──
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // ══════════════════════════════════════════
  //  Per-Item Charts
  // ══════════════════════════════════════════

  function renderRadarChart(container, item, cat, allItems) {
    if (!d3Ready()) return;
    container.innerHTML = '';

    let axes;
    if (cat === 'aircraft') {
      axes = [
        { key: 'maxSpeed', label: 'Speed' },
        { key: 'agility', label: 'Agility' },
        { key: 'climbRate', label: 'Climb' },
        { key: 'maxPayload', label: 'Payload' },
        { key: 'maxWeight', label: 'Max Weight' },
      ];
    } else if (cat === 'ships') {
      axes = [
        { key: 'maxSpeed', label: 'Speed' },
        { key: 'displacementFull', label: 'Displacement' },
        { key: 'beam', label: 'Beam' },
        { key: 'draft', label: 'Draft' },
        { key: 'sensorCount', label: 'Sensors' },
        { key: 'weaponCount', label: 'Weapons' },
      ];
    } else return;

    // Normalize 0-1 against max in allItems
    const maxVals = {};
    axes.forEach(a => {
      maxVals[a.key] = Math.max(...allItems.map(i => parseFloat(i[a.key]) || 0), 1);
    });

    const values = axes.map(a => ({
      label: a.label,
      value: (parseFloat(item[a.key]) || 0) / maxVals[a.key],
      raw: parseFloat(item[a.key]) || 0,
    }));

    const W = 300, H = 300, cx = W / 2, cy = H / 2, R = 110;
    const n = values.length;
    const angleSlice = (2 * Math.PI) / n;

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

    // Grid circles
    [0.25, 0.5, 0.75, 1].forEach(level => {
      g.append('circle')
        .attr('r', R * level)
        .attr('fill', 'none')
        .attr('stroke', COLORS.grid)
        .attr('stroke-width', 1);
    });

    // Axis lines + labels
    values.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = R * Math.cos(angle);
      const y = R * Math.sin(angle);
      g.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', x).attr('y2', y)
        .attr('stroke', COLORS.grid).attr('stroke-width', 1);
      g.append('text')
        .attr('x', (R + 18) * Math.cos(angle))
        .attr('y', (R + 18) * Math.sin(angle))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', COLORS.text)
        .attr('font-size', '10px')
        .text(d.label);
    });

    // Data polygon
    const points = values.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return [R * d.value * Math.cos(angle), R * d.value * Math.sin(angle)];
    });

    g.append('polygon')
      .attr('points', points.map(p => p.join(',')).join(' '))
      .attr('fill', COLORS.accent)
      .attr('fill-opacity', 0.25)
      .attr('stroke', COLORS.accent)
      .attr('stroke-width', 2);

    // Data dots with tooltip
    values.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = R * d.value * Math.cos(angle);
      const y = R * d.value * Math.sin(angle);
      g.append('circle')
        .attr('cx', x).attr('cy', y).attr('r', 4)
        .attr('fill', COLORS.accent)
        .attr('stroke', '#fff').attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(d.label)}</b><br>${d.raw.toLocaleString()}`))
        .on('mouseout', hideTooltip);
    });
  }

  function renderRangeRings(container, item) {
    if (!d3Ready()) return;
    container.innerHTML = '';

    const domains = [
      { key: 'airRange', minKey: 'airRangeMin', label: 'Air', color: COLORS.air },
      { key: 'surfaceRange', minKey: 'surfaceRangeMin', label: 'Surface', color: COLORS.surface },
      { key: 'landRange', minKey: 'landRangeMin', label: 'Land', color: COLORS.land },
      { key: 'subRange', minKey: 'subRangeMin', label: 'Sub', color: COLORS.sub },
    ].filter(d => item[d.key]);

    if (domains.length === 0) return;

    const maxRange = Math.max(...domains.map(d => item[d.key]));
    const W = 400, H = 220, cx = W / 2, cy = H - 20;
    const maxR = 160;
    const scale = d3.scaleLinear().domain([0, maxRange]).range([0, maxR]);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

    // Grid arcs
    const gridSteps = 4;
    for (let i = 1; i <= gridSteps; i++) {
      const r = maxR * (i / gridSteps);
      const rangeVal = Math.round(maxRange * (i / gridSteps));
      g.append('path')
        .attr('d', d3.arc()({ innerRadius: r - 0.5, outerRadius: r, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 }))
        .attr('fill', COLORS.grid);
      g.append('text')
        .attr('x', r + 4).attr('y', 4)
        .attr('fill', COLORS.text).attr('font-size', '9px')
        .text(rangeVal + ' km');
    }

    // Domain arcs
    const bandWidth = Math.PI / (domains.length + 1);
    domains.forEach((dom, i) => {
      const startAngle = -Math.PI / 2 + bandWidth * i + bandWidth * 0.1;
      const endAngle = startAngle + bandWidth * 0.8;
      const outerR = scale(item[dom.key]);
      const innerR = item[dom.minKey] ? scale(item[dom.minKey]) : 0;

      g.append('path')
        .attr('d', d3.arc()({ innerRadius: innerR, outerRadius: outerR, startAngle, endAngle }))
        .attr('fill', dom.color)
        .attr('fill-opacity', 0.5)
        .attr('stroke', dom.color)
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => {
          const minR = item[dom.minKey] || 0;
          showTooltip(evt, `<b>${esc(dom.label)}</b><br>Range: ${minR}\u2013${item[dom.key]} km`);
        })
        .on('mouseout', hideTooltip);

      // Label
      const midAngle = (startAngle + endAngle) / 2;
      const labelR = outerR + 12;
      g.append('text')
        .attr('x', labelR * Math.sin(midAngle))
        .attr('y', -labelR * Math.cos(midAngle))
        .attr('text-anchor', 'middle')
        .attr('fill', dom.color)
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(dom.label);
    });

    // Origin dot
    g.append('circle').attr('r', 3).attr('fill', COLORS.textBright);
  }

  function renderSensorBars(container, item) {
    if (!d3Ready() || !item.sensors || item.sensors.length === 0) return;
    container.innerHTML = '';

    const sensors = item.sensors.filter(s => s.rangeMax > 0);
    if (sensors.length === 0) return;

    const typeColor = (type) => {
      const t = (type || '').toLowerCase();
      if (t.includes('radar')) return COLORS.radar;
      if (t.includes('esm') || t.includes('ecm') || t.includes('rwr')) return COLORS.esm;
      if (t.includes('sonar')) return COLORS.sonar;
      if (t.includes('eo') || t.includes('visual') || t.includes('ir') || t.includes('tv')) return COLORS.eo;
      return COLORS.text;
    };

    const maxRange = Math.max(...sensors.map(s => s.rangeMax));
    const barH = 22, gap = 4, labelW = 140, pad = 8;
    const W = 500;
    const H = pad * 2 + sensors.length * (barH + gap);
    const barW = W - labelW - pad * 2;
    const scale = d3.scaleLinear().domain([0, maxRange]).range([0, barW]);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    sensors.forEach((s, i) => {
      const y = pad + i * (barH + gap);
      const color = typeColor(s.type);
      const w = scale(s.rangeMax);

      // Label
      svg.append('text')
        .attr('x', labelW - 4).attr('y', y + barH / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .attr('fill', COLORS.text)
        .attr('font-size', '10px')
        .text(s.name.length > 20 ? s.name.substring(0, 18) + '...' : s.name);

      // Bar background
      svg.append('rect')
        .attr('x', labelW).attr('y', y)
        .attr('width', barW).attr('height', barH)
        .attr('fill', COLORS.grid).attr('rx', 3);

      // Bar fill
      svg.append('rect')
        .attr('x', labelW).attr('y', y)
        .attr('width', w).attr('height', barH)
        .attr('fill', color).attr('fill-opacity', 0.6)
        .attr('rx', 3)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(s.name)}</b><br>${esc(s.role || s.type)}<br>Range: ${s.rangeMax} km`))
        .on('mouseout', hideTooltip);

      // Range label
      svg.append('text')
        .attr('x', labelW + w + 4).attr('y', y + barH / 2)
        .attr('dominant-baseline', 'central')
        .attr('fill', COLORS.textBright)
        .attr('font-size', '9px')
        .text(s.rangeMax + ' km');
    });
  }

  function renderSignaturePolar(container, item) {
    if (!d3Ready() || !item.signatures || item.signatures.length === 0) return;
    container.innerHTML = '';

    // Group signatures by detection method
    const groups = {
      'Visual': { det: null, cls: null, color: COLORS.visual },
      'Infrared': { det: null, cls: null, color: COLORS.ir },
      'Radar E-M': { det: null, cls: null, color: COLORS.radar },
    };

    item.signatures.forEach(s => {
      const t = s.type || '';
      if (t.includes('Visual') && t.includes('Detection')) groups['Visual'].det = s;
      else if (t.includes('Visual') && t.includes('Classification')) groups['Visual'].cls = s;
      else if (t.includes('Infrared') && t.includes('Detection')) groups['Infrared'].det = s;
      else if (t.includes('Infrared') && t.includes('Classification')) groups['Infrared'].cls = s;
      else if (t.includes('E-M') || (t.includes('Radar') && !t.includes('A-D'))) groups['Radar E-M'].det = s;
    });

    const dirs = ['front', 'side', 'rear', 'top'];
    const dirAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
    const dirLabels = ['Front', 'Side', 'Rear', 'Top'];

    // Find global max for scale
    let globalMax = 0;
    Object.values(groups).forEach(grp => {
      if (grp.det) dirs.forEach(d => { globalMax = Math.max(globalMax, grp.det[d] || 0); });
    });
    if (globalMax === 0) return;

    const W = 320, H = 320, cx = W / 2, cy = H / 2, R = 110;

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);

    // Grid circles
    [0.25, 0.5, 0.75, 1].forEach(level => {
      g.append('circle')
        .attr('r', R * level)
        .attr('fill', 'none').attr('stroke', COLORS.grid).attr('stroke-width', 1);
    });

    // Direction labels
    dirLabels.forEach((label, i) => {
      const angle = dirAngles[i] - Math.PI / 2;
      g.append('text')
        .attr('x', (R + 16) * Math.cos(angle))
        .attr('y', (R + 16) * Math.sin(angle))
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .attr('fill', COLORS.text).attr('font-size', '10px')
        .text(label);
    });

    // Signature polygons (detection only — cleaner)
    Object.entries(groups).forEach(([name, grp]) => {
      if (!grp.det) return;
      const pts = dirs.map((d, i) => {
        const val = (grp.det[d] || 0) / globalMax;
        const angle = dirAngles[i] - Math.PI / 2;
        return [R * val * Math.cos(angle), R * val * Math.sin(angle)];
      });

      g.append('polygon')
        .attr('points', pts.map(p => p.join(',')).join(' '))
        .attr('fill', grp.color).attr('fill-opacity', 0.15)
        .attr('stroke', grp.color).attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => {
          const vals = dirs.map(d => `${d}: ${grp.det[d]} km`).join('<br>');
          showTooltip(evt, `<b>${esc(name)} Detection</b><br>${vals}`);
        })
        .on('mouseout', hideTooltip);
    });

    // Legend
    const legend = d3.select(container).append('div').attr('class', 'chart-legend');
    Object.entries(groups).forEach(([name, grp]) => {
      if (!grp.det) return;
      const el = legend.append('span').attr('class', 'chart-legend-item');
      el.append('span').attr('class', 'chart-legend-dot').style('background', grp.color);
      el.append('span').text(name);
    });
  }

  function renderPerfCurves(container, item) {
    if (!d3Ready()) return;
    const perf = item.propulsion?.performances;
    if (!perf || perf.length === 0) return;
    container.innerHTML = '';

    const isAircraft = perf[0].altBand != null;

    if (isAircraft) {
      // Group by altitude band
      const bands = {};
      perf.forEach(p => {
        const b = p.altBand || 1;
        if (!bands[b]) bands[b] = [];
        bands[b].push(p);
      });
      const bandKeys = Object.keys(bands).sort((a, b) => a - b);
      const bandColors = ['#4a9eff', '#ffc107', '#f44336', '#4caf50'];

      const allSpeeds = perf.map(p => p.speed);
      const allConsumption = perf.map(p => p.consumption);

      const W = 420, H = 240, pad = { top: 20, right: 20, bottom: 35, left: 50 };
      const plotW = W - pad.left - pad.right;
      const plotH = H - pad.top - pad.bottom;

      const xScale = d3.scaleLinear().domain([0, Math.max(...allSpeeds) * 1.05]).range([0, plotW]);
      const yScale = d3.scaleLinear().domain([0, Math.max(...allConsumption) * 1.1]).range([plotH, 0]);

      const svg = d3.select(container).append('svg')
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const gEl = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

      // Grid
      const yTicks = yScale.ticks(5);
      yTicks.forEach(t => {
        gEl.append('line')
          .attr('x1', 0).attr('x2', plotW)
          .attr('y1', yScale(t)).attr('y2', yScale(t))
          .attr('stroke', COLORS.grid);
        gEl.append('text')
          .attr('x', -6).attr('y', yScale(t))
          .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
          .attr('fill', COLORS.text).attr('font-size', '9px')
          .text(t);
      });

      // X axis label
      svg.append('text')
        .attr('x', W / 2).attr('y', H - 4)
        .attr('text-anchor', 'middle')
        .attr('fill', COLORS.text).attr('font-size', '10px')
        .text('Speed (kt)');

      // Y axis label
      svg.append('text')
        .attr('transform', `translate(12,${H / 2}) rotate(-90)`)
        .attr('text-anchor', 'middle')
        .attr('fill', COLORS.text).attr('font-size', '10px')
        .text('Fuel (kg/hr)');

      // Lines per altitude band
      const line = d3.line()
        .x(d => xScale(d.speed))
        .y(d => yScale(d.consumption))
        .curve(d3.curveMonotoneX);

      bandKeys.forEach((bk, i) => {
        const data = bands[bk].sort((a, b) => a.speed - b.speed);
        const color = bandColors[i % bandColors.length];
        const altLabel = data[0].altMin != null
          ? `${Math.round(data[0].altMin)}\u2013${Math.round(data[0].altMax)} m`
          : `Band ${bk}`;

        gEl.append('path')
          .datum(data)
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2);

        // Dots
        data.forEach(p => {
          gEl.append('circle')
            .attr('cx', xScale(p.speed)).attr('cy', yScale(p.consumption))
            .attr('r', 3).attr('fill', color)
            .style('cursor', 'pointer')
            .on('mouseover', (evt) => showTooltip(evt, `<b>${altLabel}</b><br>Speed: ${p.speed} kt<br>Fuel: ${p.consumption} kg/hr`))
            .on('mouseout', hideTooltip);
        });
      });

      // Legend
      const legend = d3.select(container).append('div').attr('class', 'chart-legend');
      bandKeys.forEach((bk, i) => {
        const data = bands[bk];
        const altLabel = data[0].altMin != null
          ? `${Math.round(data[0].altMin)}\u2013${Math.round(data[0].altMax)} m`
          : `Band ${bk}`;
        const el = legend.append('span').attr('class', 'chart-legend-item');
        el.append('span').attr('class', 'chart-legend-dot').style('background', bandColors[i % bandColors.length]);
        el.append('span').text(altLabel);
      });

    } else {
      // Ship: simple speed vs consumption
      const data = perf.sort((a, b) => a.speed - b.speed);
      const W = 420, H = 200, pad = { top: 20, right: 20, bottom: 35, left: 50 };
      const plotW = W - pad.left - pad.right;
      const plotH = H - pad.top - pad.bottom;

      const xScale = d3.scaleLinear().domain([0, Math.max(...data.map(d => d.speed)) * 1.05]).range([0, plotW]);
      const yScale = d3.scaleLinear().domain([0, Math.max(...data.map(d => d.consumption)) * 1.1]).range([plotH, 0]);

      const svg = d3.select(container).append('svg')
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const gEl = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

      // Grid
      yScale.ticks(4).forEach(t => {
        gEl.append('line').attr('x1', 0).attr('x2', plotW).attr('y1', yScale(t)).attr('y2', yScale(t)).attr('stroke', COLORS.grid);
        gEl.append('text').attr('x', -6).attr('y', yScale(t)).attr('text-anchor', 'end').attr('dominant-baseline', 'central').attr('fill', COLORS.text).attr('font-size', '9px').text(t);
      });

      svg.append('text').attr('x', W / 2).attr('y', H - 4).attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '10px').text('Speed (kt)');
      svg.append('text').attr('transform', `translate(12,${H / 2}) rotate(-90)`).attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '10px').text('Fuel (kg/hr)');

      const line = d3.line().x(d => xScale(d.speed)).y(d => yScale(d.consumption)).curve(d3.curveMonotoneX);
      gEl.append('path').datum(data).attr('d', line).attr('fill', 'none').attr('stroke', COLORS.accent).attr('stroke-width', 2);

      data.forEach(p => {
        gEl.append('circle')
          .attr('cx', xScale(p.speed)).attr('cy', yScale(p.consumption))
          .attr('r', 4).attr('fill', COLORS.accent)
          .style('cursor', 'pointer')
          .on('mouseover', (evt) => showTooltip(evt, `Speed: ${p.speed} kt<br>Fuel: ${p.consumption} kg/hr`))
          .on('mouseout', hideTooltip);
      });
    }
  }

  function renderLoadoutAnalysis(container, item) {
    if (!d3Ready() || !item.loadouts || item.loadouts.length === 0) return;
    container.innerHTML = '';

    // Dropdown
    const select = document.createElement('select');
    select.className = 'filter-select';
    select.style.marginBottom = '8px';
    select.style.maxWidth = '100%';
    item.loadouts.forEach((lo, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = lo.name.length > 70 ? lo.name.substring(0, 68) + '...' : lo.name;
      select.appendChild(opt);
    });
    container.appendChild(select);

    const chartDiv = document.createElement('div');
    container.appendChild(chartDiv);

    function renderLoadout(idx) {
      chartDiv.innerHTML = '';
      const lo = item.loadouts[idx];
      if (!lo || !lo.weapons || lo.weapons.length === 0) {
        chartDiv.innerHTML = '<div style="color:var(--text-secondary);font-size:12px;padding:8px">No weapon data for this loadout</div>';
        return;
      }

      const weapons = lo.weapons.filter(w => w.weight > 0);
      if (weapons.length === 0) return;

      const maxWeight = Math.max(...weapons.map(w => w.weight * (w.qty || 1)));
      const barH = 22, gap = 4, labelW = 140, pad = 8;
      const W = 500;
      const H = pad * 2 + weapons.length * (barH + gap);
      const barW = W - labelW - pad * 2;
      const wScale = d3.scaleLinear().domain([0, maxWeight]).range([0, barW]);

      const svg = d3.select(chartDiv).append('svg')
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      weapons.forEach((w, i) => {
        const y = pad + i * (barH + gap);
        const totalW = w.weight * (w.qty || 1);
        const barLen = wScale(totalW);
        const color = w.type === 'Guided Weapon' ? COLORS.air
          : w.type === 'Gun' ? COLORS.land
          : w.type === 'Torpedo' ? COLORS.sub
          : COLORS.surface;

        svg.append('text')
          .attr('x', labelW - 4).attr('y', y + barH / 2)
          .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
          .attr('fill', COLORS.text).attr('font-size', '10px')
          .text(w.name.length > 20 ? w.name.substring(0, 18) + '...' : w.name);

        svg.append('rect')
          .attr('x', labelW).attr('y', y)
          .attr('width', barW).attr('height', barH)
          .attr('fill', COLORS.grid).attr('rx', 3);

        svg.append('rect')
          .attr('x', labelW).attr('y', y)
          .attr('width', barLen).attr('height', barH)
          .attr('fill', color).attr('fill-opacity', 0.6).attr('rx', 3)
          .style('cursor', 'pointer')
          .on('mouseover', (evt) => {
            const ranges = [w.airRange ? `Air: ${w.airRange} km` : '', w.surfaceRange ? `Surface: ${w.surfaceRange} km` : '', w.landRange ? `Land: ${w.landRange} km` : '', w.subRange ? `Sub: ${w.subRange} km` : ''].filter(Boolean).join('<br>');
            showTooltip(evt, `<b>${esc(w.name)}</b><br>Qty: ${w.qty || 1} x ${w.weight} kg = ${totalW} kg<br>${ranges || 'No range data'}`);
          })
          .on('mouseout', hideTooltip);

        svg.append('text')
          .attr('x', labelW + barLen + 4).attr('y', y + barH / 2)
          .attr('dominant-baseline', 'central')
          .attr('fill', COLORS.textBright).attr('font-size', '9px')
          .text(`${w.qty || 1}x ${w.weight} kg`);
      });
    }

    renderLoadout(0);
    select.addEventListener('change', () => renderLoadout(parseInt(select.value)));
  }

  // ══════════════════════════════════════════
  //  Aggregate Charts (Analytics Tab)
  // ══════════════════════════════════════════

  function renderDonut(container, data, cat) {
    if (!d3Ready()) return;
    container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Force Composition</div>';

    // Count by type (or name prefix for ground units)
    const counts = {};
    data.forEach(item => {
      let group = item.type || 'Unknown';
      if (['infantry', 'armor', 'artillery', 'airdefense', 'radar'].includes(cat)) {
        if (item.name.startsWith('SAM')) group = 'SAM';
        else if (item.name.startsWith('AAA')) group = 'AAA';
        else if (item.name.startsWith('SSM')) group = 'SSM';
        else if (item.name.startsWith('Armored')) group = 'Armored';
        else if (item.name.startsWith('Mech Inf')) group = 'Mech Infantry';
        else if (item.name.startsWith('Inf')) group = 'Infantry';
        else if (item.name.startsWith('Arty') && item.name.includes('MLRS')) group = 'MLRS';
        else if (item.name.startsWith('Arty') && item.name.includes('Howitzer')) group = 'Howitzer';
        else if (item.name.startsWith('Mortar')) group = 'Mortar';
        else if (item.name.startsWith('Radar')) group = 'Radar';
        else if (item.name.startsWith('Vehicle')) group = 'EW Vehicle';
        else if (item.name.startsWith('Sensor')) group = 'Sensor';
      }
      counts[group] = (counts[group] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const W = 280, H = 240, cx = W / 2, cy = H / 2 - 10, outerR = 90, innerR = 50;

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const gEl = svg.append('g').attr('transform', `translate(${cx},${cy})`);

    const pie = d3.pie().value(d => d[1]).sort(null);
    const arc = d3.arc().innerRadius(innerR).outerRadius(outerR);

    gEl.selectAll('path')
      .data(pie(entries))
      .join('path')
      .attr('d', arc)
      .attr('fill', (d, i) => colorScale(i))
      .attr('stroke', 'var(--bg-primary)')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (evt, d) => showTooltip(evt, `<b>${esc(d.data[0])}</b><br>${d.data[1]} items (${Math.round(d.data[1] / data.length * 100)}%)`))
      .on('mouseout', hideTooltip);

    // Center label
    gEl.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', COLORS.textBright).attr('font-size', '22px').attr('font-weight', 'bold')
      .text(data.length);
    gEl.append('text')
      .attr('text-anchor', 'middle').attr('y', 18)
      .attr('fill', COLORS.text).attr('font-size', '10px')
      .text('total');

    // Legend (top 8)
    const legend = d3.select(container).append('div').attr('class', 'chart-legend');
    entries.slice(0, 8).forEach(([name, count], i) => {
      const el = legend.append('span').attr('class', 'chart-legend-item');
      el.append('span').attr('class', 'chart-legend-dot').style('background', colorScale(i));
      el.append('span').text(`${name} (${count})`);
    });
    if (entries.length > 8) {
      legend.append('span').attr('class', 'chart-legend-item').text(`+${entries.length - 8} more`);
    }
  }

  function renderScatter(container, data, cat) {
    if (!d3Ready()) return;
    container.innerHTML = '';

    const axes = {
      aircraft: { x: 'maxSpeed', xLabel: 'Max Speed (kt)', y: 'maxWeight', yLabel: 'Max Weight (kg)' },
      ships: { x: 'maxSpeed', xLabel: 'Max Speed (kt)', y: 'displacementFull', yLabel: 'Displacement (t)' },
      weapons: { x: 'maxRange', xLabel: 'Max Range (km)', y: 'weight', yLabel: 'Weight (kg)' },
      sensors: { x: 'rangeMax', xLabel: 'Max Range (km)', y: 'rangeMin', yLabel: 'Min Range (km)' },
    };
    const cfg = axes[cat] || { x: 'sensorCount', xLabel: 'Sensors', y: 'weaponCount', yLabel: 'Weapons' };

    const filtered = data.filter(d => d[cfg.x] > 0 || d[cfg.y] > 0);
    if (filtered.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary)">No plottable data</div>';
      return;
    }

    container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Scatter Plot</div>';

    const types = [...new Set(filtered.map(d => d.type || 'Unknown'))];
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const W = 500, H = 320, pad = { top: 20, right: 20, bottom: 40, left: 60 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d[cfg.x]) * 1.05])
      .range([0, plotW]);
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d[cfg.y]) * 1.05])
      .range([plotH, 0]);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const gEl = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    // Grid
    xScale.ticks(6).forEach(t => {
      gEl.append('line').attr('x1', xScale(t)).attr('x2', xScale(t)).attr('y1', 0).attr('y2', plotH).attr('stroke', COLORS.grid);
    });
    yScale.ticks(6).forEach(t => {
      gEl.append('line').attr('x1', 0).attr('x2', plotW).attr('y1', yScale(t)).attr('y2', yScale(t)).attr('stroke', COLORS.grid);
      gEl.append('text').attr('x', -6).attr('y', yScale(t)).attr('text-anchor', 'end').attr('dominant-baseline', 'central').attr('fill', COLORS.text).attr('font-size', '9px').text(t.toLocaleString());
    });

    // Axis labels
    svg.append('text').attr('x', W / 2).attr('y', H - 4).attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '10px').text(cfg.xLabel);
    svg.append('text').attr('transform', `translate(12,${H / 2}) rotate(-90)`).attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '10px').text(cfg.yLabel);

    // Dots
    filtered.forEach(item => {
      const x = xScale(item[cfg.x] || 0);
      const y = yScale(item[cfg.y] || 0);
      const typeIdx = types.indexOf(item.type || 'Unknown');

      gEl.append('circle')
        .attr('cx', x).attr('cy', y).attr('r', 4)
        .attr('fill', colorScale(typeIdx))
        .attr('fill-opacity', 0.7)
        .attr('stroke', colorScale(typeIdx))
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(item.name)}</b><br>${esc(item.type || '')}<br>${cfg.xLabel}: ${(item[cfg.x] || 0).toLocaleString()}<br>${cfg.yLabel}: ${(item[cfg.y] || 0).toLocaleString()}`))
        .on('mouseout', hideTooltip);
    });
  }

  function renderTimeline(container, data, cat) {
    if (!d3Ready()) return;
    container.innerHTML = '';

    const yearField = cat === 'weapons' ? null : 'commissioned';
    const withYear = yearField ? data.filter(d => d[yearField] > 1900) : [];
    if (withYear.length === 0) {
      container.innerHTML = '<div style="padding:40px;color:var(--text-secondary);font-size:12px">No timeline data for this category</div>';
      return;
    }

    container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Commissioning Timeline</div>';

    const types = [...new Set(withYear.map(d => d.type || 'Unknown'))];
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const years = withYear.map(d => d[yearField]);
    const minY = Math.min(...years);
    const maxY = Math.max(...years);

    const W = 700, H = 200, pad = { top: 20, right: 20, bottom: 30, left: 40 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const xScale = d3.scaleLinear().domain([minY - 1, maxY + 1]).range([0, plotW]);

    const yearCounts = {};

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const gEl = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    // X axis ticks
    const step = maxY - minY > 40 ? 10 : maxY - minY > 20 ? 5 : 2;
    for (let yr = Math.ceil(minY / step) * step; yr <= maxY; yr += step) {
      gEl.append('line').attr('x1', xScale(yr)).attr('x2', xScale(yr)).attr('y1', 0).attr('y2', plotH).attr('stroke', COLORS.grid);
      gEl.append('text').attr('x', xScale(yr)).attr('y', plotH + 14).attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '9px').text(yr);
    }

    // Dots
    withYear.forEach(item => {
      const yr = item[yearField];
      if (!yearCounts[yr]) yearCounts[yr] = 0;
      const stack = yearCounts[yr]++;
      const x = xScale(yr);
      const y = plotH - 8 - stack * 7;
      const typeIdx = types.indexOf(item.type || 'Unknown');

      gEl.append('circle')
        .attr('cx', x).attr('cy', Math.max(4, y)).attr('r', 3.5)
        .attr('fill', colorScale(typeIdx))
        .attr('fill-opacity', 0.8)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(item.name)}</b><br>${esc(item.type || '')}<br>Commissioned: ${yr}`))
        .on('mouseout', hideTooltip);
    });
  }

  function renderDomainHeatmap(container, data) {
    if (!d3Ready()) return;
    container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Weapon Domain Coverage</div>';

    const domains = ['airRange', 'surfaceRange', 'landRange', 'subRange'];
    const domainLabels = ['Air', 'Surface', 'Land', 'Sub'];
    const domainColors = [COLORS.air, COLORS.surface, COLORS.land, COLORS.sub];

    const counts = domains.map(d => data.filter(item => item[d]).length);
    const maxCount = Math.max(...counts, 1);

    const W = 260, H = 180, pad = 20, barH = 28, gap = 8;

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const barW = W - pad * 2 - 60;
    const scale = d3.scaleLinear().domain([0, maxCount]).range([0, barW]);

    domains.forEach((dom, i) => {
      const y = pad + i * (barH + gap);

      svg.append('text')
        .attr('x', 50).attr('y', y + barH / 2)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
        .attr('fill', COLORS.text).attr('font-size', '11px')
        .text(domainLabels[i]);

      svg.append('rect')
        .attr('x', 60).attr('y', y)
        .attr('width', barW).attr('height', barH)
        .attr('fill', COLORS.grid).attr('rx', 4);

      svg.append('rect')
        .attr('x', 60).attr('y', y)
        .attr('width', scale(counts[i])).attr('height', barH)
        .attr('fill', domainColors[i]).attr('fill-opacity', 0.6).attr('rx', 4);

      svg.append('text')
        .attr('x', 60 + scale(counts[i]) + 6).attr('y', y + barH / 2)
        .attr('dominant-baseline', 'central')
        .attr('fill', COLORS.textBright).attr('font-size', '11px').attr('font-weight', 'bold')
        .text(counts[i]);
    });
  }

  // ══════════════════════════════════════════
  //  Additional Analytics Charts
  // ══════════════════════════════════════════

  function renderHistogram(container, data, cat) {
    if (!d3Ready()) return;
    container.innerHTML = '';

    // Pick field + bins based on category
    const cfgs = {
      aircraft: { field: 'maxSpeed', label: 'Max Speed (kt)', unit: 'kt',
        bins: [0, 100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000] },
      ships: { field: 'maxSpeed', label: 'Max Speed (kt)', unit: 'kt',
        bins: [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60] },
      weapons: { field: 'maxRange', label: 'Max Range (km)', unit: 'km',
        bins: [0, 5, 10, 25, 50, 100, 250, 500, 1000, 5000, 15000] },
      sensors: { field: 'rangeMax', label: 'Max Range (km)', unit: 'km',
        bins: [0, 10, 25, 50, 100, 200, 500, 1000, 5000, 50000] },
    };
    const cfg = cfgs[cat];
    if (!cfg) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No distribution data for this category</div>';
      return;
    }

    const vals = data.filter(d => d[cfg.field] > 0).map(d => d[cfg.field]);
    if (vals.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No data available</div>';
      return;
    }

    container.innerHTML = `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">${cfg.label} Distribution</div>`;

    // Build bins
    const bins = cfg.bins;
    const counts = [];
    for (let i = 1; i < bins.length; i++) {
      const count = vals.filter(v => v >= bins[i - 1] && v < bins[i]).length;
      counts.push({ label: `${bins[i - 1]}\u2013${bins[i]}`, count, lo: bins[i - 1], hi: bins[i] });
    }
    // Filter out empty bins from edges
    while (counts.length > 0 && counts[0].count === 0) counts.shift();
    while (counts.length > 0 && counts[counts.length - 1].count === 0) counts.pop();

    const maxCount = Math.max(...counts.map(c => c.count), 1);
    const W = 420, H = 220, pad = { top: 12, right: 12, bottom: 45, left: 40 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;
    const barW = plotW / counts.length - 2;

    const xScale = d3.scaleBand().domain(counts.map(c => c.label)).range([0, plotW]).padding(0.1);
    const yScale = d3.scaleLinear().domain([0, maxCount]).range([plotH, 0]);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const gEl = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    // Grid lines
    yScale.ticks(4).forEach(t => {
      gEl.append('line').attr('x1', 0).attr('x2', plotW).attr('y1', yScale(t)).attr('y2', yScale(t)).attr('stroke', COLORS.grid);
      gEl.append('text').attr('x', -6).attr('y', yScale(t)).attr('text-anchor', 'end').attr('dominant-baseline', 'central').attr('fill', COLORS.text).attr('font-size', '9px').text(t);
    });

    // Bars
    const gradient = d3.scaleLinear().domain([0, counts.length - 1]).range([COLORS.accent, '#8b5cf6']);
    counts.forEach((c, i) => {
      const x = xScale(c.label);
      const barH = plotH - yScale(c.count);
      const color = gradient(i);

      gEl.append('rect')
        .attr('x', x).attr('y', yScale(c.count))
        .attr('width', xScale.bandwidth()).attr('height', barH)
        .attr('fill', color).attr('fill-opacity', 0.7).attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => showTooltip(evt, `<b>${c.label} ${cfg.unit}</b><br>${c.count} items`))
        .on('mouseout', hideTooltip);

      // Count label on top
      if (c.count > 0) {
        gEl.append('text')
          .attr('x', x + xScale.bandwidth() / 2).attr('y', yScale(c.count) - 4)
          .attr('text-anchor', 'middle').attr('fill', COLORS.textBright).attr('font-size', '9px').attr('font-weight', 'bold')
          .text(c.count);
      }

      // X axis label
      gEl.append('text')
        .attr('x', x + xScale.bandwidth() / 2).attr('y', plotH + 10)
        .attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '7px')
        .attr('transform', `rotate(-30,${x + xScale.bandwidth() / 2},${plotH + 10})`)
        .text(c.label);
    });
  }

  function renderOperatorBreakdown(container, data, cat) {
    if (!d3Ready()) return;
    container.innerHTML = '';

    // Group by operator
    const counts = {};
    data.forEach(item => {
      const op = item.operator || 'Unknown';
      counts[op] = (counts[op] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0 || (entries.length === 1 && entries[0][0] === 'Unknown')) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No operator data for this category</div>';
      return;
    }

    container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Force by Branch</div>';

    const branchColors = {
      'Navy': '#3b82f6', 'Air Force': '#6366f1', 'Army': '#22c55e',
      'Marine Corps': '#ef4444', 'Marines': '#ef4444', 'Coast Guard': '#f59e0b',
      'Air National Guard': '#8b5cf6', 'Customs': '#64748b',
    };
    const colorScale = (op) => branchColors[op] || d3.scaleOrdinal(d3.schemeTableau10)(op);

    const maxCount = Math.max(...entries.map(e => e[1]));
    const barH = 26, gap = 6, labelW = 120, pad = 12;
    const W = 440;
    const H = pad * 2 + entries.length * (barH + gap);
    const barArea = W - labelW - pad * 2 - 40;
    const scale = d3.scaleLinear().domain([0, maxCount]).range([0, barArea]);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    entries.forEach(([op, count], i) => {
      const y = pad + i * (barH + gap);
      const color = colorScale(op);
      const w = scale(count);

      svg.append('text')
        .attr('x', labelW - 6).attr('y', y + barH / 2)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
        .attr('fill', COLORS.text).attr('font-size', '11px')
        .text(op.length > 18 ? op.substring(0, 16) + '...' : op);

      svg.append('rect')
        .attr('x', labelW).attr('y', y)
        .attr('width', barArea).attr('height', barH)
        .attr('fill', COLORS.grid).attr('rx', 4);

      svg.append('rect')
        .attr('x', labelW).attr('y', y)
        .attr('width', w).attr('height', barH)
        .attr('fill', color).attr('fill-opacity', 0.7).attr('rx', 4)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(op)}</b><br>${count} items (${Math.round(count / data.length * 100)}%)`))
        .on('mouseout', hideTooltip);

      svg.append('text')
        .attr('x', labelW + w + 6).attr('y', y + barH / 2)
        .attr('dominant-baseline', 'central')
        .attr('fill', COLORS.textBright).attr('font-size', '11px').attr('font-weight', 'bold')
        .text(count);
    });
  }

  function renderTopTen(container, data, cat) {
    if (!d3Ready()) return;
    container.innerHTML = '';

    // Pick ranking metric based on category
    const cfgs = {
      aircraft: { field: 'maxSpeed', label: 'Fastest Aircraft', unit: 'kt' },
      ships: { field: 'displacementFull', label: 'Largest Ships', unit: 't' },
      weapons: { field: 'maxRange', label: 'Longest Range Weapons', unit: 'km' },
      sensors: { field: 'rangeMax', label: 'Longest Range Sensors', unit: 'km' },
    };
    const cfg = cfgs[cat];
    if (!cfg) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No ranking data for this category</div>';
      return;
    }

    const ranked = data.filter(d => d[cfg.field] > 0)
      .sort((a, b) => b[cfg.field] - a[cfg.field])
      .slice(0, 10);

    if (ranked.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No data</div>';
      return;
    }

    container.innerHTML = `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">${cfg.label}</div>`;

    const maxVal = ranked[0][cfg.field];
    const barH = 22, gap = 4, labelW = 150, pad = 8;
    const W = 500;
    const H = pad * 2 + ranked.length * (barH + gap);
    const barArea = W - labelW - pad * 2 - 60;
    const scale = d3.scaleLinear().domain([0, maxVal]).range([0, barArea]);

    const goldToSilver = d3.scaleLinear().domain([0, ranked.length - 1]).range(['#fbbf24', '#64748b']);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    ranked.forEach((item, i) => {
      const y = pad + i * (barH + gap);
      const val = item[cfg.field];
      const w = scale(val);
      const color = goldToSilver(i);

      // Rank number
      svg.append('text')
        .attr('x', 16).attr('y', y + barH / 2)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .attr('fill', i < 3 ? '#fbbf24' : COLORS.text).attr('font-size', '11px').attr('font-weight', 'bold')
        .text(`#${i + 1}`);

      // Name
      svg.append('text')
        .attr('x', labelW - 4).attr('y', y + barH / 2)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
        .attr('fill', COLORS.text).attr('font-size', '10px')
        .text(item.name.length > 22 ? item.name.substring(0, 20) + '...' : item.name);

      // Bar bg
      svg.append('rect')
        .attr('x', labelW).attr('y', y)
        .attr('width', barArea).attr('height', barH)
        .attr('fill', COLORS.grid).attr('rx', 3);

      // Bar fill
      svg.append('rect')
        .attr('x', labelW).attr('y', y)
        .attr('width', w).attr('height', barH)
        .attr('fill', color).attr('fill-opacity', 0.65).attr('rx', 3)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => showTooltip(evt, `<b>#${i + 1} ${esc(item.name)}</b><br>${esc(item.type || '')}<br>${cfg.label.split(' ').pop()}: ${val.toLocaleString()} ${cfg.unit}`))
        .on('mouseout', hideTooltip);

      // Value label
      svg.append('text')
        .attr('x', labelW + w + 4).attr('y', y + barH / 2)
        .attr('dominant-baseline', 'central')
        .attr('fill', COLORS.textBright).attr('font-size', '9px')
        .text(`${val.toLocaleString()} ${cfg.unit}`);
    });
  }

  function renderCapabilityRadar(container, data, cat) {
    if (!d3Ready()) return;
    container.innerHTML = '';

    // Aggregate axes differ per category
    const axisCfgs = {
      aircraft: [
        { key: 'maxSpeed', label: 'Speed' },
        { key: 'maxWeight', label: 'Weight' },
        { key: 'sensorCount', label: 'Sensors' },
        { key: 'weaponCount', label: 'Weapons' },
        { key: 'crew', label: 'Crew' },
      ],
      ships: [
        { key: 'maxSpeed', label: 'Speed' },
        { key: 'displacementFull', label: 'Displacement' },
        { key: 'sensorCount', label: 'Sensors' },
        { key: 'weaponCount', label: 'Weapons' },
        { key: 'crew', label: 'Crew' },
      ],
    };
    const axes = axisCfgs[cat];
    if (!axes) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">Capability radar available for Aircraft and Ships</div>';
      return;
    }

    // Group by type, compute averages
    const typeGroups = {};
    data.forEach(item => {
      const t = item.type || 'Unknown';
      if (!typeGroups[t]) typeGroups[t] = [];
      typeGroups[t].push(item);
    });

    // Keep top 5 types by count
    const topTypes = Object.entries(typeGroups)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);

    if (topTypes.length === 0) return;

    container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Capability by Type (avg)</div>';

    // Global max per axis
    const globalMax = {};
    axes.forEach(a => {
      globalMax[a.key] = Math.max(...data.map(d => parseFloat(d[a.key]) || 0), 1);
    });

    const W = 340, H = 340, cx = W / 2, cy = H / 2, R = 110;
    const n = axes.length;
    const angleSlice = (2 * Math.PI) / n;
    const typeColors = ['#4a9eff', '#f44336', '#4caf50', '#ffc107', '#9c27b0'];

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const gEl = svg.append('g').attr('transform', `translate(${cx},${cy})`);

    // Grid circles
    [0.25, 0.5, 0.75, 1].forEach(level => {
      gEl.append('circle').attr('r', R * level)
        .attr('fill', 'none').attr('stroke', COLORS.grid).attr('stroke-width', 1);
    });

    // Axis lines + labels
    axes.forEach((a, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      gEl.append('line')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', R * Math.cos(angle)).attr('y2', R * Math.sin(angle))
        .attr('stroke', COLORS.grid);
      gEl.append('text')
        .attr('x', (R + 18) * Math.cos(angle)).attr('y', (R + 18) * Math.sin(angle))
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .attr('fill', COLORS.text).attr('font-size', '10px')
        .text(a.label);
    });

    // Type polygons
    topTypes.forEach(([typeName, items], ti) => {
      const color = typeColors[ti % typeColors.length];
      const avgVals = axes.map(a => {
        const vals = items.map(d => parseFloat(d[a.key]) || 0).filter(v => v > 0);
        const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
        return avg / globalMax[a.key];
      });

      const pts = avgVals.map((v, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        return [R * v * Math.cos(angle), R * v * Math.sin(angle)];
      });

      gEl.append('polygon')
        .attr('points', pts.map(p => p.join(',')).join(' '))
        .attr('fill', color).attr('fill-opacity', 0.1)
        .attr('stroke', color).attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', (evt) => {
          const details = axes.map((a, i) => {
            const vals = items.map(d => parseFloat(d[a.key]) || 0).filter(v => v > 0);
            const avg = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
            return `${a.label}: ${avg.toLocaleString()}`;
          }).join('<br>');
          showTooltip(evt, `<b>${esc(typeName)}</b> (${items.length})<br>${details}`);
        })
        .on('mouseout', hideTooltip);
    });

    // Legend
    const legend = d3.select(container).append('div').attr('class', 'chart-legend');
    topTypes.forEach(([typeName, items], ti) => {
      const el = legend.append('span').attr('class', 'chart-legend-item');
      el.append('span').attr('class', 'chart-legend-dot').style('background', typeColors[ti % typeColors.length]);
      el.append('span').text(`${typeName} (${items.length})`);
    });
  }

  function renderSensorGenerations(container, data, cat) {
    if (!d3Ready()) return;
    container.innerHTML = '';

    if (cat !== 'sensors') {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">Generation timeline available for Sensors</div>';
      return;
    }

    // Parse decade from generation field
    const decades = {};
    const sensorTypes = new Set();
    data.forEach(item => {
      const gen = item.generation || '';
      const m = gen.match(/(\d{4})/);
      if (!m) return;
      const decade = Math.floor(parseInt(m[1]) / 10) * 10;
      const sType = (item.type || 'Unknown').split(',')[0].trim();
      sensorTypes.add(sType);
      if (!decades[decade]) decades[decade] = {};
      decades[decade][sType] = (decades[decade][sType] || 0) + 1;
    });

    const decadeKeys = Object.keys(decades).map(Number).sort();
    if (decadeKeys.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No generation data</div>';
      return;
    }

    container.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-weight:600">Sensor Technology by Decade</div>';

    // Top sensor types by count
    const typeCounts = {};
    data.forEach(item => {
      const sType = (item.type || 'Unknown').split(',')[0].trim();
      typeCounts[sType] = (typeCounts[sType] || 0) + 1;
    });
    const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Stack data
    const stackData = decadeKeys.map(dk => {
      const entry = { decade: dk };
      topTypes.forEach(t => { entry[t] = (decades[dk] && decades[dk][t]) || 0; });
      return entry;
    });

    const maxY = Math.max(...stackData.map(d => topTypes.reduce((s, t) => s + (d[t] || 0), 0)));

    const W = 500, H = 260, pad = { top: 12, right: 12, bottom: 35, left: 40 };
    const plotW = W - pad.left - pad.right;
    const plotH = H - pad.top - pad.bottom;

    const xScale = d3.scaleBand().domain(decadeKeys.map(d => d + 's')).range([0, plotW]).padding(0.15);
    const yScale = d3.scaleLinear().domain([0, maxY * 1.1]).range([plotH, 0]);

    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const gEl = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    // Grid
    yScale.ticks(4).forEach(t => {
      gEl.append('line').attr('x1', 0).attr('x2', plotW).attr('y1', yScale(t)).attr('y2', yScale(t)).attr('stroke', COLORS.grid);
      gEl.append('text').attr('x', -6).attr('y', yScale(t)).attr('text-anchor', 'end').attr('dominant-baseline', 'central').attr('fill', COLORS.text).attr('font-size', '9px').text(t);
    });

    // X axis labels
    decadeKeys.forEach(dk => {
      const label = dk + 's';
      gEl.append('text')
        .attr('x', xScale(label) + xScale.bandwidth() / 2).attr('y', plotH + 14)
        .attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', '9px')
        .text(label);
    });

    // Stacked bars
    decadeKeys.forEach(dk => {
      const label = dk + 's';
      let cumY = 0;
      topTypes.forEach((t, ti) => {
        const val = (decades[dk] && decades[dk][t]) || 0;
        if (val === 0) return;
        const x = xScale(label);
        const barH = plotH - yScale(val);
        const y = yScale(cumY + val);

        gEl.append('rect')
          .attr('x', x).attr('y', y)
          .attr('width', xScale.bandwidth()).attr('height', barH)
          .attr('fill', colorScale(ti)).attr('fill-opacity', 0.75).attr('rx', 2)
          .style('cursor', 'pointer')
          .on('mouseover', (evt) => showTooltip(evt, `<b>${dk}s</b><br>${esc(t)}: ${val} sensors`))
          .on('mouseout', hideTooltip);

        cumY += val;
      });
    });

    // Legend
    const legend = d3.select(container).append('div').attr('class', 'chart-legend');
    topTypes.forEach((t, i) => {
      const el = legend.append('span').attr('class', 'chart-legend-item');
      el.append('span').attr('class', 'chart-legend-dot').style('background', colorScale(i));
      el.append('span').text(t);
    });
  }

  // ══════════════════════════════════════════
  //  Tactical Analytics (detail-data charts)
  // ══════════════════════════════════════════

  // ── 16. Weapon Engagement Envelope ──
  function renderEngagementEnvelope(container, indexData, details) {
    if (!d3Ready()) return;
    container.innerHTML = '';
    if (!details || Object.keys(details).length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">Engagement envelopes available for Weapons</div>';
      return;
    }
    // Build envelope data: weapons with non-zero launch/target alt ranges
    const items = indexData.map(w => {
      const d = details[w.id];
      if (!d) return null;
      const hasEnvelope = (d.launchAltMax > 0 || d.targetAltMax > 0 || d.targetSpeedMax > 0);
      if (!hasEnvelope) return null;
      return {
        name: w.name,
        launchAltMin: d.launchAltMin || 0,
        launchAltMax: d.launchAltMax || 0,
        targetAltMin: d.targetAltMin || 0,
        targetAltMax: d.targetAltMax || 0,
        targetSpeedMin: d.targetSpeedMin || 0,
        targetSpeedMax: d.targetSpeedMax || 0,
        launchSpeedMin: d.launchSpeedMin || 0,
        launchSpeedMax: d.launchSpeedMax || 0,
      };
    }).filter(Boolean);
    if (items.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No engagement envelope data available</div>';
      return;
    }
    // Sort by target alt range (largest first), take top 15
    items.sort((a, b) => (b.targetAltMax - b.targetAltMin) - (a.targetAltMax - a.targetAltMin));
    const top = items.slice(0, 15);

    const W = 520, H = 340, M = { top: 30, right: 20, bottom: 50, left: 55 };
    const w = W - M.left - M.right, h = H - M.top - M.bottom;
    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%').style('height', 'auto');
    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    // Title
    svg.append('text').attr('x', W / 2).attr('y', 16).attr('text-anchor', 'middle')
      .attr('fill', COLORS.textBright).attr('font-size', 13).attr('font-weight', 600)
      .text('Weapon Engagement Envelopes (Target Altitude)');

    const maxAlt = d3.max(top, d => d.targetAltMax) || 100;
    const x = d3.scaleBand().domain(top.map(d => d.name)).range([0, w]).padding(0.15);
    const y = d3.scaleLinear().domain([0, maxAlt * 1.05]).range([h, 0]);

    // Grid
    g.selectAll('.gridH').data(y.ticks(5)).enter().append('line')
      .attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', COLORS.grid);

    // Bars showing target altitude envelope
    const barColors = d3.scaleOrdinal(d3.schemeTableau10);
    g.selectAll('.env-bar').data(top).enter().append('rect')
      .attr('x', d => x(d.name)).attr('width', x.bandwidth())
      .attr('y', d => y(d.targetAltMax))
      .attr('height', d => Math.max(1, y(d.targetAltMin) - y(d.targetAltMax)))
      .attr('fill', (d, i) => barColors(i)).attr('opacity', 0.75).attr('rx', 2)
      .on('mouseover', (evt, d) => showTooltip(evt,
        `<b>${esc(d.name)}</b><br>Target Alt: ${d.targetAltMin.toLocaleString()}–${d.targetAltMax.toLocaleString()} ft<br>` +
        `Target Speed: ${d.targetSpeedMin}–${d.targetSpeedMax} kt<br>` +
        `Launch Alt: ${d.launchAltMin.toLocaleString()}–${d.launchAltMax.toLocaleString()} ft`))
      .on('mousemove', (evt) => showTooltip(evt, getTooltip().innerHTML))
      .on('mouseout', hideTooltip);

    // Min altitude marker (diamond)
    g.selectAll('.env-min').data(top.filter(d => d.targetAltMin > 0)).enter()
      .append('path')
      .attr('d', d3.symbol().type(d3.symbolDiamond).size(30))
      .attr('transform', d => `translate(${x(d.name) + x.bandwidth() / 2},${y(d.targetAltMin)})`)
      .attr('fill', '#fff').attr('opacity', 0.9);

    // Axes
    g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).tickSize(0))
      .selectAll('text').attr('fill', COLORS.text).attr('font-size', 8)
      .attr('transform', 'rotate(-35)').attr('text-anchor', 'end');
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => d >= 1000 ? (d / 1000) + 'k' : d))
      .selectAll('text').attr('fill', COLORS.text).attr('font-size', 9);
    svg.append('text').attr('x', M.left - 40).attr('y', H / 2).attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90,${M.left - 40},${H / 2})`).attr('fill', COLORS.text).attr('font-size', 10)
      .text('Target Altitude (ft)');
  }

  // ── 17. Kill Probability Matrix ──
  function renderPokMatrix(container, indexData, details) {
    if (!d3Ready()) return;
    container.innerHTML = '';
    if (!details || Object.keys(details).length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">Kill probability matrix available for Weapons</div>';
      return;
    }
    const domains = ['airPoK', 'surfacePoK', 'landPoK', 'subPoK'];
    const domainLabels = ['Air', 'Surface', 'Land', 'Sub'];
    // Filter weapons that have at least one non-zero PoK
    const items = indexData.map(w => {
      const d = details[w.id];
      if (!d) return null;
      const poks = domains.map(k => d[k] || 0);
      if (poks.every(v => v === 0)) return null;
      return { name: w.name, poks, maxPok: Math.max(...poks) };
    }).filter(Boolean);
    if (items.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No kill probability data</div>';
      return;
    }
    items.sort((a, b) => b.maxPok - a.maxPok);
    const top = items.slice(0, 25);

    const cellW = 55, cellH = 18, labelW = 180;
    const W = labelW + cellW * 4 + 30, H = 30 + top.length * cellH + 30;
    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%').style('height', 'auto');

    // Title
    svg.append('text').attr('x', W / 2).attr('y', 16).attr('text-anchor', 'middle')
      .attr('fill', COLORS.textBright).attr('font-size', 13).attr('font-weight', 600)
      .text('Kill Probability by Domain (%)');

    const gY = 30;
    // Column headers
    domainLabels.forEach((label, i) => {
      svg.append('text').attr('x', labelW + i * cellW + cellW / 2).attr('y', gY - 4)
        .attr('text-anchor', 'middle').attr('fill', COLORS.text).attr('font-size', 10).attr('font-weight', 600)
        .text(label);
    });

    // Color scale: 0=dark, 100=bright green
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, 100]);

    top.forEach((item, row) => {
      const ry = gY + row * cellH;
      // Label
      const displayName = item.name.length > 28 ? item.name.slice(0, 26) + '…' : item.name;
      svg.append('text').attr('x', labelW - 6).attr('y', ry + cellH / 2 + 3)
        .attr('text-anchor', 'end').attr('fill', COLORS.text).attr('font-size', 8.5)
        .text(displayName);
      // Cells
      item.poks.forEach((pok, col) => {
        const cx = labelW + col * cellW;
        svg.append('rect').attr('x', cx + 1).attr('y', ry + 1)
          .attr('width', cellW - 2).attr('height', cellH - 2).attr('rx', 2)
          .attr('fill', pok > 0 ? colorScale(pok) : 'rgba(255,255,255,0.03)')
          .attr('opacity', pok > 0 ? 0.85 : 1)
          .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(item.name)}</b><br>${domainLabels[col]}: ${pok}%`))
          .on('mouseout', hideTooltip);
        if (pok > 0) {
          svg.append('text').attr('x', cx + cellW / 2).attr('y', ry + cellH / 2 + 3)
            .attr('text-anchor', 'middle').attr('fill', pok > 60 ? '#000' : '#fff')
            .attr('font-size', 8.5).attr('font-weight', 500)
            .text(pok);
        }
      });
    });
  }

  // ── 18. Sensor Coverage Comparison ──
  function renderSensorCoverage(container, indexData, details, cat) {
    if (!d3Ready()) return;
    container.innerHTML = '';
    if (!details || !['aircraft', 'ships'].includes(cat)) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">Sensor coverage comparison available for Aircraft and Ships</div>';
      return;
    }
    // Build per-platform sensor breakdown
    const sensorTypes = ['Radar', 'ESM', 'Sonar', 'E/O', 'Other'];
    const sTypeColor = { Radar: COLORS.radar, ESM: COLORS.esm, Sonar: COLORS.sonar, 'E/O': COLORS.eo, Other: '#999' };
    const platforms = indexData.map(item => {
      const d = details[item.id];
      if (!d || !d.sensors || d.sensors.length === 0) return null;
      const byType = {};
      let total = 0;
      d.sensors.forEach(s => {
        let t = s.type || 'Other';
        if (!sensorTypes.includes(t)) {
          if (t.includes('Radar')) t = 'Radar';
          else if (t.includes('ESM') || t.includes('RWR')) t = 'ESM';
          else if (t.includes('Sonar')) t = 'Sonar';
          else t = 'Other';
        }
        const range = s.rangeMax || 0;
        if (!byType[t]) byType[t] = 0;
        byType[t] = Math.max(byType[t], range);
        total += range;
      });
      return { name: item.name, byType, total };
    }).filter(Boolean);
    platforms.sort((a, b) => b.total - a.total);
    const top = platforms.slice(0, 12);
    if (top.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No sensor data available</div>';
      return;
    }

    const W = 520, H = 30 + top.length * 28 + 40, M = { top: 30, right: 20, bottom: 30, left: 170 };
    const w = W - M.left - M.right, h = H - M.top - M.bottom;
    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%').style('height', 'auto');
    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    svg.append('text').attr('x', W / 2).attr('y', 16).attr('text-anchor', 'middle')
      .attr('fill', COLORS.textBright).attr('font-size', 13).attr('font-weight', 600)
      .text(`Sensor Coverage — Top ${top.length} ${cat === 'aircraft' ? 'Aircraft' : 'Ships'}`);

    const maxRange = d3.max(top, d => d3.max(sensorTypes, t => d.byType[t] || 0)) || 100;
    const yBand = d3.scaleBand().domain(top.map(d => d.name)).range([0, h]).padding(0.2);
    const xScale = d3.scaleLog().domain([1, maxRange * 1.2]).range([0, w]).clamp(true);

    // Grid
    g.selectAll('.gridV').data(xScale.ticks(5)).enter().append('line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d)).attr('y1', 0).attr('y2', h)
      .attr('stroke', COLORS.grid);

    const barH = yBand.bandwidth() / sensorTypes.length;
    top.forEach(platform => {
      sensorTypes.forEach((t, ti) => {
        const val = platform.byType[t] || 0;
        if (val <= 0) return;
        g.append('rect')
          .attr('x', 0)
          .attr('y', yBand(platform.name) + ti * barH)
          .attr('width', xScale(Math.max(1, val)))
          .attr('height', barH - 1)
          .attr('fill', sTypeColor[t] || '#666').attr('opacity', 0.8).attr('rx', 2)
          .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(platform.name)}</b><br>${t}: ${val.toLocaleString()} km`))
          .on('mouseout', hideTooltip);
      });
    });

    // Y axis labels
    g.append('g').call(d3.axisLeft(yBand).tickSize(0))
      .selectAll('text').attr('fill', COLORS.text).attr('font-size', 8)
      .text(function() { const t = d3.select(this).text(); return t.length > 24 ? t.slice(0, 22) + '…' : t; });
    // X axis
    g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d >= 1000 ? (d / 1000) + 'k' : d))
      .selectAll('text').attr('fill', COLORS.text).attr('font-size', 9);
    svg.append('text').attr('x', M.left + w / 2).attr('y', H - 4).attr('text-anchor', 'middle')
      .attr('fill', COLORS.text).attr('font-size', 10).text('Max Range (km, log scale)');

    // Legend
    const legend = d3.select(container).append('div').attr('class', 'chart-legend');
    sensorTypes.forEach(t => {
      const el = legend.append('span').attr('class', 'chart-legend-item');
      el.append('span').attr('class', 'chart-legend-dot').style('background', sTypeColor[t]);
      el.append('span').text(t);
    });
  }

  // ── 19. Weapon Weight-Range Bubble ──
  function renderWeaponBubble(container, indexData, details) {
    if (!d3Ready()) return;
    container.innerHTML = '';
    if (!details || Object.keys(details).length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">Weapon bubble chart available for Weapons</div>';
      return;
    }
    const items = indexData.map(w => {
      const d = details[w.id];
      if (!d || !d.warhead) return null;
      const range = w.maxRange || 0;
      const weight = w.weight || 0;
      if (range <= 0 || weight <= 0) return null;
      return {
        name: w.name,
        range, weight,
        damage: d.warhead.damage || 1,
        warheadName: d.warhead.name || 'Unknown',
        warheadType: d.warhead.type || 'Unknown',
        explosiveWeight: d.warhead.explosiveWeight || 0,
      };
    }).filter(Boolean);
    if (items.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No weapon weight/range data</div>';
      return;
    }

    const W = 520, H = 340, M = { top: 30, right: 30, bottom: 50, left: 60 };
    const w = W - M.left - M.right, h = H - M.top - M.bottom;
    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%').style('height', 'auto');
    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    svg.append('text').attr('x', W / 2).attr('y', 16).attr('text-anchor', 'middle')
      .attr('fill', COLORS.textBright).attr('font-size', 13).attr('font-weight', 600)
      .text('Weapon Weight vs. Range (bubble = warhead damage)');

    const xScale = d3.scaleLog().domain([d3.min(items, d => d.range) * 0.7, d3.max(items, d => d.range) * 1.3]).range([0, w]).clamp(true);
    const yScale = d3.scaleLog().domain([d3.min(items, d => d.weight) * 0.7, d3.max(items, d => d.weight) * 1.3]).range([h, 0]).clamp(true);
    const rScale = d3.scaleSqrt().domain([0, d3.max(items, d => d.damage)]).range([3, 22]);

    // Warhead type colors
    const typeSet = [...new Set(items.map(d => d.warheadType))];
    const typeColor = d3.scaleOrdinal(d3.schemeTableau10).domain(typeSet);

    // Grid
    g.selectAll('.gridH').data(yScale.ticks(4)).enter().append('line')
      .attr('x1', 0).attr('x2', w).attr('y1', d => yScale(d)).attr('y2', d => yScale(d)).attr('stroke', COLORS.grid);
    g.selectAll('.gridV').data(xScale.ticks(4)).enter().append('line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d)).attr('y1', 0).attr('y2', h).attr('stroke', COLORS.grid);

    // Bubbles
    g.selectAll('.bubble').data(items).enter().append('circle')
      .attr('cx', d => xScale(d.range)).attr('cy', d => yScale(d.weight))
      .attr('r', d => rScale(d.damage))
      .attr('fill', d => typeColor(d.warheadType)).attr('opacity', 0.65)
      .attr('stroke', d => typeColor(d.warheadType)).attr('stroke-width', 1).attr('stroke-opacity', 0.9)
      .on('mouseover', (evt, d) => showTooltip(evt,
        `<b>${esc(d.name)}</b><br>Range: ${d.range.toLocaleString()} km<br>Weight: ${d.weight.toLocaleString()} kg<br>` +
        `Warhead: ${esc(d.warheadName)}<br>Damage: ${d.damage}<br>Explosive: ${d.explosiveWeight} kg`))
      .on('mousemove', (evt) => showTooltip(evt, getTooltip().innerHTML))
      .on('mouseout', hideTooltip);

    // Axes
    g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d >= 1000 ? (d / 1000) + 'k' : d))
      .selectAll('text').attr('fill', COLORS.text).attr('font-size', 9);
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d >= 1000 ? (d / 1000) + 'k' : d))
      .selectAll('text').attr('fill', COLORS.text).attr('font-size', 9);
    svg.append('text').attr('x', M.left + w / 2).attr('y', H - 6).attr('text-anchor', 'middle')
      .attr('fill', COLORS.text).attr('font-size', 10).text('Max Range (km)');
    svg.append('text').attr('x', M.left - 45).attr('y', M.top + h / 2).attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90,${M.left - 45},${M.top + h / 2})`).attr('fill', COLORS.text).attr('font-size', 10)
      .text('Weight (kg)');

    // Legend (top warhead types)
    const legend = d3.select(container).append('div').attr('class', 'chart-legend');
    typeSet.slice(0, 6).forEach(t => {
      const el = legend.append('span').attr('class', 'chart-legend-item');
      el.append('span').attr('class', 'chart-legend-dot').style('background', typeColor(t));
      el.append('span').text(t.length > 25 ? t.slice(0, 23) + '…' : t);
    });
  }

  // ── 20. Platform Survivability ──
  function renderSurvivability(container, indexData, details, cat) {
    if (!d3Ready()) return;
    container.innerHTML = '';
    if (!details || !['aircraft', 'ships'].includes(cat)) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">Survivability chart available for Aircraft and Ships</div>';
      return;
    }
    const armorKeys = cat === 'aircraft'
      ? [{ key: 'damagePoints', label: 'Damage Pts', color: '#4a9eff' }, { key: 'cockpitArmor', label: 'Cockpit', color: '#f44336' }, { key: 'fuselageArmor', label: 'Fuselage', color: '#ffc107' }, { key: 'engineArmor', label: 'Engine', color: '#4caf50' }]
      : [{ key: 'damagePoints', label: 'Damage Pts', color: '#4a9eff' }];

    const items = indexData.map(item => {
      const d = details[item.id];
      if (!d) return null;
      const dp = d.damagePoints || 0;
      if (dp === 0) return null;
      const vals = {};
      armorKeys.forEach(ak => { vals[ak.key] = d[ak.key] || 0; });
      return { name: item.name, dp, vals };
    }).filter(Boolean);
    items.sort((a, b) => b.dp - a.dp);
    const top = items.slice(0, 15);
    if (top.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No survivability data</div>';
      return;
    }

    const W = 520, H = 30 + top.length * 24 + 40, M = { top: 30, right: 20, bottom: 30, left: 170 };
    const w = W - M.left - M.right, h = H - M.top - M.bottom;
    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%').style('height', 'auto');
    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    svg.append('text').attr('x', W / 2).attr('y', 16).attr('text-anchor', 'middle')
      .attr('fill', COLORS.textBright).attr('font-size', 13).attr('font-weight', 600)
      .text(`Platform Survivability — ${cat === 'aircraft' ? 'Aircraft' : 'Ships'}`);

    const yBand = d3.scaleBand().domain(top.map(d => d.name)).range([0, h]).padding(0.15);

    if (cat === 'aircraft') {
      // Grouped bars for each armor component
      const maxVal = d3.max(top, d => d3.max(armorKeys, ak => d.vals[ak.key])) || 100;
      const xScale = d3.scaleLinear().domain([0, maxVal * 1.1]).range([0, w]);
      const barH = yBand.bandwidth() / armorKeys.length;

      g.selectAll('.gridV').data(xScale.ticks(5)).enter().append('line')
        .attr('x1', d => xScale(d)).attr('x2', d => xScale(d)).attr('y1', 0).attr('y2', h).attr('stroke', COLORS.grid);

      top.forEach(platform => {
        armorKeys.forEach((ak, i) => {
          const val = platform.vals[ak.key];
          if (val <= 0) return;
          g.append('rect')
            .attr('x', 0).attr('y', yBand(platform.name) + i * barH)
            .attr('width', xScale(val)).attr('height', barH - 1)
            .attr('fill', ak.color).attr('opacity', 0.8).attr('rx', 2)
            .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(platform.name)}</b><br>${ak.label}: ${val.toLocaleString()}`))
            .on('mouseout', hideTooltip);
        });
      });

      g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xScale).ticks(5))
        .selectAll('text').attr('fill', COLORS.text).attr('font-size', 9);
      // Legend
      const legend = d3.select(container).append('div').attr('class', 'chart-legend');
      armorKeys.forEach(ak => {
        const el = legend.append('span').attr('class', 'chart-legend-item');
        el.append('span').attr('class', 'chart-legend-dot').style('background', ak.color);
        el.append('span').text(ak.label);
      });
    } else {
      // Ships: single bar for damage points
      const maxDP = d3.max(top, d => d.dp) || 100;
      const xScale = d3.scaleLinear().domain([0, maxDP * 1.1]).range([0, w]);
      const dpColor = d3.scaleSequential(d3.interpolateBlues).domain([0, maxDP]);

      g.selectAll('.gridV').data(xScale.ticks(5)).enter().append('line')
        .attr('x1', d => xScale(d)).attr('x2', d => xScale(d)).attr('y1', 0).attr('y2', h).attr('stroke', COLORS.grid);

      top.forEach(platform => {
        g.append('rect')
          .attr('x', 0).attr('y', yBand(platform.name))
          .attr('width', xScale(platform.dp)).attr('height', yBand.bandwidth())
          .attr('fill', dpColor(platform.dp)).attr('opacity', 0.85).attr('rx', 2)
          .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(platform.name)}</b><br>Damage Points: ${platform.dp.toLocaleString()}`))
          .on('mouseout', hideTooltip);
        g.append('text').attr('x', xScale(platform.dp) + 4).attr('y', yBand(platform.name) + yBand.bandwidth() / 2 + 3)
          .attr('fill', COLORS.text).attr('font-size', 8.5).text(platform.dp.toLocaleString());
      });

      g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xScale).ticks(5))
        .selectAll('text').attr('fill', COLORS.text).attr('font-size', 9);
    }

    // Y axis labels
    g.append('g').call(d3.axisLeft(yBand).tickSize(0))
      .selectAll('text').attr('fill', COLORS.text).attr('font-size', 8)
      .text(function() { const t = d3.select(this).text(); return t.length > 24 ? t.slice(0, 22) + '…' : t; });
  }

  // ── 21. Magazine Depth Analysis ──
  function renderMagazineDepth(container, indexData, details) {
    if (!d3Ready()) return;
    container.innerHTML = '';
    if (!details || Object.keys(details).length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">Magazine depth analysis available for Ships</div>';
      return;
    }
    // Aggregate weapon categories from magazines + mounts
    const weaponCats = ['Missile', 'Gun', 'Torpedo', 'Bomb', 'Rocket', 'Decoy', 'Other'];
    function classifyWeapon(name, type) {
      const n = (name + ' ' + (type || '')).toLowerCase();
      if (n.includes('missile') || n.includes('harpoon') || n.includes('sm-') || n.includes('essm') || n.includes('sam') || n.includes('asroc')) return 'Missile';
      if (n.includes('gun') || n.includes('mm/') || n.includes('ciws') || n.includes('phalanx')) return 'Gun';
      if (n.includes('torpedo') || n.includes('torp')) return 'Torpedo';
      if (n.includes('bomb') || n.includes('mine') || n.includes('depth charge')) return 'Bomb';
      if (n.includes('rocket')) return 'Rocket';
      if (n.includes('decoy') || n.includes('chaff') || n.includes('flare') || n.includes('nulka') || n.includes('srboc')) return 'Decoy';
      return 'Other';
    }
    const catColors = { Missile: '#f44336', Gun: '#ffc107', Torpedo: '#00bcd4', Bomb: '#9c27b0', Rocket: '#ff9800', Decoy: '#8bc34a', Other: '#999' };

    const ships = indexData.map(item => {
      const d = details[item.id];
      if (!d) return null;
      const counts = {};
      weaponCats.forEach(c => { counts[c] = 0; });
      // Count from magazines
      if (d.magazines) {
        d.magazines.forEach(mag => {
          const qty = mag.capacity || mag.qty || 0;
          if (mag.weapons && mag.weapons.length > 0) {
            mag.weapons.forEach(w => { counts[classifyWeapon(w.name, w.type)] += qty; });
          } else {
            counts[classifyWeapon(mag.name, '')] += qty;
          }
        });
      }
      // Count from mounts
      if (d.mounts) {
        d.mounts.forEach(mount => {
          const qty = mount.qty || 1;
          counts[classifyWeapon(mount.name, '')] += qty;
        });
      }
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      if (total === 0) return null;
      return { name: item.name, counts, total };
    }).filter(Boolean);
    ships.sort((a, b) => b.total - a.total);
    const top = ships.slice(0, 15);
    if (top.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No magazine data</div>';
      return;
    }

    const W = 520, H = 30 + top.length * 24 + 40, M = { top: 30, right: 40, bottom: 30, left: 170 };
    const w = W - M.left - M.right, h = H - M.top - M.bottom;
    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%').style('height', 'auto');
    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    svg.append('text').attr('x', W / 2).attr('y', 16).attr('text-anchor', 'middle')
      .attr('fill', COLORS.textBright).attr('font-size', 13).attr('font-weight', 600)
      .text('Magazine Depth — Weapon Capacity by Ship');

    const maxTotal = d3.max(top, d => d.total) || 100;
    const xScale = d3.scaleLinear().domain([0, maxTotal * 1.1]).range([0, w]);
    const yBand = d3.scaleBand().domain(top.map(d => d.name)).range([0, h]).padding(0.15);

    g.selectAll('.gridV').data(xScale.ticks(5)).enter().append('line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d)).attr('y1', 0).attr('y2', h).attr('stroke', COLORS.grid);

    // Stacked bars
    top.forEach(ship => {
      let cumX = 0;
      weaponCats.forEach(cat => {
        const val = ship.counts[cat];
        if (val <= 0) return;
        g.append('rect')
          .attr('x', xScale(cumX)).attr('y', yBand(ship.name))
          .attr('width', xScale(cumX + val) - xScale(cumX)).attr('height', yBand.bandwidth())
          .attr('fill', catColors[cat]).attr('opacity', 0.8).attr('rx', 1)
          .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(ship.name)}</b><br>${cat}: ${val}<br>Total: ${ship.total}`))
          .on('mouseout', hideTooltip);
        cumX += val;
      });
      // Total label
      g.append('text').attr('x', xScale(ship.total) + 4).attr('y', yBand(ship.name) + yBand.bandwidth() / 2 + 3)
        .attr('fill', COLORS.text).attr('font-size', 8.5).text(ship.total);
    });

    // Axes
    g.append('g').call(d3.axisLeft(yBand).tickSize(0))
      .selectAll('text').attr('fill', COLORS.text).attr('font-size', 8)
      .text(function() { const t = d3.select(this).text(); return t.length > 24 ? t.slice(0, 22) + '…' : t; });
    g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text').attr('fill', COLORS.text).attr('font-size', 9);

    const legend = d3.select(container).append('div').attr('class', 'chart-legend');
    weaponCats.forEach(cat => {
      const el = legend.append('span').attr('class', 'chart-legend-item');
      el.append('span').attr('class', 'chart-legend-dot').style('background', catColors[cat]);
      el.append('span').text(cat);
    });
  }

  // ── 22. Sensor Capability Matrix ──
  function renderCapabilityMatrix(container, indexData, details) {
    if (!d3Ready()) return;
    container.innerHTML = '';
    if (!details || Object.keys(details).length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">Capability matrix available for Sensors</div>';
      return;
    }
    // Collect all capabilities
    const capSet = new Set();
    const sensors = indexData.map(s => {
      const d = details[s.id];
      if (!d || !d.capabilities || d.capabilities.length === 0) return null;
      d.capabilities.forEach(c => capSet.add(c));
      return { name: s.name, caps: new Set(d.capabilities), count: d.capabilities.length };
    }).filter(Boolean);
    if (sensors.length === 0 || capSet.size === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);font-size:12px">No capability data</div>';
      return;
    }
    // Sort sensors by capability count, take top 20
    sensors.sort((a, b) => b.count - a.count);
    const topSensors = sensors.slice(0, 20);
    // Sort capabilities by frequency
    const capFreq = {};
    topSensors.forEach(s => s.caps.forEach(c => { capFreq[c] = (capFreq[c] || 0) + 1; }));
    const caps = Object.keys(capFreq).sort((a, b) => capFreq[b] - capFreq[a]);

    const cellSize = 14, labelW = 170, capLabelH = 100;
    const W = labelW + caps.length * cellSize + 20;
    const H = capLabelH + topSensors.length * cellSize + 20;
    const svg = d3.select(container).append('svg')
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%').style('height', 'auto');

    svg.append('text').attr('x', W / 2).attr('y', 14).attr('text-anchor', 'middle')
      .attr('fill', COLORS.textBright).attr('font-size', 13).attr('font-weight', 600)
      .text('Sensor Capability Matrix');

    // Column headers (rotated)
    caps.forEach((cap, ci) => {
      svg.append('text')
        .attr('x', labelW + ci * cellSize + cellSize / 2)
        .attr('y', capLabelH - 4)
        .attr('text-anchor', 'start')
        .attr('transform', `rotate(-55,${labelW + ci * cellSize + cellSize / 2},${capLabelH - 4})`)
        .attr('fill', COLORS.text).attr('font-size', 7)
        .text(cap.length > 20 ? cap.slice(0, 18) + '…' : cap);
    });

    // Row labels + dots
    topSensors.forEach((sensor, ri) => {
      const ry = capLabelH + ri * cellSize;
      const displayName = sensor.name.length > 26 ? sensor.name.slice(0, 24) + '…' : sensor.name;
      svg.append('text').attr('x', labelW - 4).attr('y', ry + cellSize / 2 + 3)
        .attr('text-anchor', 'end').attr('fill', COLORS.text).attr('font-size', 7.5)
        .text(displayName);

      caps.forEach((cap, ci) => {
        const cx = labelW + ci * cellSize + cellSize / 2;
        const cy = ry + cellSize / 2;
        if (sensor.caps.has(cap)) {
          svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 4)
            .attr('fill', COLORS.accent).attr('opacity', 0.85)
            .on('mouseover', (evt) => showTooltip(evt, `<b>${esc(sensor.name)}</b><br>${esc(cap)}`))
            .on('mouseout', hideTooltip);
        } else {
          svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 2)
            .attr('fill', 'rgba(255,255,255,0.06)');
        }
      });
    });
  }

  return {
    d3Ready,
    renderRadarChart,
    renderRangeRings,
    renderSensorBars,
    renderSignaturePolar,
    renderPerfCurves,
    renderLoadoutAnalysis,
    renderScatter,
    renderDonut,
    renderTimeline,
    renderDomainHeatmap,
    renderHistogram,
    renderOperatorBreakdown,
    renderTopTen,
    renderCapabilityRadar,
    renderSensorGenerations,
    renderEngagementEnvelope,
    renderPokMatrix,
    renderSensorCoverage,
    renderWeaponBubble,
    renderSurvivability,
    renderMagazineDepth,
    renderCapabilityMatrix,
  };
})();
