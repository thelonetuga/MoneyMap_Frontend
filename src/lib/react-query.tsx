'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Dados considerados "frescos" por 1 minuto
        staleTime: 60 * 1000,
        // Tenta novamente 1 vez se falhar
        retry: 1,
        // Não faz refetch automático ao focar a janela (opcional, bom para dashboards)
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}