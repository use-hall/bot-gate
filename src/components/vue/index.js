import { defineComponent, onMounted } from 'vue';
import { warnIfClientSide } from '../../core/index.js';
import { validateBotGateProps, isValidBot } from '../../core/shared-validation.js';

export const BotGate = defineComponent({
  name: 'BotGate',
  props: {
    userAgent: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String,
      required: true
    },
    display: {
      type: String,
      required: true,
      validator: value => ['show', 'hide'].includes(value)
    },
    role: {
      type: String,
      required: true,
      validator: value => ['bot', 'user'].includes(value)
    },
    bots: {
      type: Array,
      default: null
    }
  },
  setup(props, { slots }) {
    onMounted(() => {
      warnIfClientSide();
    });

    const shouldShow = () => {
      const validation = validateBotGateProps(props.userAgent, props.ipAddress, props.display, props.role);
      if (!validation.isValid) {
        return false;
      }

      const isBot = isValidBot(props.userAgent, props.ipAddress, props.bots);
      return (props.display === 'show') ? 
        (props.role === 'bot' ? isBot : !isBot) : 
        (props.role === 'bot' ? !isBot : isBot);
    };

    return () => {
      const show = shouldShow();
      return show ? slots.default?.() : null;
    };
  }
});

