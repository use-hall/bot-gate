import React from 'react';
import { BotGateProps } from '../../types';

export interface ReactBotGateProps extends BotGateProps {
  children?: React.ReactNode;
}

export function BotGate(props: ReactBotGateProps): React.ReactElement | null;