import {
  createContext,
  useContext,
} from 'react';

import type { CanvasNode } from '@/entities/graph';

interface CanvasContextValue {
  updateNodeData: (
    nodeId: string,
    data: CanvasNode['data'],
  ) => void;
  generate: (generatorId: string) => void;
}

const CanvasContext =
  createContext<CanvasContextValue | null>(null);

export function CanvasProvider({
  updateNodeData,
  children,
  generate
}: CanvasContextValue & {
  children: React.ReactNode;
}) {
  return (
    <CanvasContext.Provider value={{ updateNodeData, generate }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  const context = useContext(CanvasContext);

  if (!context) {
    throw new Error(
      'useCanvasContext must be used inside CanvasProvider',
    );
  }

  return context;
}