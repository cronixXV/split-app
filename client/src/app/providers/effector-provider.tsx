import type { PropsWithChildren } from 'react';

import { fork } from 'effector';
import { Provider } from 'effector-react';

const appScope = fork();

export const EffectorProvider = ({ children }: PropsWithChildren) => {
  return <Provider value={appScope}>{children}</Provider>;
};
