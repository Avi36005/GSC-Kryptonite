import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

// Domain contextual interface
export interface DomainConfig {
  name: string;
  metrics: {
    biasMetricTitle: string;
    biasMetricSubtitle: string;
    targetMetric: string;
  };
  scenarios: { id: string; action: string; description: string; }[];
}

interface DomainContextType {
  activeDomain: string;
  setActiveDomain: (domain: string) => void;
  domainConfig: DomainConfig | null;
}

const DomainContext = createContext<DomainContextType>({
  activeDomain: 'hiring',
  setActiveDomain: () => {},
  domainConfig: null,
});

export const DomainProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeDomain, setActiveDomain] = useState(() => localStorage.getItem('fairai_domain') || 'hiring');
  const [domainConfig, setDomainConfig] = useState<DomainConfig | null>(null);

  useEffect(() => {
    localStorage.setItem('fairai_domain', activeDomain);
    // Fetch the specific metric headers and scenarios from the backend registry
    api.getDomainConfig(activeDomain).then(config => {
      setDomainConfig(config);
    }).catch(console.error);
  }, [activeDomain]);

  return (
    <DomainContext.Provider value={{ activeDomain, setActiveDomain, domainConfig }}>
      {children}
    </DomainContext.Provider>
  );
};

export const useDomain = () => useContext(DomainContext);
