import React, { useState } from 'react';
import { APPSHEET_GUIDE_INDONESIAN, AppSheetStep } from '../appsheet-guide';
import { CheckCircle2, QrCode, Smartphone, Layers, ShieldCheck } from 'lucide-react';

export default function AppSheetGuide() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) {
      setCompletedSteps(completedSteps.filter(s => s !== stepNumber));
    } else {
      setCompletedSteps([...completedSteps, stepNumber]);
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <Layers className="h-5 w-5 text-indigo-600" />;
      case 2:
        return <QrCode className="h-5 w-5 text-indigo-600" />;
      case 3:
        return <ShieldCheck className="h-5 w-5 text-indigo-600" />;
      case 4:
        return <Smartphone className="h-5 w-5 text-indigo-600" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/30 p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-indigo-600" />
          Panduan Setup Scan Barcode di AppSheet Mobile
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Ikuti langkah-langkah di bawah ini untuk mengonfigurasi aplikasi mobile AppSheet Anda agar petugas gudang dapat memindai barcode fisik barang menggunakan kamera handphone dan otomatis memperbarui stok secara real-time.
        </p>
      </div>

      <div className="space-y-4">
        {APPSHEET_GUIDE_INDONESIAN.map((stepItem: AppSheetStep) => {
          const isDone = completedSteps.includes(stepItem.step);
          return (
            <div
              key={stepItem.step}
              className={`rounded-xl border p-6 transition shadow-sm ${
                isDone 
                  ? 'border-indigo-200 bg-indigo-50/20 shadow-indigo-50/10' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isDone ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {getStepIcon(stepItem.step)}
                  </div>
                  <div>
                    <h4 className={`text-base font-bold ${isDone ? 'text-indigo-900 line-through' : 'text-slate-900'}`}>
                      Langkah {stepItem.step}: {stepItem.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{stepItem.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleStep(stepItem.step)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition cursor-pointer ${
                    isDone 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Selesai</span>
                    </>
                  ) : (
                    <span>Tandai Selesai</span>
                  )}
                </button>
              </div>

              {/* Substeps */}
              <div className="mt-5 border-t border-slate-100 pt-4 pl-3">
                <ul className="space-y-3 text-sm text-slate-600">
                  {stepItem.substeps.map((sub: string, index: number) => (
                    <li key={index} className="flex gap-3 items-start">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700 mt-0.5">
                        {index + 1}
                      </span>
                      <span className={isDone ? 'text-indigo-800/60' : 'text-slate-700'}>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
