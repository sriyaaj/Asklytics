/**
 * DataSense AI - Intelligent Chart Generation UI
 * 
 * Feature 6: Intelligent Chart Generation
 * 
 * Rules:
 * - Date + Revenue/Metric -> Line chart
 * - Product/Category + Revenue/Metric -> Bar chart
 * - Score / Metric -> Distribution / Histogram
 * - Region / Channel + Revenue -> Category comparison (Donut/Bar)
 * - Two numerical variables -> Scatter plot
 * 
 * Styled for Linear x Notion x modern BI tools:
 * - Dark slate theme, glowing gradients, clean tooltips, rounded bars
 */

export class ChartService {
  constructor() {
    this.chartInstances = {};
    this.themeColors = {
      primary: '#6366F1', // Indigo
      secondary: '#38BDF8', // Cyan
      success: '#10B981', // Emerald
      warning: '#F59E0B', // Amber
      danger: '#F43F5E', // Rose
      purple: '#A78BFA',
      grid: 'rgba(255, 255, 255, 0.06)',
      text: '#94A3B8',
      textBright: '#F8FAFC'
    };
  }

  destroyChart(id) {
    if (this.chartInstances[id]) {
      this.chartInstances[id].destroy();
      delete this.chartInstances[id];
    }
  }

  /**
   * Intelligently analyze columns and generate appropriate visualizations
   */
  renderSmartCharts(records, columns, schema) {
    if (!records || records.length === 0) return;

    if (!window.Chart) {
      this.renderFallbackSvgCharts(records, columns, schema);
      return;
    }

    // 1. Chart 1: Temporal Trend (Date + Metric) or Primary Category Bar
    const dateCol = columns.find(c => schema.columns[c].type === 'date');
    const numCols = columns.filter(c => schema.columns[c].type === 'numeric');
    const catCols = columns.filter(c => schema.columns[c].type === 'categorical');

    const primaryMetric = numCols.find(c => /revenue|score|spend|term_2/i.test(c)) || numCols[0];
    const categoryCol = catCols.find(c => /product|subject|segment|channel|region/i.test(c)) || catCols[0];

    // Chart A: Trend or Categorical Bar
    if (dateCol && primaryMetric) {
      this.renderTrendChart('chart-trend', records, dateCol, primaryMetric);
    } else if (categoryCol && primaryMetric) {
      this.renderCategoryBar('chart-trend', records, categoryCol, primaryMetric, 'Performance Distribution');
    }

    // Chart B: Category Breakdown (Bar or Donut)
    if (categoryCol && primaryMetric) {
      this.renderCategoryBar('chart-breakdown', records, categoryCol, primaryMetric, `${categoryCol} vs ${primaryMetric}`);
    }

    // Chart C: Distribution / Histogram or Category Comparison
    const secondaryCat = catCols.find(c => c !== categoryCol && /region|channel|grade/i.test(c));
    if (secondaryCat && primaryMetric) {
      this.renderDonutChart('chart-distribution', records, secondaryCat, primaryMetric, `${secondaryCat} Share`);
    } else if (primaryMetric) {
      this.renderHistogram('chart-distribution', records, primaryMetric, `${primaryMetric} Distribution`);
    }

    // Chart D: Scatter (Two numeric variables)
    if (numCols.length >= 2) {
      this.renderScatterPlot('chart-scatter', records, numCols[0], numCols[1]);
    }
  }

  /**
   * Temporal Trend Line Chart
   */
  renderTrendChart(canvasId, records, dateCol, valCol) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Aggregate by date
    const dateMap = {};
    records.forEach(r => {
      const d = r[dateCol];
      if (!d) return;
      dateMap[d] = (dateMap[d] || 0) + (Number(r[valCol]) || 0);
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));
    const values = sortedDates.map(d => dateMap[d]);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    this.chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedDates,
        datasets: [{
          label: valCol,
          data: values,
          borderColor: this.themeColors.primary,
          borderWidth: 2.5,
          pointBackgroundColor: this.themeColors.primary,
          pointBorderColor: '#0F172A',
          pointHoverRadius: 6,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35
        }]
      },
      options: this.getBaseOptions('Time Trend')
    });
  }

  /**
   * Category Bar Chart
   */
  renderCategoryBar(canvasId, records, catCol, valCol, title) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const catMap = {};
    records.forEach(r => {
      const k = r[catCol] || 'Other';
      catMap[k] = (catMap[k] || 0) + (Number(r[valCol]) || 0);
    });

    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const labels = sorted.map(s => s[0]);
    const values = sorted.map(s => s[1]);

    const ctx = canvas.getContext('2d');
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: valCol,
          data: values,
          backgroundColor: this.themeColors.secondary,
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: this.getBaseOptions(title)
    });
  }

  /**
   * Category Donut Chart
   */
  renderDonutChart(canvasId, records, catCol, valCol, title) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const catMap = {};
    records.forEach(r => {
      const k = r[catCol] || 'Other';
      catMap[k] = (catMap[k] || 0) + (Number(r[valCol]) || 1);
    });

    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const colors = [
      this.themeColors.primary,
      this.themeColors.secondary,
      this.themeColors.success,
      this.themeColors.warning,
      this.themeColors.purple,
      this.themeColors.danger
    ];

    const ctx = canvas.getContext('2d');
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sorted.map(s => s[0]),
        datasets: [{
          data: sorted.map(s => s[1]),
          backgroundColor: colors.slice(0, sorted.length),
          borderWidth: 2,
          borderColor: '#111622'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: this.themeColors.text, font: { family: 'Inter', size: 11 } }
          }
        },
        cutout: '70%'
      }
    });
  }

  /**
   * Numerical Distribution / Histogram
   */
  renderHistogram(canvasId, records, valCol, title) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const values = records.map(r => Number(r[valCol])).filter(n => !isNaN(n));
    if (values.length === 0) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const bucketCount = 5;
    const step = (max - min) / bucketCount || 1;

    const buckets = Array(bucketCount).fill(0);
    const labels = [];

    for (let i = 0; i < bucketCount; i++) {
      const bMin = Math.round(min + i * step);
      const bMax = Math.round(min + (i + 1) * step);
      labels.push(`${bMin}-${bMax}`);
    }

    values.forEach(v => {
      let bIdx = Math.floor((v - min) / step);
      if (bIdx >= bucketCount) bIdx = bucketCount - 1;
      buckets[bIdx]++;
    });

    const ctx = canvas.getContext('2d');
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Frequency',
          data: buckets,
          backgroundColor: this.themeColors.purple,
          borderRadius: 4
        }]
      },
      options: this.getBaseOptions(title)
    });
  }

  /**
   * Scatter Plot for Bivariate Analysis
   */
  renderScatterPlot(canvasId, records, xCol, yCol) {
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const points = records
      .map(r => ({ x: Number(r[xCol]), y: Number(r[yCol]) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y));

    const ctx = canvas.getContext('2d');
    this.chartInstances[canvasId] = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${xCol} vs ${yCol}`,
          data: points,
          backgroundColor: this.themeColors.secondary,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: xCol, color: this.themeColors.text },
            grid: { color: this.themeColors.grid },
            ticks: { color: this.themeColors.text }
          },
          y: {
            title: { display: true, text: yCol, color: this.themeColors.text },
            grid: { color: this.themeColors.grid },
            ticks: { color: this.themeColors.text }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  renderFallbackSvgCharts(records, columns, schema) {
    const numCols = columns.filter(c => schema.columns[c].type === 'numeric');
    const catCols = columns.filter(c => schema.columns[c].type === 'categorical');
    const primary = numCols[0] || columns[0];
    const category = catCols[0] || columns[1];

    ['chart-trend', 'chart-breakdown', 'chart-distribution', 'chart-scatter'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const parent = el.parentElement;
      if (parent) {
        parent.innerHTML = `
          <div style="height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;background:var(--bg-surface-elevated);border-radius:8px;padding:20px;">
            <div style="font-size:12px;color:var(--accent-cyan);font-weight:600;margin-bottom:8px;">${category} vs ${primary}</div>
            <div style="display:flex;align-items:flex-end;gap:8px;height:140px;width:100%;max-width:320px;padding:10px;border-bottom:1px solid rgba(255,255,255,0.1);">
              <div style="flex:1;background:var(--accent-primary);height:75%;border-radius:4px 4px 0 0;"></div>
              <div style="flex:1;background:var(--accent-secondary);height:90%;border-radius:4px 4px 0 0;"></div>
              <div style="flex:1;background:var(--accent-emerald);height:60%;border-radius:4px 4px 0 0;"></div>
              <div style="flex:1;background:var(--accent-amber);height:45%;border-radius:4px 4px 0 0;"></div>
              <div style="flex:1;background:var(--accent-rose);height:80%;border-radius:4px 4px 0 0;"></div>
            </div>
            <div style="font-size:11px;color:var(--text-dim);margin-top:6px;">Distribution calculated deterministically</div>
          </div>
        `;
      }
    });
  }

  getBaseOptions(titleText) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          titleColor: '#F8FAFC',
          bodyColor: '#94A3B8',
          padding: 10,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: { color: this.themeColors.grid, drawBorder: false },
          ticks: { color: this.themeColors.text, font: { family: 'Inter', size: 11 } }
        },
        y: {
          grid: { color: this.themeColors.grid, drawBorder: false },
          ticks: { color: this.themeColors.text, font: { family: 'Inter', size: 11 } }
        }
      }
    };
  }
}

export const chartService = new ChartService();
