const path = require('path');
const fs = require('fs');
const responses = {
  pt: require('./pt.json'),
  en: require('./en.json')
};

function t(lang, key, variant, params = {}) {
  const template = responses[lang][key][variant][0];
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
}

async function readAgents(cache) {
  if (!cache) return [];
  const agents = await cache.get('teodoro:agents');
  return agents || [];
}

async function writeAgents(cache, agents) {
  if (!cache) return;
  await cache.set('teodoro:agents', agents);
}

async function createAgent(context) {
  const { lang, slots = {}, tools } = context;
  const agentName = (slots.agent_name || '').toLowerCase().replace(/\s+/g, '-');
  const purpose = slots.purpose || 'generalist';

  if (!agentName) {
    return {
      type: 'text',
      value: t(lang, 'create_agent', 'exists', { agent: 'unknown' })
    };
  }

  const cache = tools && tools.cache;
  const agents = await readAgents(cache);

  if (agents.find((agent) => agent.name === agentName)) {
    return {
      type: 'text',
      value: t(lang, 'create_agent', 'exists', { agent: agentName })
    };
  }

  const baseDir = tools && tools.paths && tools.paths.agents ? tools.paths.agents : path.join(process.cwd(), 'packages');
  const agentDir = path.join(baseDir, agentName);

  await fs.promises.mkdir(agentDir, { recursive: true });
  await fs.promises.writeFile(
    path.join(agentDir, 'manifest.json'),
    JSON.stringify({ name: agentName, purpose, createdAt: new Date().toISOString() }, null, 2)
  );

  agents.push({ name: agentName, purpose });
  await writeAgents(cache, agents);

  return {
    type: 'text',
    value: t(lang, 'create_agent', 'success', { agent: agentName, purpose }),
    extra: { name: agentName, purpose }
  };
}

async function listAgents(context) {
  const { lang, tools } = context;
  const agents = await readAgents(tools && tools.cache);
  if (!agents.length) {
    return {
      type: 'text',
      value: t(lang, 'list_agents', 'empty')
    };
  }
  const label = agents.map((agent) => `${agent.name} (${agent.purpose})`).join(', ');
  return {
    type: 'text',
    value: t(lang, 'list_agents', 'default', { agents: label }),
    extra: agents
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
    case 'create_agent':
      return createAgent(context);
    case 'list_agents':
      return listAgents(context);
    default:
      return { type: 'text', value: `Intent ${intent} not handled by agent-factory.` };
  }
}

module.exports = action;
module.exports.createAgent = createAgent;
module.exports.listAgents = listAgents;
