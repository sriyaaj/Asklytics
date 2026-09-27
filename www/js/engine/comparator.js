/**
 * DataSense AI - Comparison Engine
 * 
 * Features 13 & 14: Report Comparison & Comparison Insights
 * 
 * Compares:
 * - Option A: Two distinct files (Dataset A vs Dataset B)
 * - Option B: Two temporal periods (Period A vs Period B, e.g. June vs July)
 * 
 * Computes:
 * - Metric deltas, percentage shifts, and categorized tags (IMPROVEMENT, DECLINE, ATTENTION)
 * - Plain-English comparative summary
 * - Step-by-step evidence proofs
 */

export class ComparatorEngine {
  constructor() {
    this.comparisonResults = null;
  }

  /**
   * Split a single dataset into two periods by date column or equal halves
   */
  splitByPeriods(records, columns) {
    const dateCol = columns.find(c => {
      const sample = records.map(r => r[c]).filter(Boolean);
      return sample.some(v => /^\d{4}-\d{2}-\d{2}$/.test(v) || !isNaN(Date.parse(v)));
    });

    if (dateCol) {
      const sorted = [...records].sort((a, b) => new Date(a[dateCol]) - new Date(b[dateCol]));
      const mid = Math.floor(sorted.length / 2);
      
      const firstDate = sorted[0][dateCol];
      const midDate = sorted[mid - 1][dateCol];
      const lastDate = sorted[sorted.length - 1][dateCol];

      const getPeriodLabel = (dStr) => {
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString('default', { month: 'short', year: 'numeric' });
        }
        return dStr;
      };

      return {
        labelA: `Period 1 (${getPeriodLabel(firstDate)} - ${getPeriodLabel(midDate)})`,
        labelB: `Period 2 (${getPeriodLabel(sorted[mid][dateCol])} - ${getPeriodLabel(lastDate)})`,
        recordsA: sorted.slice(0, mid),
        recordsB: sorted.slice(mid)
      };
    }

    // Default: first half vs second half
    const mid = Math.floor(records.length / 2);
    return {
      labelA: 'Segment A (First Half)',
      labelB: 'Segment B (Second Half)',
      recordsA: records.slice(0, mid),
      recordsB: records.slice(mid)
    };
  }

  /**
   * Compare two record sets
   */
  compareRecordSets(recordsA, recordsB, columns, labelA = 'Dataset A', labelB = 'Dataset B') {
    const revCol = columns.find(c => /revenue|spend|sales/i.test(c));
    const costCol = columns.find(c => /cost/i.test(c));
    const qtyCol = columns.find(c => /quantity|qty/i.test(c));
    const retCol = columns.find(c => /returns/i.test(c));
    const scoreCol = columns.find(c => /score|marks/i.test(c));

    const metrics = [];

    // Helper to calculate sums
    const getSum = (arr, col) => arr.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
    const getAvg = (arr, col) => {
      const valid = arr.map(r => Number(r[col])).filter(n => !isNaN(n));
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    };

    // 1. Primary Metric / Revenue
    if (revCol) {
      const sumA = getSum(recordsA, revCol);
      const sumB = getSum(recordsB, revCol);
      const delta = sumB - sumA;
      const pct = sumA > 0 ? ((delta / sumA) * 100).toFixed(1) : 0;

      metrics.push({
        name: 'Revenue',
        isCurrency: true,
        valA: sumA,
        valB: sumB,
        delta,
        pct: parseFloat(pct),
        unit: '₹',
        type: delta >= 0 ? 'IMPROVEMENT' : 'DECLINE',
        evidence: `(${sumB.toLocaleString('en-IN')} - ${sumA.toLocaleString('en-IN')}) / ${sumA.toLocaleString('en-IN')} × 100 = ${pct}%`
      });
    }

    // 2. Orders / Quantity / Records
    const totalA = qtyCol ? getSum(recordsA, qtyCol) : recordsA.length;
    const totalB = qtyCol ? getSum(recordsB, qtyCol) : recordsB.length;
    const qtyDelta = totalB - totalA;
    const qtyPct = totalA > 0 ? ((qtyDelta / totalA) * 100).toFixed(1) : 0;

    metrics.push({
      name: qtyCol ? 'Volume / Orders' : 'Records Sample',
      isCurrency: false,
      valA: totalA,
      valB: totalB,
      delta: qtyDelta,
      pct: parseFloat(qtyPct),
      unit: '',
      type: qtyDelta >= 0 ? 'IMPROVEMENT' : 'DECLINE',
      evidence: `(${totalB} - ${totalA}) / ${totalA} × 100 = ${qtyPct}%`
    });

    // 3. Profit
    if (revCol && costCol) {
      const profA = getSum(recordsA, revCol) - getSum(recordsA, costCol);
      const profB = getSum(recordsB, revCol) - getSum(recordsB, costCol);
      const profDelta = profB - profA;
      const profPct = profA > 0 ? ((profDelta / profA) * 100).toFixed(1) : 0;

      metrics.push({
        name: 'Gross Profit',
        isCurrency: true,
        valA: profA,
        valB: profB,
        delta: profDelta,
        pct: parseFloat(profPct),
        unit: '₹',
        type: profDelta >= 0 ? 'IMPROVEMENT' : 'DECLINE',
        evidence: `(${profB.toLocaleString('en-IN')} - ${profA.toLocaleString('en-IN')}) / ${profA.toLocaleString('en-IN')} × 100 = ${profPct}%`
      });
    }

    // 4. Returns Rate or Score
    if (retCol && qtyCol) {
      const returnsA = getSum(recordsA, retCol);
      const returnsB = getSum(recordsB, retCol);
      const rateA = totalA > 0 ? (returnsA / totalA) * 100 : 0;
      const rateB = totalB > 0 ? (returnsB / totalB) * 100 : 0;
      const rateDelta = rateB - rateA;

      metrics.push({
        name: 'Return Rate',
        isCurrency: false,
        valA: parseFloat(rateA.toFixed(1)),
        valB: parseFloat(rateB.toFixed(1)),
        delta: parseFloat(rateDelta.toFixed(1)),
        pct: parseFloat(rateDelta.toFixed(1)),
        isPercentagePoint: true,
        unit: '%',
        type: rateDelta > 0.5 ? 'ATTENTION' : (rateDelta < -0.5 ? 'IMPROVEMENT' : 'NEUTRAL'),
        evidence: `${rateB.toFixed(1)}% - ${rateA.toFixed(1)}% = ${rateDelta > 0 ? '+' : ''}${rateDelta.toFixed(1)} percentage points`
      });
    } else if (scoreCol) {
      const avgA = getAvg(recordsA, scoreCol);
      const avgB = getAvg(recordsB, scoreCol);
      const scoreDelta = avgB - avgA;
      const scorePct = avgA > 0 ? ((scoreDelta / avgA) * 100).toFixed(1) : 0;

      metrics.push({
        name: 'Average Score',
        isCurrency: false,
        valA: parseFloat(avgA.toFixed(1)),
        valB: parseFloat(avgB.toFixed(1)),
        delta: parseFloat(scoreDelta.toFixed(1)),
        pct: parseFloat(scorePct),
        unit: 'pts',
        type: scoreDelta >= 0 ? 'IMPROVEMENT' : 'DECLINE',
        evidence: `(${avgB.toFixed(1)} - ${avgA.toFixed(1)}) / ${avgA.toFixed(1)} × 100 = ${scorePct}%`
      });
    }

    // Generate narrative summary
    const revMetric = metrics.find(m => m.name === 'Revenue');
    const volMetric = metrics.find(m => m.name.includes('Volume'));
    const retMetric = metrics.find(m => m.name === 'Return Rate');

    let narrative = `${labelB} compared with ${labelA}: `;
    if (revMetric) {
      narrative += `Revenue changed by ${revMetric.pct > 0 ? '+' : ''}${revMetric.pct}%. `;
    }
    if (volMetric) {
      narrative += `Order volume shifted by ${volMetric.pct > 0 ? '+' : ''}${volMetric.pct}%. `;
    }
    if (retMetric) {
      narrative += `Return rate shifted by ${retMetric.delta > 0 ? '+' : ''}${retMetric.delta} percentage points.`;
    }

    const result = {
      labelA,
      labelB,
      metrics,
      narrative,
      insights: metrics.map(m => ({
        tag: m.type,
        name: m.name,
        badgeText: m.isPercentagePoint ? `${m.delta > 0 ? '+' : ''}${m.delta} percentage pts` : `${m.pct > 0 ? '+' : ''}${m.pct}%`
      }))
    };

    this.comparisonResults = result;
    return result;
  }
}

export const comparatorEngine = new ComparatorEngine();
