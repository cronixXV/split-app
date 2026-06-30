import type { PropsWithChildren } from 'react';

import { EffectorProvider } from './effector-provider';

export function AppProvider({ children }: PropsWithChildren) {
  return <EffectorProvider>{children}</EffectorProvider>;
}
