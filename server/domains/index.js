// Registry for Domain Configurations

import hiring from './hiring.js';
import finance from './finance.js';
import healthcare from './healthcare.js';
import education from './education.js';
import government from './government.js';

const domains = {
  hiring,
  finance,
  healthcare,
  education,
  government
};

// Return a configuration for a specific domain, fallback to hiring if undefined
export const getDomainConfig = (domainKey) => {
  const normalizedKey = (domainKey || 'hiring').toLowerCase();
  return domains[normalizedKey] || domains.hiring;
};
