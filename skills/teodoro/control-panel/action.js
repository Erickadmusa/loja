const os = require('os');
const path = require('path');
const chalk = require('chalk');
const { EventEmitter2 } = require('eventemitter2');

const responses = {
  pt: require('./pt.json'),
  en: require('./en.json')
};

const emitter = new EventEmitter2({ wildcard: true });

const SUPPORTED_LANGS = ['pt', 'en'];

function format(template, data) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return data[key] !== undefined ? data[key] : `{${key}}`;
  });
}

async function getRegistry(tools) {
  if (!tools || !tools.cache) {
    return { agents: [], skills: [] };
  }
  const agents = await tools.cache.get('teodoro:agents');
  const skills = await tools.cache.get('teodoro:skills');
  return {
    agents: agents || [],
    skills: skills || []
  };
}

async function handleShowStatus(context) {
  const { lang, tools } = context;
  const { agents, skills } = await getRegistry(tools);
  const payload = {
    agents: agents.length,
    skills: skills.length
  };

  emitter.emit('teodoro.control.status', payload);
  return {
    type: 'text',
    value: format(responses[lang].show_status.default[0], payload),
    extra: payload
  };
}

async function handleSwitchLanguage(context) {
  const { lang, tools, slots = {}, runtime } = context;
  const requestedLang = (slots.language || '').toLowerCase();

  if (!SUPPORTED_LANGS.includes(requestedLang)) {
    return {
      type: 'text',
      value: format(responses[lang].switch_language.unsupported[0], {
        language: requestedLang || 'unknown',
        supported: SUPPORTED_LANGS.join(', ')
      })
    };
  }

  if (runtime && typeof runtime.setLanguage === 'function') {
    await runtime.setLanguage(requestedLang);
  }

  emitter.emit('teodoro.control.language.changed', { language: requestedLang });

  return {
    type: 'text',
    value: format(responses[requestedLang].switch_language.success[0], {
      language: requestedLang
    }),
    language: requestedLang
  };
}

async function handleLaunchDashboard(context) {
  const { lang } = context;
  const dashboardEnabled = process.env.TEODORO_CONTROL_CENTER === '1';

  if (!dashboardEnabled) {
    return {
      type: 'text',
      value: responses[lang].launch_dashboard.disabled[0]
    };
  }

  const baseUrl = process.env.TEODORO_CONTROL_URL || `http://localhost:4242/control`; 
  const payload = { url: baseUrl };
  emitter.emit('teodoro.control.dashboard', payload);

  return {
    type: 'text',
    value: format(responses[lang].launch_dashboard.success[0], payload),
    extra: payload
  };
}

async function action(data) {
  const lang = SUPPORTED_LANGS.includes(data.lang) ? data.lang : 'pt';
  const intent = data.intent && data.intent.name;

  const context = {
    lang,
    slots: data.slots,
    tools: data.tools,
    runtime: data.runtime
  };

  switch (intent) {
    case 'show_status':
      return handleShowStatus(context);
    case 'switch_language':
      return handleSwitchLanguage(context);
    case 'launch_dashboard':
      return handleLaunchDashboard(context);
    default:
      return {
        type: 'text',
        value: `Intent ${intent} not handled by control-panel.`
      };
  }
}

module.exports = action;
module.exports.emitter = emitter;
module.exports.SUPPORTED_LANGS = SUPPORTED_LANGS;
module.exports.getRegistry = getRegistry;
