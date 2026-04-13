import { createContext, useContext, useState, ReactNode } from 'react';

export interface ScannedDocContext {
  fileName: string;
  summary: string;
  redFlags: string[];
  complianceReport: string;
}

const SESSION_KEY = 'legalguide_doc_context';

// ── Synchronous sessionStorage helpers ────────────────────────────────────────
function readFromSession(): ScannedDocContext | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeToSession(doc: ScannedDocContext | null) {
  try {
    if (doc) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(doc));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

interface LegalContextType {
  scannedDoc: ScannedDocContext | null;
  setScannedDoc: (doc: ScannedDocContext | null) => void;
  clearScannedDoc: () => void;
}

const LegalContext = createContext<LegalContextType | undefined>(undefined);

export function LegalProvider({ children }: { children: ReactNode }) {
  // Initialise from sessionStorage so a page refresh preserves the doc
  const [scannedDoc, setScannedDocState] = useState<ScannedDocContext | null>(
    readFromSession
  );

  const setScannedDoc = (doc: ScannedDocContext | null) => {
    writeToSession(doc);        // synchronous — always wins
    setScannedDocState(doc);    // triggers React re-render
  };

  const clearScannedDoc = () => {
    writeToSession(null);       // synchronous clear
    setScannedDocState(null);
  };

  return (
    <LegalContext.Provider value={{ scannedDoc, setScannedDoc, clearScannedDoc }}>
      {children}
    </LegalContext.Provider>
  );
}

export function useLegal() {
  const context = useContext(LegalContext);
  if (context === undefined) {
    throw new Error('useLegal must be used within a LegalProvider');
  }
  return context;
}
