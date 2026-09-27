/**
 * DataSense AI - Scenario Simulator Engine
 * 
 * Feature 12: What-If Scenario Simulator
 * 
 * Core Principle: "Keep the mathematics transparent. The user changes an assumption -> formula recalculates the result."
 * 
 * Supports:
 * - Price adjustment (% change)
 * - Quantity / Demand adjustment (% change)
 * - Return rate reduction (% change)
 * - Cost optimization (% change)
 * - Transparent step-by-step mathematical evidence breakdown
 * - Elasticity sensitivity notes
 */

export class SimulatorEngine {
  constructor() {
    this.currentBase = {
      revenue: 1000000,
      quantity: 5240,
      returnsValue: 120000,
      returnRatePct: 8.4,
      cost: 650000
    };
  }

  /**
   * Set base values from active dataset
   */
  setBaselineFromData(records, columns) {
    const revCol = columns.find(c => /revenue/i.test(c));
    const qtyCol = columns.find(c => /quantity|qty/i.test(c));
    const retCol = columns.find(c => /returns/i.test(c));
    const costCol = columns.find(c => /cost/i.test(c));

    let rev = 0;
    let qty = 0;
    let ret = 0;
    let cost = 0;

    records.forEach(r => {
      if (revCol && r[revCol]) rev += Number(r[revCol]) || 0;
      if (qtyCol && r[qtyCol]) qty += Number(r[qtyCol]) || 0;
      if (retCol && r[retCol]) ret += Number(r[retCol]) || 0;
      if (costCol && r[costCol]) cost += Number(r[costCol]) || 0;
    });

    if (rev > 0) {
      this.currentBase.revenue = rev;
      this.currentBase.quantity = qty > 0 ? qty : records.length;
      this.currentBase.cost = cost > 0 ? cost : Math.round(rev * 0.65);
      
      const rate = qty > 0 ? (ret / qty) * 100 : 8.4;
      this.currentBase.returnRatePct = parseFloat(rate.toFixed(1));
      this.currentBase.returnsValue = Math.round(rev * (this.currentBase.returnRatePct / 100));
    }
    return this.currentBase;
  }

  /**
   * Run what-if simulation calculation
   * @param {Object} assumptions { pricePct: 5, quantityPct: -2, returnReductionPct: -10, costReductionPct: 0 }
   */
  simulate(assumptions = {}) {
    const priceDelta = Number(assumptions.pricePct || 0) / 100;
    const qtyDelta = Number(assumptions.quantityPct || 0) / 100;
    const returnReduction = Math.abs(Number(assumptions.returnReductionPct || 0)) / 100;
    const costReduction = Math.abs(Number(assumptions.costReductionPct || 0)) / 100;

    const baseRev = this.currentBase.revenue;
    const baseCost = this.currentBase.cost;
    const baseReturnsVal = this.currentBase.returnsValue;

    // Formula: Revenue' = BaseRev * (1 + priceDelta) * (1 + qtyDelta)
    const simulatedRevenue = Math.round(baseRev * (1 + priceDelta) * (1 + qtyDelta));
    const revenueDiff = simulatedRevenue - baseRev;
    const revenueDiffPct = baseRev > 0 ? ((revenueDiff / baseRev) * 100).toFixed(1) : 0;

    // Returns recovered:
    const recoveredReturnVal = Math.round(baseReturnsVal * returnReduction);
    const newReturnsVal = baseReturnsVal - recoveredReturnVal;

    // Cost saved:
    const savedCost = Math.round(baseCost * costReduction);
    const simulatedCost = baseCost - savedCost;

    // Estimated Profit:
    const baseProfit = baseRev - baseCost;
    const simulatedProfit = simulatedRevenue - simulatedCost + recoveredReturnVal;
    const profitDiff = simulatedProfit - baseProfit;

    // Sensitivity / Consideration notes
    const considerations = [];
    if (priceDelta > 0 && qtyDelta >= 0) {
      considerations.push('A higher price typically softens market demand unless brand inelasticity is demonstrated.');
    } else if (priceDelta < 0 && qtyDelta <= 0) {
      considerations.push('Discounting without volume expansion erodes gross margins quickly.');
    }
    if (returnReduction > 0) {
      considerations.push(`A ${(returnReduction * 100).toFixed(0)}% drop in returns recovers an estimated ₹${recoveredReturnVal.toLocaleString('en-IN')} in merchandise value.`);
    }

    const mathSteps = [
      `1. Base Revenue = ₹${baseRev.toLocaleString('en-IN')}`,
      `2. Price Adjustment (${(priceDelta * 100).toFixed(1)}%): Multiplier = ${(1 + priceDelta).toFixed(3)}`,
      `3. Quantity Adjustment (${(qtyDelta * 100).toFixed(1)}%): Multiplier = ${(1 + qtyDelta).toFixed(3)}`,
      `4. Simulated Revenue = ₹${baseRev.toLocaleString('en-IN')} × ${(1 + priceDelta).toFixed(3)} × ${(1 + qtyDelta).toFixed(3)} = ₹${simulatedRevenue.toLocaleString('en-IN')}`,
      `5. Net Change = ${revenueDiff >= 0 ? '+' : '-'}₹${Math.abs(revenueDiff).toLocaleString('en-IN')} (${revenueDiffPct}%)`,
      returnReduction > 0 ? `6. Recovered Returns = ₹${baseReturnsVal.toLocaleString('en-IN')} × ${(returnReduction * 100).toFixed(0)}% = ₹${recoveredReturnVal.toLocaleString('en-IN')}` : null
    ].filter(Boolean);

    return {
      baseRevenue: baseRev,
      simulatedRevenue,
      revenueDiff,
      revenueDiffPct,
      baseProfit,
      simulatedProfit,
      profitDiff,
      recoveredReturnVal,
      newReturnsVal,
      confidence: Math.abs(priceDelta) > 0.2 ? 'Low' : (Math.abs(priceDelta) > 0.1 ? 'Medium' : 'High'),
      considerations,
      mathSteps,
      disclaimer: 'This is a what-if estimate, not a guaranteed prediction. All calculations are transparently derived from your input assumptions.'
    };
  }
}

export const simulatorEngine = new SimulatorEngine();
