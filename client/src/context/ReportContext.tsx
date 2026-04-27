import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface FlaggedColumn {
  column: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  biasType: string;
  affectedProtectedClasses: string[];
  correlationStrength: number;
  reasoning: string;
  recommendation: string;
}

interface StatisticalDisparity {
  metric: string;
  value: number;
  threshold: number;
  status: 'violation' | 'warning' | 'pass';
  details: string;
}

interface ComplianceViolation {
  framework: string;
  violation: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedColumns: string[];
}

interface DebiasingSuggestion {
  action: string;
  targetColumns: string[];
  description: string;
  priority: 'immediate' | 'recommended' | 'optional';
}

interface BiasReport {
  overallBiasScore: number;
  legalRiskScore: number;
  ethicalRiskScore: number;
  totalRowsScanned: number;
  summary: string;
  flaggedColumns: FlaggedColumn[];
  statisticalDisparities: StatisticalDisparity[];
  complianceViolations: ComplianceViolation[];
  debiasingSuggestions: DebiasingSuggestion[];
  cacheKey: string;
  metadata: {
    fileName: string;
    fileSize: number;
    totalRows: number;
    totalColumns: number;
    headers: string[];
    domain: string;
    analyzedAt: string;
  };
}

interface ReportContextType {
  latestReport: BiasReport | null;
  setLatestReport: (report: BiasReport | null) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [latestReport, setLatestReport] = useState<BiasReport | null>(null);

  return (
    <ReportContext.Provider value={{ latestReport, setLatestReport }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}
