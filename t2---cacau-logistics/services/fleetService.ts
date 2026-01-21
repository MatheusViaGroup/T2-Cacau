
import { Driver } from '../types';

export const MOCK_DRIVERS: Driver[] = [
  { MOTORISTA: 'João Silva', CAVALO: 'ABC-1234', CARRETA: 'XYZ-9090' },
  { MOTORISTA: 'Maria Oliveira', CAVALO: 'DEF-5678', CARRETA: 'WWW-1122' },
  { MOTORISTA: 'Carlos Santos', CAVALO: 'GHI-9012', CARRETA: 'QQQ-3344' },
  { MOTORISTA: 'Ana Paula', CAVALO: 'JKL-3456', CARRETA: 'EEE-5566' },
  { MOTORISTA: 'Roberto Lima', CAVALO: 'MNO-7890', CARRETA: 'RRR-7788' },
  { MOTORISTA: 'Fernanda Souza', CAVALO: 'PQR-1122', CARRETA: 'TTT-9900' },
];

export const getFleet = (): Promise<Driver[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_DRIVERS), 300);
  });
};
