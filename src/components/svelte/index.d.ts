import { SvelteComponentTyped } from 'svelte';
import { BotGateProps } from '../../types';

export interface SvelteBotGateProps extends BotGateProps {}

export class BotGate extends SvelteComponentTyped<SvelteBotGateProps, {}, {}> {}