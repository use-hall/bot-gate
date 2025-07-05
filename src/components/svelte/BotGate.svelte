<script>
  import { onMount } from 'svelte';
  import { warnIfClientSide } from '../../core/index.js';
  import { validateBotGateProps, isValidBot } from '../../core/shared-validation.js';

  export let userAgent;
  export let ipAddress;
  export let display;
  export let role;
  export let bots = null;

  let shouldShow = false;

  onMount(() => {
    warnIfClientSide();
  });

  $: {
    const validation = validateBotGateProps(userAgent, ipAddress, display, role);
    if (!validation.isValid) {
      shouldShow = false;
    } else {
      const isBot = isValidBot(userAgent, ipAddress, bots);
      shouldShow = (display === 'show') ? 
        (role === 'bot' ? isBot : !isBot) : 
        (role === 'bot' ? !isBot : isBot);
    }
  }
</script>

{#if shouldShow}
  <slot />
{/if}