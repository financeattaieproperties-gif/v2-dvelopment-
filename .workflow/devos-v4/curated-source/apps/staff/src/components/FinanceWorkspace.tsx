import React, { useEffect, useState } from 'react';
import { contractPaymentSummary, receiptSummary } from '../../../../packages/staff-contracts/documents.mjs';
import './staff-documents.css';
import type {
  FinanceDeposit,
  HrContract,
  Role,
} from '../../../../packages/staff-contracts/types';

export interface FinanceWorkspaceProps {
  contracts: HrContract[];
  deposits: FinanceDeposit[];
  actorRole: Role;
  lang?: 'en' | 'fa';
  onManageDeposit: (payload: {
    action: 'draft' | 'approve' | 'return' | 'reverse';
    contractId: number;
    installmentId: number;
    depositId?: number;
    amount?: number;
    paymentMethod?: 'Cash' | 'Bank Transfer' | 'Cheque';
    receiptNumber?: string;
    notes?: string;
    reason?: string;
    version?: number;
    paymentDate?: string;
  }) => Promise<unknown>;
  onNotice: (msg: string) => void;
  onError: (err: string) => void;
}

export function FinanceWorkspace({
  contracts,
  deposits,
  actorRole,
  lang = 'en',
  onManageDeposit,
  onNotice,
  onError,
}: FinanceWorkspaceProps) {
  const canDraft = actorRole === 'finance_manager';
  const canApprove = actorRole === 'finance_manager';
  const t = (en: string, fa: string) => lang === 'fa' ? fa : en;
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<FinanceDeposit | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kabul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));

  const [selectedContractId, setSelectedContractId] = useState<number>(
    contracts[0]?.id || 1
  );
  const selectedContract =
    contracts.find((c) => c.id === selectedContractId) || contracts[0];
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<number>(
    selectedContract?.installments.find((i) => i.status !== 'paid')?.id ||
      selectedContract?.installments[0]?.id ||
      1
  );

  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    'Cash' | 'Bank Transfer' | 'Cheque'
  >('Cash');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [reversalReasons, setReversalReasons] = useState<Record<number, string>>({});

  const summary = selectedContract ? contractPaymentSummary(selectedContract, deposits) : null;
  const selectedDeposits = deposits.filter(d => d.contractId === selectedContract?.id);
  const draftCount = selectedDeposits.filter((d) => d.status === 'draft').length;

  // Dashboard 6 KPI aggregates
  const issuedContractsCount = contracts.filter((c) => c.status !== 'draft' && c.status !== 'cancelled').length;
  const postedDeposits = deposits.filter((d) => d.status === 'posted');
  const collectedTotal = postedDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const pendingDeposits = deposits.filter((d) => d.status === 'draft');
  const pendingTotal = pendingDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const overdueInstallments = contracts.flatMap((c) => c.installments).filter((i) => i.status === 'overdue');
  const overdueTotal = overdueInstallments.reduce(
    (sum, i) => sum + Math.max(0, Number(i.scheduledAmount || 0) - Number(i.paidAmount || 0)),
    0
  );

  // Build 6-month cashflow series (Scheduled #0072BC vs Collected #14A850)
  const monthlyCashflow = (() => {
    const now = new Date();
    const months: Array<{ key: string; label: string; scheduled: number; collected: number }> = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      months.push({ key, label, scheduled: 0, collected: 0 });
    }
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const c of contracts) {
      for (const inst of c.installments) {
        const key = (inst.dueDate || c.gregorianDate || '').slice(0, 7);
        const bucket = byKey.get(key);
        if (bucket) bucket.scheduled += Number(inst.scheduledAmount || 0);
      }
    }
    for (const dep of postedDeposits) {
      const key = (dep.paymentDate || dep.postedAt || dep.createdAt || '').slice(0, 7);
      const bucket = byKey.get(key);
      if (bucket) bucket.collected += Number(dep.amount || 0);
    }
    return months;
  })();
  const cashflowMax = Math.max(
    1,
    ...monthlyCashflow.flatMap((m) => [m.scheduled, m.collected])
  );
  const chartW = 560;
  const chartH = 148;
  const padL = 12;
  const padR = 12;
  const padT = 14;
  const padB = 24;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const toX = (idx: number) => padL + (idx / Math.max(1, monthlyCashflow.length - 1)) * plotW;
  const toY = (val: number) => padT + plotH - (val / cashflowMax) * plotH;
  const scheduledPts = monthlyCashflow.map((m, i) => `${toX(i).toFixed(1)},${toY(m.scheduled).toFixed(1)}`);
  const collectedPts = monthlyCashflow.map((m, i) => `${toX(i).toFixed(1)},${toY(m.collected).toFixed(1)}`);
  const scheduledArea = `M ${toX(0).toFixed(1)},${(padT + plotH).toFixed(1)} L ${scheduledPts.join(' L ')} L ${toX(monthlyCashflow.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;
  const collectedArea = `M ${toX(0).toFixed(1)},${(padT + plotH).toFixed(1)} L ${collectedPts.join(' L ')} L ${toX(monthlyCashflow.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  const kpiCards = [
    {
      key: 'issued',
      label: t('Issued Contracts', 'قراردادهای صادرشده'),
      value: issuedContractsCount.toLocaleString(),
      delta: `${contracts.length} total`,
      deltaBg: '#E8F7EE',
      deltaColor: '#14A850',
      stroke: '#0072BC',
      sparkPoints: '2,18 14,15 26,16 38,11 50,9 62,6',
    },
    {
      key: 'collected',
      label: t('Collected Deposits', 'سپرده\u200cهای وصول\u200cشده'),
      value: `$${collectedTotal.toLocaleString()}`,
      delta: `${postedDeposits.length} posted`,
      deltaBg: '#E8F7EE',
      deltaColor: '#14A850',
      stroke: '#14A850',
      sparkPoints: '2,20 14,17 26,14 38,12 50,8 62,4',
    },
    {
      key: 'pending',
      label: t('Pending Approvals', 'در انتظار تأیید'),
      value: pendingDeposits.length.toLocaleString(),
      delta: `$${pendingTotal.toLocaleString()}`,
      deltaBg: '#F1F5F9',
      deltaColor: '#818285',
      stroke: '#818285',
      sparkPoints: '2,12 14,14 26,11 38,15 50,13 62,12',
    },
    {
      key: 'overdue',
      label: t('Overdue', 'معوقه'),
      value: overdueInstallments.length.toLocaleString(),
      delta: overdueInstallments.length > 0 ? `$${overdueTotal.toLocaleString()}` : 'On track',
      deltaBg: overdueInstallments.length > 0 ? '#FEF2F2' : '#E8F7EE',
      deltaColor: overdueInstallments.length > 0 ? '#B91C1C' : '#14A850',
      stroke: overdueInstallments.length > 0 ? '#B91C1C' : '#14A850',
      sparkPoints: overdueInstallments.length > 0 ? '2,18 14,16 26,13 38,14 50,9 62,7' : '2,16 14,16 26,15 38,16 50,15 62,16',
    },
  ];
  useEffect(() => {
    if (selectedContract && !selectedContract.installments.some(i => i.id === selectedInstallmentId))
      setSelectedInstallmentId(selectedContract.installments.find(i => i.status !== 'paid')?.id || selectedContract.installments[0]?.id || 0);
  }, [selectedContract, selectedInstallmentId]);

  const handleDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    setBusy(true);
    try {
      await onManageDeposit({
        action: 'draft',
        contractId: selectedContract.id,
        installmentId: selectedInstallmentId,
        amount: Number(amount),
        paymentMethod,
        receiptNumber,
        notes,
        paymentDate,
      });
      onNotice(
        `Draft deposit (${receiptNumber} — $${Number(amount).toLocaleString()}) submitted for Finance Manager approval.`
      );
      setAmount(0); setReceiptNumber(''); setNotes('');
    } catch (err) {
      onError((err as Error).message);
    } finally { setBusy(false); }
  };

  const handleDepositAction = async (
    dep: FinanceDeposit,
    action: 'approve' | 'return' | 'reverse'
  ) => {
    setBusy(true);
    try {
      const reason = reversalReasons[dep.id] || '';
      await onManageDeposit({
        action,
        contractId: dep.contractId,
        installmentId: dep.installmentId,
        depositId: dep.id,
        reason,
        version: dep.version,
      });
      onNotice(`Deposit ${dep.receiptNumber} updated (${action}).`);
    } catch (err) {
      onError((err as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <section
      className="panel"
      data-testid="finance-workspace"
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}
    >
      <div className="panel-heading" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 14, marginBottom: 16 }}>
        <div>
          <p className="eyebrow" style={{ color: '#818285', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Finance Department • {canApprove ? 'Finance Manager Approval & Ledger' : 'Read-Only Executive Ledger'}
          </p>
          <h2 style={{ color: '#1E293B', marginTop: 2 }}>{t('Installment and payment tracker','پیگیری اقساط و پرداخت‌ها')}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span
            className="badge active"
            style={{ background: '#E6F2FA', color: '#0072BC', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {t('Contracts','قراردادها')}: {contracts.length}
          </span>
          <span
            className="badge closed"
            style={{ background: '#E8F7EE', color: '#14A850', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {t('Posted receipts','رسیدهای ثبت‌شده')}: {selectedDeposits.filter(d => d.status === 'posted').length}
          </span>
          <span
            className="badge pending"
            style={{ background: '#F1F5F9', color: '#818285', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            Pending Draft Deposits: {draftCount}
          </span>
        </div>
      </div>

      {/* Dashboard 6: 4 KPI Cards with inline SVG sparklines + delta pills */}
      <div
        data-testid="finance-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {kpiCards.map((kpi) => (
          <article
            key={kpi.key}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {kpi.label}
              </span>
              <span
                style={{
                  background: kpi.deltaBg,
                  color: kpi.deltaColor,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 999,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {kpi.delta}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
              <strong style={{ color: '#1E293B', fontSize: 22, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {kpi.value}
              </strong>
              <svg width="64" height="24" viewBox="0 0 64 24" aria-hidden="true">
                <polyline
                  fill="none"
                  stroke={kpi.stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={kpi.sparkPoints}
                />
              </svg>
            </div>
          </article>
        ))}
      </div>

      {/* Monthly Cashflow SVG Area Chart (#0072BC Scheduled / #14A850 Collected) */}
      <div
        data-testid="finance-cashflow-chart"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818285' }}>
              {t('Monthly Cashflow (6 Months)', 'جریان نقدی ماهانه (۶ ماه)')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#0072BC' }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#0072BC', display: 'inline-block' }} />
              {t('Scheduled', 'برنامه‌ریزی‌شده')}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#14A850' }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#14A850', display: 'inline-block' }} />
              {t('Collected', 'وصول‌شده')}
            </span>
          </div>
        </div>
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          style={{ width: '100%', height: 150, display: 'block' }}
          role="img"
          aria-label={t('Monthly Cashflow Area Chart', 'نمودار جریان نقدی ماهانه')}
        >
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padT + plotH * (1 - ratio);
            return <line key={ratio} x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#E2E8F0" strokeWidth="1" />;
          })}
          <line x1={padL} y1={padT + plotH} x2={chartW - padR} y2={padT + plotH} stroke="#E2E8F0" strokeWidth="1" />
          <path d={scheduledArea} fill="#E6F2FA" fillOpacity="0.65" />
          <polyline fill="none" stroke="#0072BC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={scheduledPts.join(' ')} />
          <path d={collectedArea} fill="#E8F7EE" fillOpacity="0.7" />
          <polyline fill="none" stroke="#14A850" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={collectedPts.join(' ')} />
          {monthlyCashflow.map((m, i) => (
            <g key={m.key}>
              <circle cx={toX(i)} cy={toY(m.scheduled)} r="3" fill="#0072BC" />
              <circle cx={toX(i)} cy={toY(m.collected)} r="3" fill="#14A850" />
              <text
                x={toX(i)}
                y={chartH - 6}
                textAnchor="middle"
                fill="#818285"
                fontSize="10"
                fontWeight="600"
              >
                {m.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {!contracts.length && <p style={{ color: '#818285' }}>{t('Contracts and installments issued by HR will appear here.','قراردادها و اقساط صادرشده توسط منابع بشری اینجا نمایش داده می‌شود.')}</p>}
      {selectedContract && summary && <>
        <label className="field">{t('Select agreement','انتخاب قرارداد')}<select data-testid="finance-contract-selector" value={selectedContract.id} onChange={e => setSelectedContractId(Number(e.target.value))}>
          {contracts.map(c => <option key={c.id} value={c.id}>{c.contractSerial} — {c.buyers.map(b => b.name).join(', ')} ({c.apartmentNumber})</option>)}
        </select></label>
        <div className="finance-summary">
          <article style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <span style={{ color: '#818285' }}>{t('Agreement value','ارزش قرارداد')}</span>
            <strong style={{ color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{summary.total.toLocaleString()} {summary.currency}</strong>
          </article>
          <article style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <span style={{ color: '#818285' }}>{t('Total paid','مجموع پرداخت‌شده')}</span>
            <strong style={{ color: '#14A850', fontVariantNumeric: 'tabular-nums' }}>{summary.paid.toLocaleString()} {summary.currency}</strong>
          </article>
          <article style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <span style={{ color: '#818285' }}>{t('Remaining balance','باقی‌مانده')}</span>
            <strong style={{ color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{summary.remaining.toLocaleString()} {summary.currency}</strong>
          </article>
        </div>
        <label style={{ color: '#818285', fontVariantNumeric: 'tabular-nums' }}>{t('Payment progress','پیشرفت پرداخت')} {summary.progress}%<progress className="finance-progress" value={summary.progress} max={100}/></label>
      </>}

      {/* Draft Customer Deposit Form (Finance Manager) */}
      {canDraft && selectedContract && (
        <form
          className="panel"
          style={{ marginTop: 14, marginBottom: 18, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10 }}
          onSubmit={handleDraftSubmit}
          data-testid="finance-draft-deposit-form"
        >
          <h3 style={{ marginTop: 0, color: '#1E293B' }}>
            {t('Record received payment','ثبت پرداخت دریافتی')}
          </h3>
          <div className="form-grid">
            <div className="field">
              <label>Select Issued HR Contract</label>
              <select
                value={selectedContract.id}
                onChange={(e) => {
                  const nextId = Number(e.target.value);
                  setSelectedContractId(nextId);
                  const nextC = contracts.find((c) => c.id === nextId);
                  if (nextC?.installments[0]) {
                    setSelectedInstallmentId(nextC.installments[0].id);
                  }
                }}
              >
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractSerial} — {c.buyers.map((b) => b.name).join(', ')} ({c.projectName} {c.apartmentNumber})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Target Installment</label>
              <select
                value={selectedInstallmentId}
                onChange={(e) => setSelectedInstallmentId(Number(e.target.value))}
              >
                {selectedContract.installments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    #{inst.number} {inst.description} (Scheduled: ${inst.scheduledAmount.toLocaleString()} • Paid: ${inst.paidAmount.toLocaleString()} • {inst.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Deposit Amount ({selectedContract.currency})</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as 'Cash' | 'Bank Transfer' | 'Cheque')
                }
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="field">
              <label>Official Receipt Number</label>
              <input
                value={receiptNumber}
                required
                onChange={(e) => setReceiptNumber(e.target.value)}
              />
            </div>
            <label className="field">{t('Payment date','تاریخ پرداخت')}<input type="date" required value={paymentDate} onChange={e => setPaymentDate(e.target.value)}/></label>
            <div className="field">
              <label>Deposit Verification Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 12 }}>
            <button
              type="submit"
              className="button"
              data-testid="submit-draft-deposit-btn"
              style={{ background: '#0072BC', color: '#FFFFFF', border: '1px solid #0072BC', borderRadius: 8 }}
              disabled={busy}
            >
              {busy ? t('Saving…','در حال ذخیره…') : t('Save payment draft','ذخیره پیش‌نویس پرداخت')}
            </button>
          </div>
        </form>
      )}

      {/* Contract Installment Schedules */}
      <h3 style={{ marginTop: 14, marginBottom: 8, color: '#1E293B', fontSize: 15 }}>
        Active HR Contract Installment Schedules ({contracts.length})
      </h3>
      <div
        className="table-scroll"
        style={{
          marginBottom: 18,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contract</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buyer</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Installment</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scheduled</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remaining</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(selectedContract ? [selectedContract] : []).flatMap((c) =>
              c.installments.map((inst) => {
                const remaining = Math.max(0, inst.scheduledAmount - inst.paidAmount);
                const isPaid = inst.status === 'paid';
                const isOverdue = inst.status === 'overdue';
                return (
                  <tr key={`${c.id}-${inst.number}`} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      <strong style={{ color: '#1E293B' }}>{c.contractSerial}</strong>
                      <small style={{ color: '#818285' }}>{c.projectName} • {c.apartmentNumber}</small>
                    </td>
                    <td style={{ color: '#1E293B' }}>{c.buyers.map((b) => b.name).join(', ')}</td>
                    <td>
                      <strong style={{ color: '#1E293B' }}>#{inst.number} {inst.description}</strong>{' '}
                      <span style={{ color: '#818285', fontVariantNumeric: 'tabular-nums' }}>({inst.percentage}%)</span>
                    </td>
                    <td style={{ color: '#818285', fontVariantNumeric: 'tabular-nums' }}>{inst.dueDate || 'Milestone'}</td>
                    <td style={{ color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>${inst.scheduledAmount.toLocaleString()} {c.currency}</td>
                    <td style={{ color: '#14A850', fontVariantNumeric: 'tabular-nums' }}><strong>${inst.paidAmount.toLocaleString()} {c.currency}</strong></td>
                    <td style={{ color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>${remaining.toLocaleString()} {c.currency}</td>
                    <td>
                      <span
                        className={`badge ${inst.status}`}
                        style={{
                          background: isPaid ? '#E8F7EE' : isOverdue ? '#FEF2F2' : '#F1F5F9',
                          color: isPaid ? '#14A850' : isOverdue ? '#B91C1C' : '#818285',
                          border: isOverdue ? '1px solid #FECACA' : '1px solid transparent',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {inst.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Deposits Ledger & Finance Manager Approval Queue */}
      <h3 style={{ marginBottom: 8, color: '#1E293B', fontSize: 15 }}>
        Customer Deposits & Approval Ledger ({deposits.length})
      </h3>
      <div
        className="table-scroll"
        data-testid="finance-deposit-ledger"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receipt #</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contract & Installment</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount & Method</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entered / Approved By</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              {canApprove && <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Finance Manager Action</th>}
            </tr>
          </thead>
          <tbody>
            {selectedDeposits.map((dep) => {
              const isPosted = dep.status === 'posted';
              const isReversedOrReturned = dep.status === 'reversed' || dep.status === 'returned';
              return (
              <tr key={dep.id} data-testid={`deposit-row-${dep.id}`} style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <strong style={{ color: '#1E293B' }}>{dep.receiptNumber}</strong>
                  <small style={{ color: '#818285' }}>{dep.notes}</small>
                  {(dep.status === 'posted' || dep.status === 'reversed') && (
                    <button
                      className="button secondary"
                      type="button"
                      style={{ marginTop: 4, background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#1E293B', borderRadius: 6 }}
                      onClick={() => setReceipt(dep)}
                    >
                      {t('Receipt','رسید')}
                    </button>
                  )}
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <strong style={{ color: '#1E293B' }}>{dep.contractSerial}</strong>
                  <small style={{ color: '#818285' }}>Installment #{dep.installmentNumber}</small>
                </td>
                <td style={{ color: '#1E293B' }}>{dep.customerName}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <strong style={{ color: '#1E293B' }}>${dep.amount.toLocaleString()} {dep.currency}</strong>
                  <small style={{ color: '#818285' }}>{dep.paymentMethod}</small>
                </td>
                <td>
                  <strong style={{ color: '#1E293B' }}>{dep.enteredBy}</strong>
                  <small style={{ color: '#818285' }}>{dep.approvedBy ? `Approved: ${dep.approvedBy}` : 'Awaiting Approval'}</small>
                </td>
                <td>
                  <span
                    className={`badge ${dep.status}`}
                    style={{
                      background: isPosted ? '#E8F7EE' : isReversedOrReturned ? '#FEF2F2' : '#F1F5F9',
                      color: isPosted ? '#14A850' : isReversedOrReturned ? '#B91C1C' : '#818285',
                      border: isReversedOrReturned ? '1px solid #FECACA' : '1px solid transparent',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {dep.status}
                  </span>
                  {dep.reversalReason && (
                    <small style={{ display: 'block', marginTop: 4, color: '#B91C1C' }}>
                      Reason: {dep.reversalReason}
                    </small>
                  )}
                </td>
                {canApprove && (
                  <td>
                    {dep.status === 'draft' && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="button"
                          data-testid={`approve-deposit-btn-${dep.id}`}
                          style={{ background: '#14A850', color: '#FFFFFF', border: '1px solid #14A850', borderRadius: 6 }}
                          onClick={() => handleDepositAction(dep, 'approve')}
                          disabled={busy}
                        >
                          Approve & Post
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          style={{ background: '#FFFFFF', color: '#1E293B', border: '1px solid #E2E8F0', borderRadius: 6 }}
                          onClick={() => handleDepositAction(dep, 'return')}
                          disabled={busy}
                        >
                          Return
                        </button>
                      </div>
                    )}
                    {dep.status === 'posted' && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          placeholder="Reversal reason..."
                          aria-label={t('Reversal reason','دلیل برگشت پرداخت')}
                          value={reversalReasons[dep.id] || ''}
                          onChange={(e) =>
                            setReversalReasons((prev) => ({
                              ...prev,
                              [dep.id]: e.target.value,
                            }))
                          }
                          style={{ padding: '5px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12, color: '#1E293B', background: '#FFFFFF' }}
                        />
                        <button
                          type="button"
                          className="button secondary"
                          data-testid={`reverse-deposit-btn-${dep.id}`}
                          style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 6 }}
                          onClick={() => handleDepositAction(dep, 'reverse')}
                          disabled={busy || !reversalReasons[dep.id]?.trim()}
                        >
                          Reverse Posted Deposit
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {receipt && <PaymentReceipt contract={contracts.find(c => c.id === receipt.contractId)!} payment={receipt} lang={lang} onClose={() => setReceipt(null)}/>}
    </section>
  );
}

function PaymentReceipt({contract, payment, lang, onClose}: {contract:HrContract;payment:FinanceDeposit;lang:'en'|'fa';onClose:()=>void}) {
  const totals=receiptSummary(contract,payment); const t=(en:string,fa:string)=>lang==='fa'?fa:en;
  return <section className="receipt-sheet" data-testid="finance-payment-receipt" dir={lang==='fa'?'rtl':'ltr'}>
    <div className="no-print modal-actions"><button className="button" type="button" onClick={()=>window.print()}>{t('Print / Save PDF','چاپ / ذخیره PDF')}</button><button className="button secondary" type="button" onClick={onClose}>{t('Close','بستن')}</button></div>
    <h2>{t('Attaie Properties — Payment receipt','املاک عطایی — رسید پرداخت')}</h2>
    <strong>{payment.receiptNumber}</strong> <span className="badge">{payment.status}</span>
    <dl>
      <dt>{t('Agreement','قرارداد')}</dt><dd>{contract.contractSerial}</dd>
      <dt>{t('Buyer','خریدار')}</dt><dd>{contract.buyers.map(b=>b.name).join(', ')}</dd>
      <dt>{t('Project / apartment','پروژه / آپارتمان')}</dt><dd>{contract.projectName} / {contract.apartmentNumber}</dd>
      <dt>{t('Installment','قسط')}</dt><dd>{payment.installmentNumber}</dd>
      <dt>{t('Amount received','مبلغ دریافتی')}</dt><dd>{payment.amount.toLocaleString()} {payment.currency}</dd>
      <dt>{t('Payment date / method','تاریخ / روش پرداخت')}</dt><dd>{payment.paymentDate || payment.postedAt?.slice(0,10)} / {payment.paymentMethod}</dd>
      <dt>{t('Recorded by','ثبت‌کننده')}</dt><dd>{payment.enteredBy}</dd>
      {totals.historical && <><dt>{t('Paid at receipt issuance','پرداخت‌شده هنگام صدور رسید')}</dt><dd>{totals.paid?.toLocaleString()} {payment.currency}</dd>
        <dt>{t('Balance at receipt issuance','باقی‌مانده هنگام صدور رسید')}</dt><dd>{totals.remaining?.toLocaleString()} {payment.currency}</dd></>}
    </dl>
    {payment.status==='reversed'&&<p>{t('Reversed receipt','رسید برگشت‌شده')}: {payment.reversalReason}</p>}
    {!totals.historical&&<p>{t('Historical balance was not recorded for this legacy receipt.','باقی‌مانده تاریخی برای این رسید قدیمی ثبت نشده است.')}</p>}
    <p>{payment.notes}</p><p>{t('Finance signature and company seal','امضای مالی و مهر شرکت')}: __________________</p>
  </section>;
}
