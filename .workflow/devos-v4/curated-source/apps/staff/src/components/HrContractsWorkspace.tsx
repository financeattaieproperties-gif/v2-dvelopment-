import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { reconcileInstallments } from '../../../../packages/staff-contracts/workflow.mjs';
import { agreementVerificationUrl } from '../../../../packages/staff-contracts/documents.mjs';
import { HrProjectPreparation, type PreparationPayload } from './HrProjectPreparation';
import { StaffPhotoUpload, type UploadStaffFile } from './StaffPhotoUpload';
import './staff-documents.css';
import type {
  ContractBuyer,
  HrContract,
  InventoryProject,
  Lead,
  Role,
} from '../../../../packages/staff-contracts/types';

export interface HrContractsWorkspaceProps {
  contracts: HrContract[];
  projects: InventoryProject[];
  closedDeals: Lead[];
  actorRole: Role;
  lang?: 'en' | 'fa';
  onUpload?: UploadStaffFile;
  onSavePreparation?: (projectId: number, payload: PreparationPayload) => Promise<unknown>;
  onAmendContract?: (id: number, payload: { version: number; clauses: string[]; notes: string; reason: string }) => Promise<HrContract>;
  onIssueContract: (payload: {
    projectId: number;
    apartmentId: number;
    buyers: ContractBuyer[];
    installments: Array<{ description: string; percentage: number; dueDate: string | null }>;
    salesAgentName: string;
    clauses: string[];
    notes: string;
    draft?: boolean;
    contractId?: number;
    version?: number;
  }) => Promise<HrContract>;
  onNotice: (msg: string) => void;
  onError: (err: string) => void;
}

export function HrContractsWorkspace({
  contracts,
  projects,
  closedDeals,
  actorRole,
  lang = 'en',
  onUpload,
  onSavePreparation,
  onAmendContract,
  onIssueContract,
  onNotice,
  onError,
}: HrContractsWorkspaceProps) {
  const canIssue = actorRole === 'manager';
  const t = (en: string, fa: string) => lang === 'fa' ? fa : en;
  const [busy, setBusy] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const [qrError, setQrError] = useState('');
  const [draftContract, setDraftContract] = useState<{id:number;version:number}|null>(null);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [amendmentNotes, setAmendmentNotes] = useState('');
  const [amendmentClauses, setAmendmentClauses] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedContract, setSelectedContract] = useState<HrContract | null>(
    contracts[0] || null
  );
  const [selectedHandoffId, setSelectedHandoffId] = useState<number | null>(
    closedDeals[0]?.id ?? null
  );

  useEffect(() => {
    if (closedDeals.length === 0) {
      setSelectedHandoffId(null);
    } else if (!closedDeals.some((d) => d.id === selectedHandoffId)) {
      setSelectedHandoffId(closedDeals[0].id);
    }
  }, [closedDeals, selectedHandoffId]);

  const selectedHandoff =
    closedDeals.find((d) => d.id === selectedHandoffId) || closedDeals[0] || null;
  const handoffProject = selectedHandoff
    ? projects.find((p) => p.id === (selectedHandoff.projectId || selectedHandoff.deal?.projectId))
    : undefined;
  const handoffApartment = handoffProject
    ? handoffProject.apartments.find(
        (a) => a.id === (selectedHandoff?.apartmentId || selectedHandoff?.deal?.apartmentId)
      )
    : undefined;

  // Wizard state
  const [projectId, setProjectId] = useState<number>(projects[0]?.id || 1);
  const selectedProject = projects.find((p) => p.id === projectId) || projects[0];
  const eligibleApartments =
    selectedProject?.apartments.filter((a) => a.status !== 'sold' && (!a.kind || a.kind === 'apartment')) || [];
  const [apartmentId, setApartmentId] = useState<number>(
    eligibleApartments[0]?.id || selectedProject?.apartments[1]?.id || 1
  );
  const selectedApartment =
    selectedProject?.apartments.find((a) => a.id === apartmentId) ||
    eligibleApartments[0] ||
    selectedProject?.apartments[0];

  const [salesAgentName, setSalesAgentName] = useState('');
  const [buyers, setBuyers] = useState<ContractBuyer[]>([
    {
      name: '',
      fatherName: '',
      grandfatherName: '',
      tazkiraNumber: '',
      phone: '',
      address: '',
      photo3x4Url: '',
      tazkiraPhotoUrl: '',
    },
  ]);

  const [installments, setInstallments] = useState<
    Array<{ description: string; percentage: number; dueDate: string | null }>
  >([
    { description: '', percentage: 100, dueDate: null },
  ]);

  const [clauses, setClauses] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (selectedContract) setSelectedContract(contracts.find(c => c.id === selectedContract.id) || selectedContract);
  }, [contracts]);
  useEffect(() => {
    let active = true; setQrImage(''); setQrError('');
    if (!selectedContract?.verificationToken && !selectedContract?.verificationUrl) return;
    let url: string;
    try { url = selectedContract.verificationToken ? agreementVerificationUrl(window.location.origin, selectedContract.verificationToken) : selectedContract.verificationUrl!; }
    catch { setQrError('Verification link unavailable.'); return; }
    QRCode.toDataURL(url, { width: 240, margin: 4, errorCorrectionLevel: 'M' }).then(value => { if (active) setQrImage(value); })
      .catch(() => { if (active) setQrError('Verification QR could not be generated.'); });
    return () => { active = false; };
  }, [selectedContract?.id, selectedContract?.verificationToken, selectedContract?.verificationUrl]);

  const totalPct = installments.reduce((sum, i) => sum + Number(i.percentage || 0), 0);

  const handleSelectDealHandoff = (lead: Lead) => {
    if (lead.projectId) setProjectId(lead.projectId);
    if (lead.apartmentId) setApartmentId(lead.apartmentId);
    if (lead.deal?.salesAgent) setSalesAgentName(lead.deal.salesAgent);
    setBuyers([
      {
        name: lead.customerName || 'Buyer',
        fatherName: '',
        grandfatherName: '',
        tazkiraNumber: '',
        phone: lead.phone,
        address: '',
        photo3x4Url: lead.deal?.buyerPhotoUrl || '',
        tazkiraPhotoUrl: lead.deal?.tazkiraPhotoUrl || '',
      },
    ]);
    setStep(1);
    setShowWizard(true);
  };

  const handleIssue = async (draft = false) => {
    setBusy(true);
    try {
      if (!selectedApartment || !selectedProject) throw new Error(t('Select a project and apartment.','پروژه و آپارتمان انتخاب کنید.'));
      if (!selectedProject.sellers?.length || !selectedProject.constructionCompany?.representativeName)
        throw new Error(t('Save the sellers and construction representative first.','ابتدا مشخصات فروشندگان و نماینده شرکت را ذخیره کنید.'));
      if (buyers.some(b => !b.name.trim() || !b.fatherName.trim() || !b.tazkiraNumber.trim() || !b.phone.trim() || !b.address.trim() || !b.photo3x4Url))
        throw new Error(t('Complete every buyer’s identity, contact, address and portrait.','هویت، تماس، آدرس و عکس هر خریدار را تکمیل کنید.'));
      if (installments.some(i => !i.description.trim())) throw new Error(t('Describe each installment.','شرح هر قسط را وارد کنید.'));
      reconcileInstallments(selectedApartment.totalPrice, installments);
      const created = await onIssueContract({
        projectId,
        apartmentId: selectedApartment?.id || apartmentId,
        buyers,
        installments,
        salesAgentName,
        clauses,
        notes,
        draft,
        ...(draftContract ? {contractId:draftContract.id,version:draftContract.version} : {}),
      });
      setSelectedContract(created);
      setShowWizard(false);
      onNotice(
        draft ? t('Agreement draft saved.','پیش‌نویس قرارداد ذخیره شد.') : `Contract ${created.contractSerial} issued directly by HR Manager and synchronized to Finance installment ledger.`
      );
    } catch (e) {
      onError((e as Error).message);
    } finally { setBusy(false); }
  };

  const verificationChecks = selectedHandoff
    ? [
        {
          key: 'buyerPhoto',
          label: t('Buyer Photo (3×4)', 'عکس خریدار (۳×۴)'),
          verified: Boolean(selectedHandoff.deal?.buyerPhotoUrl),
          detail: selectedHandoff.deal?.buyerPhotoUrl
            ? t('Portrait attached from Sales handoff', 'عکس از بخش فروش ضمیمه شده است')
            : t('Upload 3×4 portrait in Step 2', 'عکس ۳×۴ را در مرحله دوم بارگذاری کنید'),
          previewUrl: selectedHandoff.deal?.buyerPhotoUrl,
        },
        {
          key: 'tazkira',
          label: t('Tazkira', 'تذکره'),
          verified: Boolean(selectedHandoff.deal?.tazkiraPhotoUrl),
          detail: selectedHandoff.deal?.tazkiraPhotoUrl
            ? t('Tazkira document attached', 'سند تذکره ضمیمه شده است')
            : t('Tazkira scan pending attachment', 'اسکن تذکره در انتظار ضمیمه'),
          previewUrl: selectedHandoff.deal?.tazkiraPhotoUrl,
        },
        {
          key: 'sellers',
          label: t('Sellers', 'فروشندگان'),
          verified: Boolean(handoffProject?.sellers?.length),
          detail: handoffProject?.sellers?.length
            ? handoffProject.sellers.map((s) => s.name).join(', ')
            : t('Save project sellers in preparation', 'فروشندگان پروژه را در آماده‌سازی ثبت کنید'),
        },
        {
          key: 'company',
          label: t('Company', 'شرکت ساختمانی'),
          verified: Boolean(handoffProject?.constructionCompany?.representativeName),
          detail: handoffProject?.constructionCompany?.representativeName
            ? `${handoffProject.constructionCompany.companyName} (${handoffProject.constructionCompany.representativeName})`
            : t('Save construction representative', 'نماینده شرکت ساختمانی را ثبت کنید'),
        },
        {
          key: 'boundaries',
          label: t('Boundaries', 'حدود اربعه'),
          verified: Boolean(
            handoffApartment?.boundaryNorth &&
              handoffApartment?.boundarySouth &&
              handoffApartment?.boundaryEast &&
              handoffApartment?.boundaryWest
          ),
          detail: handoffApartment
            ? `N: ${handoffApartment.boundaryNorth || '—'} · S: ${handoffApartment.boundarySouth || '—'} · E: ${handoffApartment.boundaryEast || '—'} · W: ${handoffApartment.boundaryWest || '—'}`
            : t('Unit boundaries pending selection', 'حدود اربعه واحد در انتظار انتخاب'),
        },
      ]
    : [];

  return (
    <section
      className="panel"
      data-testid="hr-contracts-workspace"
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}
    >
      {canIssue && onSavePreparation && <HrProjectPreparation projects={projects} onSave={onSavePreparation} onUpload={onUpload} onError={onError} onNotice={onNotice} lang={lang} />}
      <div className="panel-heading" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 14, marginBottom: 16 }}>
        <div>
          <p className="eyebrow" style={{ color: '#818285', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            HR Department • Bilingual Pre-Sale Apartment Contracts
          </p>
          <h2 style={{ color: '#1E293B', marginTop: 2 }}>{t('Deal agreements and installments','قرارداد معاملات و اقساط')}</h2>
        </div>
        {canIssue && (
          <div className="heading-actions">
            <button
              type="button"
              className="button"
              data-testid="open-hr-contract-wizard-btn"
              style={{ background: '#0072BC', color: '#FFFFFF', border: '1px solid #0072BC', borderRadius: 8 }}
              onClick={() => {
                setStep(1);
                setDraftContract(null);
                setShowWizard(!showWizard);
              }}
            >
              {showWizard ? 'Close Contract Wizard' : '+ New Deal Contract (4-Step Wizard)'}
            </button>
          </div>
        )}
      </div>

      {/* Dashboard 5: Pending Contract Handoffs Split-View (Left Queue + Right Verification Drawer) */}
      {closedDeals.length > 0 && (
        <div
          data-testid="hr-handoffs-split-view"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: 16,
            marginBottom: 18,
            alignItems: 'start',
          }}
        >
          {/* Left Queue: pending_contract handoffs */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818285' }}>
                {t('Pending Contract Queue', 'صف قراردادهای در انتظار')}
              </span>
              <span
                style={{
                  background: '#F1F5F9',
                  color: '#818285',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {closedDeals.length} pending_contract
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {closedDeals.map((d) => {
                const isSelected = selectedHandoff?.id === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedHandoffId(d.id)}
                    style={{
                      textAlign: lang === 'fa' ? 'right' : 'left',
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: isSelected ? '#E6F2FA' : '#FFFFFF',
                      border: isSelected ? '1px solid #0072BC' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <strong style={{ color: '#1E293B', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                        {d.deal?.dealSerial || d.serial}
                      </strong>
                      <span
                        style={{
                          background: '#F1F5F9',
                          color: '#818285',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 999,
                        }}
                      >
                        pending_contract
                      </span>
                    </div>
                    <div style={{ color: '#1E293B', fontSize: 13, fontWeight: 500, marginTop: 3 }}>
                      {d.customerName}
                    </div>
                    <div style={{ color: '#818285', fontSize: 12, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                      {d.projectName || d.deal?.projectCode || '—'} {d.apartmentNumber || d.deal?.apartmentNumber || ''}
                      {d.deal?.amount ? ` · ${d.deal.amount} ${d.deal.currency || 'USD'}` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Verification Drawer */}
          {selectedHandoff && (
            <div
              data-testid="hr-verification-drawer"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818285' }}>
                    {t('Verification Drawer', 'بررسی مدارک قرارداد')}
                  </span>
                  <h3 style={{ margin: '2px 0 0', color: '#1E293B', fontSize: 15 }}>
                    {selectedHandoff.customerName} — {selectedHandoff.deal?.dealSerial || selectedHandoff.serial}
                  </h3>
                  <small style={{ color: '#818285', fontSize: 12 }}>
                    {selectedHandoff.phone} · {t('Sales Advisor', 'مشاور فروش')}: {selectedHandoff.deal?.salesAgent || '—'}
                  </small>
                </div>
                {canIssue && (
                  <button
                    type="button"
                    className="button"
                    data-testid="drawer-issue-contract-btn"
                    style={{ background: '#0072BC', color: '#FFFFFF', border: '1px solid #0072BC', borderRadius: 8, fontWeight: 600 }}
                    onClick={() => handleSelectDealHandoff(selectedHandoff)}
                  >
                    {t('Issue Contract', 'صدور قرارداد')}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {verificationChecks.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                      background: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      {item.previewUrl && (
                        <img
                          src={item.previewUrl}
                          alt={item.label}
                          style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid #E2E8F0' }}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: '#818285', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.detail}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: item.verified ? '#E8F7EE' : '#F1F5F9',
                        color: item.verified ? '#14A850' : '#818285',
                      }}
                    >
                      {item.verified ? t('Verified', 'تأیید شده') : t('Pending', 'در انتظار')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showWizard && canIssue && (
        <div
          className="panel"
          style={{ marginBottom: 18, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10 }}
          data-testid="hr-contract-wizard"
        >
          <div className="wizard-steps">
            {[
              { s: 1 as const, label: '1. Project & Apartment' },
              { s: 2 as const, label: '2. Buyer & 3×4 Portrait' },
              { s: 3 as const, label: '3. 100% Installments' },
              { s: 4 as const, label: '4. Review & Direct Issue' },
            ].map((item) => (
              <button
                key={item.s}
                type="button"
                className={`wizard-step ${step === item.s ? 'active' : ''}`}
                onClick={() => setStep(item.s)}
              >
                <span className="wizard-step-num">{item.s}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {step === 1 && (
            <div className="form-grid" data-testid="hr-wizard-step-1">
              <label className="field"><span>{t('Select Pre-Sale Project (Manager Inventory)','?????? ????? ??????? ???? ????')}</span><select
                  value={projectId}
                  onChange={(e) => {
                    const nextProjId = Number(e.target.value);
                    setProjectId(nextProjId);
                    const nextProj = projects.find((p) => p.id === nextProjId);
                    const firstAvail = nextProj?.apartments.find((a) => a.status !== 'sold');
                    if (firstAvail) setApartmentId(firstAvail.id);
                  }}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select></label>
              <label className="field"><span>{t('Select Apartment Unit','?????? ????????')}</span><select
                  value={selectedApartment?.id || ''}
                  onChange={(e) => setApartmentId(Number(e.target.value))}
                >
                  {eligibleApartments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.unitNumber} (Floor {a.floor} • {a.areaSqm} m² • ${a.totalPrice.toLocaleString()} • {a.status})
                    </option>
                  ))}
                </select></label>
              <label className="field"><span>{t('Closing Sales Agent','??????? ????')}</span><input
                  value={salesAgentName}
                  onChange={(e) => setSalesAgentName(e.target.value)}
                /></label>

              {selectedApartment && selectedProject && (
                <div className="field full" style={{ background: 'var(--surface)', padding: 12, borderRadius: 8 }}>
                  <strong>Auto-Populated Inventory Specifications:</strong>
                  <p style={{ margin: '4px 0', fontSize: 13 }}>
                    Unit <strong>{selectedApartment.unitNumber}</strong> ({selectedApartment.serialNumber}) • Floor {selectedApartment.floor} • {selectedApartment.rooms} Rooms • {selectedApartment.areaSqm} m² • Direction: {selectedApartment.direction} • Total: <strong>${selectedApartment.totalPrice.toLocaleString()} {selectedApartment.currency}</strong> (${selectedApartment.pricePerSqm}/m²)
                  </p>
                  <small>
                    Boundaries — North: {selectedApartment.boundaryNorth} | South: {selectedApartment.boundarySouth} | East: {selectedApartment.boundaryEast} | West: {selectedApartment.boundaryWest}
                  </small>
                </div>
              )}

              <div className="modal-actions full">
                <button type="button" className="button" onClick={() => setStep(2)}>
                  Next: Buyer Info & 3×4 Portrait
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div data-testid="hr-wizard-step-2">
              <div className="panel-heading">
                <h3>Buyer Identity & 3×4 Portrait ({buyers.length})</h3>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setBuyers((prev) => [
                      ...prev,
                      {
                        name: '',
                        fatherName: '',
                        grandfatherName: '',
                        tazkiraNumber: '',
                        phone: '',
                        address: '',
                        photo3x4Url: '',
                      },
                    ])
                  }
                >
                  + Add Co-Buyer
                </button>
              </div>
              {buyers.map((b, idx) => (
                <div key={idx} className="form-grid" style={{ marginBottom: 12 }}>
                  <label className="field"><span>Buyer #{idx + 1} Full Name</span><input
                      value={b.name}
                      onChange={(e) => {
                        const next = [...buyers];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setBuyers(next);
                      }}
                    /></label>
                  <label className="field"><span>{t('Father Name','??? ???')}</span><input
                      value={b.fatherName}
                      onChange={(e) => {
                        const next = [...buyers];
                        next[idx] = { ...next[idx], fatherName: e.target.value };
                        setBuyers(next);
                      }}
                    /></label>
                  <label className="field"><span>{t('Grandfather Name','??? ?? / ????')}</span><input
                      value={b.grandfatherName}
                      onChange={(e) => {
                        const next = [...buyers];
                        next[idx] = { ...next[idx], grandfatherName: e.target.value };
                        setBuyers(next);
                      }}
                    /></label>
                  <label className="field"><span>{t('Tazkira Number','????? ?????')}</span><input
                      value={b.tazkiraNumber}
                      onChange={(e) => {
                        const next = [...buyers];
                        next[idx] = { ...next[idx], tazkiraNumber: e.target.value };
                        setBuyers(next);
                      }}
                    /></label>
                  <label className="field"><span>{t('Phone Number','????? ????')}</span><input
                      value={b.phone}
                      onChange={(e) => {
                        const next = [...buyers];
                        next[idx] = { ...next[idx], phone: e.target.value };
                        setBuyers(next);
                      }}
                    /></label>
                  <label className="field"><span>{t('Residential Address','???? ????')}</span><input
                      value={b.address}
                      onChange={(e) => {
                        const next = [...buyers];
                        next[idx] = { ...next[idx], address: e.target.value };
                        setBuyers(next);
                      }}
                    /></label>
                  <StaffPhotoUpload label={t('Buyer portrait (3×4)','عکس خریدار (۳×۴)')} value={b.photo3x4Url || ''} purpose="buyer_portrait" lang={lang} onUpload={onUpload}
                    onChange={url => setBuyers(buyers.map((buyer, i) => i === idx ? {...buyer, photo3x4Url: url} : buyer))} />
                  <label className="field">{t('Birth date','تاریخ تولد')}<input type="date" value={b.birthDate || ''} onChange={e => setBuyers(buyers.map((buyer,i) => i===idx ? {...buyer,birthDate:e.target.value} : buyer))}/></label>
                  <label className="field">{t('Permanent residence','سکونت اصلی')}<input value={b.permanentAddress || ''} onChange={e => setBuyers(buyers.map((buyer,i) => i===idx ? {...buyer,permanentAddress:e.target.value} : buyer))}/></label>
                  {buyers.length > 1 && <button className="button secondary" type="button" onClick={() => setBuyers(buyers.filter((_, i) => i !== idx))}>{t('Remove buyer','حذف خریدار')}</button>}
                </div>
              ))}
              <div className="modal-actions">
                <button type="button" className="button secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className="button" onClick={() => setStep(3)}>
                  Next: 100% Installment Schedule
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div data-testid="hr-wizard-step-3">
              <div className="panel-heading">
                <h3>
                  Installment Schedule (Total: {totalPct}% — Must Equal 100% of $
                  {(selectedApartment?.totalPrice || 0).toLocaleString()})
                </h3>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setInstallments((prev) => [
                      ...prev,
                      { description: '', percentage: 0, dueDate: null },
                    ])
                  }
                >
                  + Add Installment Row
                </button>
              </div>
              {installments.map((inst, idx) => {
                let amt = Math.round(((selectedApartment?.totalPrice || 0) * Number(inst.percentage || 0))) / 100;
                try { amt = reconcileInstallments(selectedApartment?.totalPrice || 0, installments)[idx].scheduledAmount; } catch { /* Reconcile again after percentages total 100%. */ }
                return (
                  <div key={idx} className="form-grid" style={{ marginBottom: 10 }}>
                    <label className="field"><span>{t('Milestone Description','??? ???')}</span><input
                        value={inst.description}
                        onChange={(e) => {
                          const next = [...installments];
                          next[idx] = { ...next[idx], description: e.target.value };
                          setInstallments(next);
                        }}
                      /></label>
                    <label className="field"><span>Percentage (%) — Scheduled: ${amt.toLocaleString()}</span><input
                        type="number"
                        min={0.01}
                        step="0.01"
                        max={100}
                        value={inst.percentage}
                        onChange={(e) => {
                          const next = [...installments];
                          next[idx] = { ...next[idx], percentage: Number(e.target.value) };
                          setInstallments(next);
                        }}
                      /></label>
                    <label className="field"><span>{t('Due Date','????? ??????')}</span><input
                        type="date"
                        value={inst.dueDate || ''}
                        onChange={(e) => {
                          const next = [...installments];
                          next[idx] = { ...next[idx], dueDate: e.target.value || null };
                          setInstallments(next);
                        }}
                      /></label>
                    {installments.length > 1 && <button className="button secondary" type="button" onClick={() => setInstallments(installments.filter((_, i) => i !== idx))}>{t('Remove installment','حذف قسط')}</button>}
                  </div>
                );
              })}
              <div className="modal-actions">
                <button type="button" className="button secondary" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="button" className="button" onClick={() => setStep(4)}>
                  Next: Review & Direct Issue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div data-testid="hr-wizard-step-4">
              <h3>{t('Review and issue agreement','بررسی و صدور قرارداد')}</h3>
              <label className="field">{t('Agreed clauses (one per line)','شرایط توافق‌شده (هر مورد در یک سطر)')}<textarea rows={5} value={clauses.join('\n')} onChange={e => setClauses(e.target.value.split('\n'))}/></label>
              <div className="field full" style={{ marginTop: 10 }}>
                <label>Contract Notes / Special Conditions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="modal-actions" style={{ marginTop: 14 }}>
                <button type="button" className="button secondary" onClick={() => setStep(3)}>
                  Back
                </button>
                <button
                  type="button"
                  className="button"
                  data-testid="issue-hr-contract-btn"
                  style={{ background: '#0072BC', color: '#FFFFFF', border: '1px solid #0072BC', borderRadius: 8 }}
                  onClick={() => void handleIssue()}
                  disabled={busy || totalPct !== 100 || !selectedApartment}
                >
                  {busy ? t('Issuing…','در حال صدور…') : t('Issue agreement and send installments to Finance','صدور قرارداد و ارسال اقساط به مالی')}
                </button>
                <button type="button" className="button secondary" disabled={busy || totalPct !== 100 || !selectedApartment} onClick={() => void handleIssue(true)}>{t('Save agreement draft','ذخیره پیش‌نویس قرارداد')}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Issued Contracts List */}
      <div
        className="table-scroll"
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
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contract Serial</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project & Apartment</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buyer(s)</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Price</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Installments</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ color: '#818285', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => {
              const isIssuedOrAmended = c.status === 'issued' || c.status === 'amended';
              const isCancelled = c.status === 'cancelled';
              return (
              <tr key={c.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <strong style={{ color: '#1E293B' }}>{c.contractSerial}</strong>
                  <small style={{ color: '#818285' }}>{c.gregorianDate} ({c.jalaliDate})</small>
                </td>
                <td>
                  <strong style={{ color: '#1E293B' }}>{c.projectName} — {c.apartmentNumber}</strong>
                  <small style={{ color: '#818285' }}>Floor {c.floor} • {c.areaSqm} m² • {c.direction}</small>
                </td>
                <td>
                  <strong style={{ color: '#1E293B' }}>{c.buyers.map((b) => b.name).join(', ')}</strong>
                  <small style={{ color: '#818285' }}>Tazkira: {c.buyers.map((b) => b.tazkiraNumber).join(', ')}</small>
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <strong style={{ color: '#1E293B' }}>${c.totalPrice.toLocaleString()} {c.currency}</strong>
                  <small style={{ color: '#818285' }}>${c.pricePerSqm}/m²</small>
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums', color: '#1E293B' }}>
                  {c.installments.filter((i) => i.status === 'paid').length}/{c.installments.length} Paid
                </td>
                <td>
                  <span
                    className={`badge ${c.status}`}
                    style={{
                      background: isIssuedOrAmended ? '#E8F7EE' : isCancelled ? '#FEF2F2' : '#F1F5F9',
                      color: isIssuedOrAmended ? '#14A850' : isCancelled ? '#B91C1C' : '#818285',
                      border: isCancelled ? '1px solid #FECACA' : '1px solid transparent',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {c.status} (v{c.amendmentVersion})
                  </span>
                </td>
                <td>
                  {canIssue && c.status === 'draft' && <button type="button" className="button" onClick={() => {
                    setProjectId(c.projectId); setApartmentId(c.apartmentId); setBuyers(structuredClone(c.buyers));
                    setInstallments(c.installments.map(i=>({description:i.description,percentage:i.percentage,dueDate:i.dueDate})));
                    setClauses([...c.clauses]);setNotes(c.notes);setSalesAgentName(c.salesAgentName);
                    setDraftContract({id:c.id,version:c.version});setStep(1);setShowWizard(true);
                  }}>{t('Resume draft','ادامه پیش‌نویس')}</button>}
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setSelectedContract(c)}
                  >
                    View Two-Page A4 Contract
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Two-Page A4 Bilingual Contract Print Sheet */}
      {selectedContract && selectedContract.constructionSnapshot && (
        <div className="contract-print-sheet" data-testid="bilingual-contract-print-sheet">
          {selectedContract.status === 'draft' && <h2>{t('DRAFT — not issued','پیش‌نویس — صادر نشده')}</h2>}
          <div className="panel-heading no-print" style={{ marginBottom: 14 }}>
            <div>
              <strong>Two-Page A4 Bilingual Deal Contract Preview: {selectedContract.contractSerial}</strong>
              <p style={{ margin: 0, fontSize: 12 }}>
                Ready for A4 printing with Seller, Construction Company, Buyer 3×4 Portrait, 4 Boundaries, and 100% Installment Schedule.
              </p>
            </div>
            <button
              type="button"
              className="button"
              onClick={() => window.print()}
            >
              Print A4 Contract
            </button>
          </div>
          {canIssue && onAmendContract && selectedContract.status !== 'draft' && selectedContract.status !== 'cancelled' && <details className="no-print panel">
            <summary>{t('Amend agreement terms','اصلاح شرایط قرارداد')}</summary>
            <p>{t('Party identities and payment schedules remain protected. The prior agreement version is retained.','هویت طرفین و برنامه اقساط محفوظ می‌ماند. نسخه قبلی قرارداد نگهداری می‌شود.')}</p>
            <form onSubmit={async e => {e.preventDefault();setBusy(true);try{
              const updated=await onAmendContract(selectedContract.id,{version:selectedContract.version,clauses:amendmentClauses.split('\n').filter(s=>s.trim()),notes:amendmentNotes,reason:amendmentReason});
              setSelectedContract(updated);setAmendmentReason('');onNotice(t('Agreement amendment saved.','اصلاح قرارداد ذخیره شد.'));
            }catch(err){onError((err as Error).message);}finally{setBusy(false);}}}>
              <button type="button" className="button secondary" onClick={()=>{setAmendmentNotes(selectedContract.notes);setAmendmentClauses(selectedContract.clauses.join('\n'));}}>{t('Load current terms','بارگذاری شرایط فعلی')}</button>
              <label className="field">{t('Replacement clauses','شرایط جایگزین')}<textarea rows={4} value={amendmentClauses} onChange={e=>setAmendmentClauses(e.target.value)}/></label>
              <label className="field">{t('Replacement notes','یادداشت جایگزین')}<textarea value={amendmentNotes} onChange={e=>setAmendmentNotes(e.target.value)}/></label>
              <label className="field">{t('Reason for amendment','دلیل اصلاح')}<input required value={amendmentReason} onChange={e=>setAmendmentReason(e.target.value)}/></label>
              <button className="button" disabled={busy||!amendmentReason.trim()}>{t('Save versioned amendment','ذخیره اصلاح نسخه‌دار')}</button>
            </form>
          </details>}

          {/* PAGE 1: Parties, Apartment 4 Boundaries, Price & Installment Schedule */}
          <div className="contract-page" data-testid="contract-page-1">
            <div className="contract-header-grid">
              <div className="contract-photo-box">
                {qrImage ? <img data-testid="agreement-verification-qr" src={qrImage} alt={t('Scan to verify this agreement','برای تأیید اصالت قرارداد اسکن کنید')} style={{objectFit:'contain'}}/> : <small role="status">{qrError || t('Verification code unavailable','کد تأیید موجود نیست')}</small>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>
                  ATTAIE PROPERTIES — رهنمای معاملات عطایی
                </h3>
                <p style={{ margin: '4px 0', fontSize: 13, fontWeight: 700 }}>
                  OFFICIAL APARTMENT PRE-SALE & CONSTRUCTION CONTRACT (سند رسمی فروش اپارتمان)
                </p>
                <small>
                  Contract No: <strong>{selectedContract.contractSerial}</strong> | Date: {selectedContract.gregorianDate} ({selectedContract.jalaliDate})
                </small>
              </div>
              <div className="contract-photo-box">
                {selectedContract.buyers[0]?.photo3x4Url &&
                selectedContract.buyers[0].photo3x4Url !== '/logo.png' ? (
                  <img
                    src={selectedContract.buyers[0].photo3x4Url}
                    alt={selectedContract.buyers[0].name}
                  />
                ) : (
                  <div style={{ padding: 6 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#F1F5F9',
                        color: '#1E293B',
                        fontWeight: 700,
                        fontSize: 13,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 4,
                      }}
                    >
                      {(selectedContract.buyers[0]?.name || 'B')
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <strong style={{ display: 'block', fontSize: 10 }}>
                      {selectedContract.buyers[0]?.name || 'Buyer 3×4'}
                    </strong>
                    <div style={{ fontSize: 9, marginTop: 2, color: '#64748B' }}>
                      3×4 Verified Portrait
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="table-scroll" style={{ marginBottom: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>Party Role (طرفین قرارداد)</th>
                    <th>Full Name (نام مکمل)</th>
                    <th>Father / Grandfather (ولد / ولدیت)</th>
                    <th>Tazkira / License (نمبر تذکره / جواز)</th>
                    <th>Phone & Address (شماره تماس و آدرس)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContract.sellersSnapshot.map((s, i) => (
                    <tr key={`seller-${i}`}>
                      <td><strong>Seller #{i + 1} (فروشنده)</strong></td>
                      <td>{s.photo3x4Url && <img className="party-portrait" src={s.photo3x4Url} alt={s.name}/>}<strong>{s.name}</strong><small>{s.birthDate}</small></td>
                      <td>{s.fatherName} / {s.grandfatherName}</td>
                      <td>{s.tazkiraNumber}</td>
                      <td>{s.permanentAddress}<br/>{s.currentAddress || s.address}</td>
                    </tr>
                  ))}
                  <tr>
                    <td><strong>Construction Co. (شرکت ساختمانی)</strong></td>
                    <td>{selectedContract.constructionSnapshot.representativePhotoUrl && <img className="party-portrait" src={selectedContract.constructionSnapshot.representativePhotoUrl} alt={selectedContract.constructionSnapshot.representativeName}/>}<strong>{selectedContract.constructionSnapshot.companyName}</strong></td>
                    <td>Rep: {selectedContract.constructionSnapshot.representativeName}</td>
                    <td>License: {selectedContract.constructionSnapshot.licenseNumber}</td>
                    <td>{selectedContract.constructionSnapshot.phone} — {selectedContract.constructionSnapshot.address}</td>
                  </tr>
                  {selectedContract.buyers.map((b, i) => (
                    <tr key={`buyer-${i}`}>
                      <td><strong>Buyer #{i + 1} (مشتری / خریدار)</strong></td>
                      <td>{b.photo3x4Url && <img className="party-portrait" src={b.photo3x4Url} alt={b.name}/>}<strong>{b.name}</strong><small>{b.birthDate}</small></td>
                      <td>{b.fatherName} / {b.grandfatherName}</td>
                      <td>{b.tazkiraNumber}</td>
                      <td>{b.phone} — {b.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{ margin: '10px 0 6px' }}>
              Apartment Specifications & Four Geographic Boundaries (مشخصات اپارتمان و حدود اربعه)
            </h4>
            <div className="table-scroll" style={{ marginBottom: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Apartment</th>
                    <th>Floor & Rooms</th>
                    <th>Area & Price/m²</th>
                    <th>Total Contract Amount</th>
                    <th>North (شمالاً)</th>
                    <th>South (جنوباً)</th>
                    <th>East (شرقاً)</th>
                    <th>West (غرباً)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{selectedContract.projectName}</strong> ({selectedContract.projectCode})</td>
                    <td><strong>{selectedContract.apartmentNumber}</strong></td>
                    <td>Floor {selectedContract.floor} • {selectedContract.rooms} Rooms</td>
                    <td>{selectedContract.areaSqm} m² @ ${selectedContract.pricePerSqm}/m²</td>
                    <td><strong>${selectedContract.totalPrice.toLocaleString()} {selectedContract.currency}</strong></td>
                    <td>{selectedContract.boundaries.north}</td>
                    <td>{selectedContract.boundaries.south}</td>
                    <td>{selectedContract.boundaries.east}</td>
                    <td>{selectedContract.boundaries.west}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 style={{ margin: '10px 0 6px' }}>
              100% Reconciled Payment & Installment Schedule (جدول اقساط و تادیات)
            </h4>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Milestone Description</th>
                    <th>Share (%)</th>
                    <th>Due Date</th>
                    <th>Scheduled Amount</th>
                    <th>Paid Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedContract.installments.map((inst) => (
                    <tr key={inst.number}>
                      <td>{inst.number}</td>
                      <td>{inst.description}</td>
                      <td>{inst.percentage}%</td>
                      <td>{inst.dueDate || 'Upon Milestone'}</td>
                      <td><strong>${inst.scheduledAmount.toLocaleString()} {selectedContract.currency}</strong></td>
                      <td>${inst.paidAmount.toLocaleString()} {selectedContract.currency}</td>
                      <td><span className={`badge ${inst.status}`}>{inst.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE 2: Clauses, Notes & Official Signature / Thumbprint Blocks */}
          <div className="contract-page" data-testid="contract-page-2">
            <h4 style={{ marginTop: 0 }}>
              Legal Terms, Conditions & Covenants (شرایط و مواد قانونی قرارداد — صفحه دوم)
            </h4>
            <ol style={{ paddingInlineStart: 20, lineHeight: 1.65, fontSize: 13 }}>
              {selectedContract.clauses.map((clause, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  {clause}
                </li>
              ))}
            </ol>

            <div style={{ marginTop: 12, padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13 }}>
              <strong>Special Notes (ملاحظات اختصاصی):</strong> {selectedContract.notes}
              <div style={{ marginTop: 4 }}>
                <small>
                  Closing Sales Advisor: <strong>{selectedContract.salesAgentName}</strong> | Issued By: <strong>{selectedContract.issuedBy}</strong>
                </small>
              </div>
            </div>

            <div className="contract-signatures">
              <div className="contract-sig-box">
                <strong>Project Seller(s) Signature & Thumbprint</strong>
                <div>امضا و شصت فروشنده</div>
              </div>
              <div className="contract-sig-box">
                <strong>Construction Co. Rep Signature & Seal</strong>
                <div>مهر و امضای نماینده شرکت ساختمانی</div>
              </div>
              <div className="contract-sig-box">
                <strong>Buyer(s) Signature & Thumbprint</strong>
                <div>امضا و شصت خریدار</div>
              </div>
              <div className="contract-sig-box">
                <strong>Witness #1 & Witness #2</strong>
                <div>امضا و شصت شهود</div>
              </div>
              <div className="contract-sig-box">
                <strong>Attaie Properties HR & Management Seal</strong>
                <div>مهر و تایید رهنمای معاملات عطایی</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
