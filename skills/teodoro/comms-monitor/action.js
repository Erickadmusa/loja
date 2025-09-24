const responses = {
  pt: require('./pt.json'),
  en: require('./en.json')
};

function format(lang, section, key, params = {}) {
  const template = responses[lang][section][key][0];
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
}

async function fetchLogs(tools) {
  if (!tools || !tools.logger) return [];
  const history = await tools.logger.history();
  return history.slice(-5);
}

async function showLogs(context) {
  const { lang, tools } = context;
  const logs = await fetchLogs(tools);
  if (!logs.length) {
    return { type: 'text', value: format(lang, 'show_logs', 'empty') };
  }
  const payload = logs.map((log) => `[${log.level}] ${log.message}`).join(' | ');
  return {
    type: 'text',
    value: format(lang, 'show_logs', 'default', { logs: payload }),
    extra: logs
  };
}

async function subscribeChannel(context) {
  const { lang, slots = {}, tools } = context;
  const channel = slots.channel || 'default';
  if (tools && tools.bus) {
    await tools.bus.subscribe(channel);
  }
  return {
    type: 'text',
    value: format(lang, 'subscribe_channel', 'success', { channel }),
    extra: { channel }
  };
}

async function action(data) {
  const lang = responses[data.lang] ? data.lang : 'pt';
  const intent = data.intent && data.intent.name;
  const context = {
    lang,
    slots: data.slots,
    tools: data.tools
  };

  switch (intent) {
    case 'show_logs':
      return showLogs(context);
    case 'subscribe_channel':
      return subscribeChannel(context);
    default:
      return { type: 'text', value: `Intent ${intent} not handled by comms-monitor.` };
  }
}

module.exports = action;
module.exports.showLogs = showLogs;
module.exports.subscribeChannel = subscribeChannel;
