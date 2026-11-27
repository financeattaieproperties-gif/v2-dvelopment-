import React, { useState } from 'react';
import {
  FileText,
  Layers,
  KeyRound,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';

export interface PaymentMilestone {
  step: number;
  percent: number;
  cumulative: number;
  titleEn: string;
  titleFa: string;
  stageEn: string;
  stageFa: string;
  descEn: string;
  descFa: string;
  barColor: string;
  badgeBg: string;
  icon: 'agreement' | 'structure' | 'brickwork' | 'paint' | 'handover';
}

export interface PaymentPlanDefinition {
  id: 'plan1' | 'plan2';
  badgeEn: string;
  badgeFa: string;
  nameEn: string;
  nameFa: string;
  subtitleEn: string;
  subtitleFa: string;
  summaryHighlightEn: string;
  summaryHighlightFa: string;
  agreementPercent: number;
  constructionPercent: number;
  handoverPercent: number;
  stagesCount: number;
  milestones: PaymentMilestone[];
}

export const PAYMENT_PLANS: Record<'plan1' | 'plan2', PaymentPlanDefinition> = {
  plan1: {
    id: 'plan1',
    badgeEn: '1st Payment Plan · 5-Stage Construction Schedule',
    badgeFa: 'پلان اول پرداخت · جدول ۵ مرحله‌ای پیشرفت ساخت',
    nameEn: '1st Payment Plan',
    nameFa: 'پلان اول پرداخت',
    subtitleEn: '5-Stage Milestone Schedule',
    subtitleFa: 'پرداخت مرحله‌ای مطابق پیشرفت فزیکی ساختمان',
    summaryHighlightEn: 'Spread 40% across verified structural, brickwork, and finishing milestones.',
    summaryHighlightFa: 'پرداخت ۴۰٪ در مراحل تاییدشده اسکلیت، خشت‌کاری و رنگ‌مالی.',
    agreementPercent: 50,
    constructionPercent: 40,
    handoverPercent: 10,
    stagesCount: 5,
    milestones: [
      {
        step: 1,
        percent: 50,
        cumulative: 50,
        titleEn: 'On conducting the agreement',
        titleFa: 'هنگام عقد قرارداد رسمی',
        stageEn: 'Contract Signing',
        stageFa: 'امضای قرارداد',
        descEn: 'Initial down payment upon signing official contract.',
        descFa: 'پیش‌پرداخت اول هنگام امضای قرارداد رسمی.',
        barColor: 'bg-[#9A712B]',
        badgeBg: 'bg-[#9A712B] text-white',
        icon: 'agreement',
      },
      {
        step: 2,
        percent: 15,
        cumulative: 65,
        titleEn: 'On finishing the structure',
        titleFa: 'هنگام تکمیل اسکلیت ساختمان',
        stageEn: 'Structure Completion',
        stageFa: 'تکمیل اسکلیت',
        descEn: 'Concrete columns and slabs complete.',
        descFa: 'تکمیل ستون‌ها و چت‌ها.',
        barColor: 'bg-[#B3873B]',
        badgeBg: 'bg-[#B3873B] text-white',
        icon: 'structure',
      },
      {
        step: 3,
        percent: 15,
        cumulative: 80,
        titleEn: 'On finishing the brickworks',
        titleFa: 'هنگام تکمیل خشت‌کاری',
        stageEn: 'Brickwork & Partitions',
        stageFa: 'تکمیل خشت‌کاری',
        descEn: 'Exterior masonry and wall partitions complete.',
        descFa: 'تکمیل خشت‌کاری و پارتیشن‌بندی.',
        barColor: 'bg-[#C89F53]',
        badgeBg: 'bg-[#C89F53] text-white',
        icon: 'brickwork',
      },
      {
        step: 4,
        percent: 10,
        cumulative: 90,
        titleEn: 'On finishing the paint job',
        titleFa: 'هنگام تکمیل رنگ‌مالی',
        stageEn: 'Paint & Finishes',
        stageFa: 'رنگ‌مالی و دیکور',
        descEn: 'Plastering, painting, and interior finishes.',
        descFa: 'پلسترکاری و رنگ‌مالی.',
        barColor: 'bg-[#1D1B18]',
        badgeBg: 'bg-[#1D1B18] text-white',
        icon: 'paint',
      },
      {
        step: 5,
        percent: 10,
        cumulative: 100,
        titleEn: 'On handover',
        titleFa: 'هنگام تحویل‌دهی کلید',
        stageEn: 'Key Handover',
        stageFa: 'تسلیمی کلید',
        descEn: 'Final settlement and key handover.',
        descFa: 'تصفیه نهایی و تحویل کلید.',
        barColor: 'bg-[#1F6E43]',
        badgeBg: 'bg-[#1F6E43] text-white',
        icon: 'handover',
      },
    ],
  },
  plan2: {
    id: 'plan2',
    badgeEn: '2nd Payment Plan · 2-Stage Direct Settlement',
    badgeFa: 'پلان دوم پرداخت · تسویه مستقیم ۲ مرحله‌ای',
    nameEn: '2nd Payment Plan',
    nameFa: 'پلان دوم پرداخت',
    subtitleEn: '2-Stage Direct Settlement',
    subtitleFa: 'پرداخت مستقیم هنگام عقد قرارداد و تحویل کلید',
    summaryHighlightEn: 'Zero intermediate installments during construction until final handover.',
    summaryHighlightFa: 'بدون اقساط میانی در جریان ساخت تا زمان تحویل کلید.',
    agreementPercent: 75,
    constructionPercent: 0,
    handoverPercent: 25,
    stagesCount: 2,
    milestones: [
      {
        step: 1,
        percent: 75,
        cumulative: 75,
        titleEn: 'On conducting the agreement',
        titleFa: 'هنگام عقد قرارداد رسمی',
        stageEn: 'Contract Signing (75%)',
        stageFa: 'امضای قرارداد (۷۵٪)',
        descEn: '75% upfront. Zero intermediate calls during construction.',
        descFa: 'پرداخت ۷۵٪ اولیه. بدون پرداخت میانی در طول ساخت.',
        barColor: 'bg-[#9A712B]',
        badgeBg: 'bg-[#9A712B] text-white',
        icon: 'agreement',
      },
      {
        step: 2,
        percent: 25,
        cumulative: 100,
        titleEn: 'On handover',
        titleFa: 'هنگام تحویل‌دهی کلید',
        stageEn: 'Key Handover (25%)',
        stageFa: 'تسلیمی کلید (۲۵٪)',
        descEn: 'Remaining 25% balance paid on final key handover.',
        descFa: 'پرداخت ۲۵٪ باقی‌مانده هنگام تحویل کلید.',
        barColor: 'bg-[#1F6E43]',
        badgeBg: 'bg-[#1F6E43] text-white',
        icon: 'handover',
      },
    ],
  },
};

const PRESET_PRICES = [95000, 125000, 165000, 230000];

interface PaymentPlanComparisonCardProps {
  projectName?: string;
  initialPrice?: number;
  isRtl?: boolean;
  compact?: boolean;
}

export const PaymentPlanComparisonCard: React.FC<PaymentPlanComparisonCardProps> = ({
  projectName,
  initialPrice = 125000,
  isRtl = false,
  compact = false,
}) => {
  const [unitPrice, setUnitPrice] = useState<number>(initialPrice);

  const formatUsd = (amount: number) =>
    `$${Math.round(amount).toLocaleString('en-US')}`;

  const whatsappBaseUrl = 'https://wa.me/93782222279';

  return (
    <div className={`w-full ${compact ? '' : 'p-6 sm:p-8 bg-brand-cream/60 rounded-3xl border border-brand-navy/10'}`}>
      {/* Header & Price baseline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-neutral-200">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-gold mb-1">
            <ShieldCheck size={14} />
            {isRtl ? 'پلان‌های پرداخت پیش‌فروش' : 'Pre-Sale Payment Plans'}
          </span>
          <h3 className="text-xl sm:text-2xl font-heading font-bold text-brand-navy">
            {isRtl ? 'چقدر باید پرداخت کنید؟' : 'How Much You Pay'}
          </h3>
          {projectName && (
            <p className="text-xs text-neutral-500 mt-0.5">
              {projectName}
            </p>
          )}
        </div>

        {/* Budget preset buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-neutral-500 font-medium me-1">
            {isRtl ? 'قیمت فرضی:' : 'Sample Price:'}
          </span>
          {PRESET_PRICES.map((p) => {
            const active = unitPrice === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setUnitPrice(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                  active
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-brand-navy/30'
                }`}
              >
                ${(p / 1000).toFixed(0)}k
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Concise Side-by-Side Payment Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: 1st Payment Plan */}
        <div className="bg-white rounded-2xl border border-brand-navy/15 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-brand-gold/15 text-brand-gold">
                {isRtl ? 'پلان اول' : '1st Payment Plan'}
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                {isRtl ? '۵ مرحله‌ای' : '5-Stage Phased'}
              </span>
            </div>

            <h4 className="text-lg font-bold text-brand-navy mb-1">
              {isRtl ? 'پرداخت مطابق پیشرفت کار' : 'Milestone Schedule'}
            </h4>
            <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
              {isRtl
                ? '۴۰٪ متباقی در جریان پیشرفت اسکلیت، خشت‌کاری و رنگ‌مالی پرداخت می‌شود.'
                : 'Spread 40% across verified structural, brickwork, and finishing phases.'}
            </p>

            {/* Stages list */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-ivory/70 border border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-brand-gold shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-brand-navy">
                      {isRtl ? 'عقد قرارداد رسمی' : 'Contract Signing'}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {isRtl ? 'پیش‌پرداخت اولیه' : 'Down Payment'}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <span className="inline-block px-2 py-0.5 rounded bg-brand-gold/20 text-brand-navy text-xs font-bold me-1.5">
                    50%
                  </span>
                  <span className="text-sm font-bold text-brand-navy tabular-nums">
                    {formatUsd(unitPrice * 0.5)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-ivory/70 border border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <Layers size={16} className="text-brand-gold shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-brand-navy">
                      {isRtl ? 'اقساط در جریان ساخت' : 'During Construction'}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {isRtl ? 'اسکلیت ۱۵٪ · خشت ۱۵٪ · رنگ ۱۰٪' : 'Structure 15% · Brick 15% · Paint 10%'}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <span className="inline-block px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 text-xs font-bold me-1.5">
                    40%
                  </span>
                  <span className="text-sm font-bold text-brand-navy tabular-nums">
                    {formatUsd(unitPrice * 0.4)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-ivory/70 border border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <KeyRound size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-brand-navy">
                      {isRtl ? 'تسلیمی کلید اپارتمان' : 'Key Handover'}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {isRtl ? 'تصفیه نهایی پس از تکمیل' : 'Final Inspection & Deed'}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold me-1.5">
                    10%
                  </span>
                  <span className="text-sm font-bold text-brand-navy tabular-nums">
                    {formatUsd(unitPrice * 0.1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-neutral-600">
                {isRtl ? 'مجموع قیمت واحد:' : 'Total Unit Price:'}
              </span>
              <span className="font-bold text-brand-navy text-base tabular-nums">
                {formatUsd(unitPrice)} (100%)
              </span>
            </div>
            <a
              href={`${whatsappBaseUrl}?text=${encodeURIComponent(
                `Hello Attaie Properties, I am interested in the 1st Payment Plan (50% / 40% / 10%) for ${
                  projectName || 'your development project'
                } ($${unitPrice.toLocaleString()}).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy-light transition-colors"
            >
              <MessageCircle size={15} />
              <span>{isRtl ? 'انتخاب پلان اول در واتساپ' : 'Select Plan 1 via WhatsApp'}</span>
            </a>
          </div>
        </div>

        {/* Card 2: 2nd Payment Plan */}
        <div className="bg-white rounded-2xl border-2 border-brand-gold/40 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 end-0 bg-brand-gold text-white text-[10px] font-bold px-3 py-1 rounded-es-xl uppercase tracking-wider">
            {isRtl ? 'ساده‌ترین تسویه' : 'Direct 2-Step'}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {isRtl ? 'پلان دوم' : '2nd Payment Plan'}
              </span>
            </div>

            <h4 className="text-lg font-bold text-brand-navy mb-1">
              {isRtl ? 'تسویه مستقیم ۲ مرحله‌ای' : 'Direct Contract & Handover'}
            </h4>
            <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
              {isRtl
                ? '۷۵٪ هنگام امضای قرارداد. صفر افغانی پرداخت در جریان کار ساختمانی تا تسلیمی کلید.'
                : '75% upfront on contract. Zero intermediate payments during construction until key handover.'}
            </p>

            {/* Stages list */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-ivory/70 border border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-brand-gold shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-brand-navy">
                      {isRtl ? 'عقد قرارداد رسمی' : 'Contract Signing'}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {isRtl ? 'پیش‌پرداخت عمده' : 'Major Upfront Payment'}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <span className="inline-block px-2 py-0.5 rounded bg-brand-gold/20 text-brand-navy text-xs font-bold me-1.5">
                    75%
                  </span>
                  <span className="text-sm font-bold text-brand-navy tabular-nums">
                    {formatUsd(unitPrice * 0.75)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      {isRtl ? 'در جریان ساخت' : 'During Construction'}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {isRtl ? 'هیچ پرداختی در طول ساخت نیست' : 'Zero intermediate installments'}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-xs font-bold me-1.5">
                    0%
                  </span>
                  <span className="text-sm font-bold text-emerald-900 tabular-nums">
                    $0
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-ivory/70 border border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <KeyRound size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-brand-navy">
                      {isRtl ? 'تسلیمی کلید اپارتمان' : 'Key Handover'}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {isRtl ? 'پرداخت ۲۵٪ متباقی' : 'Remaining 25% balance'}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold me-1.5">
                    25%
                  </span>
                  <span className="text-sm font-bold text-brand-navy tabular-nums">
                    {formatUsd(unitPrice * 0.25)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-neutral-600">
                {isRtl ? 'مجموع قیمت واحد:' : 'Total Unit Price:'}
              </span>
              <span className="font-bold text-brand-navy text-base tabular-nums">
                {formatUsd(unitPrice)} (100%)
              </span>
            </div>
            <a
              href={`${whatsappBaseUrl}?text=${encodeURIComponent(
                `Hello Attaie Properties, I am interested in the 2nd Payment Plan (75% / 0% / 25%) for ${
                  projectName || 'your development project'
                } ($${unitPrice.toLocaleString()}).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-gold text-white text-xs font-bold hover:brightness-110 transition-colors"
            >
              <MessageCircle size={15} />
              <span>{isRtl ? 'انتخاب پلان دوم در واتساپ' : 'Select Plan 2 via WhatsApp'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
