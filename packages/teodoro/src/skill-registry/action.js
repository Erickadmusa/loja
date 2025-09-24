const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');

const responses = {
  pt: require('./pt.json'),
  en: require('./en.json')
};

function t(lang, section, key, params = {}) {
  const template = responses[lang][section][key][0];
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
}

async function readRegistry(cache) {
  if (!cache) return [];
  const skills = await cache.get('teodoro:skills');
  return skills || [];
}

async function writeRegistry(cache, skills) {
  if (!cache) return;
  await cache.set('teodoro:skills', skills);
}

async function listSkills(context) {
  const { lang, tools } = context;
  const skills = await readRegistry(tools && tools.cache);
  if (!skills.length) {
    return { type: 'text', value: t(lang, 'list_skills', 'empty') };
  }
  const skillNames = skills.map((skill) => `${skill.name}@${skill.agent}`).join(', ');
  return {
    type: 'text',
    value: t(lang, 'list_skills', 'default', {
      count: skills.length,
      skills: skillNames
    }),
    extra: skills
  };
}

async function installSkill(context) {
  const { lang, slots = {}, tools } = context;
  const repoUrl = slots.repository;
  const agent = slots.agent || 'teodoro';

  if (!repoUrl) {
    return {
      type: 'text',
      value: t(lang, 'install_skill', 'failure', { reason: 'repository URL missing' })
    };
  }

  const cache = tools && tools.cache;
  const registry = await readRegistry(cache);

  const packageDir = tools && tools.paths && tools.paths.agents ? tools.paths.agents : process.cwd();
  const agentDir = path.join(packageDir, agent, path.basename(repoUrl, '.git'));

  if (!fs.existsSync(agentDir)) {
    await fs.promises.mkdir(agentDir, { recursive: true });
  }

  if (tools && tools.logger) {
    tools.logger.info(t(lang, 'install_skill', 'progress', { repository: repoUrl, agent }));
  }

  const git = simpleGit();

  try {
    if (fs.existsSync(path.join(agentDir, '.git'))) {
      await git.cwd(agentDir).pull();
    } else {
      await git.clone(repoUrl, agentDir);
    }
  } catch (error) {
    return {
      type: 'text',
      value: t(lang, 'install_skill', 'failure', { reason: error.message })
    };
  }

  const skillName = path.basename(agentDir);
  const entry = { name: skillName, agent, repository: repoUrl };

  const updatedRegistry = registry.filter((item) => !(item.name === skillName && item.agent === agent));
  updatedRegistry.push(entry);
  await writeRegistry(cache, updatedRegistry);

  return {
    type: 'text',
    value: t(lang, 'install_skill', 'success', { skill: skillName, agent }),
    extra: entry
  };
}

async function removeSkill(context) {
  const { lang, slots = {}, tools } = context;
  const skillName = slots.skill;

  if (!skillName) {
    return {
      type: 'text',
      value: t(lang, 'remove_skill', 'not_found', { skill: 'unknown' })
    };
  }

  const cache = tools && tools.cache;
  const registry = await readRegistry(cache);
  const exists = registry.find((skill) => skill.name === skillName);

  if (!exists) {
    return {
      type: 'text',
      value: t(lang, 'remove_skill', 'not_found', { skill: skillName })
    };
  }

  const updated = registry.filter((skill) => skill.name !== skillName);
  await writeRegistry(cache, updated);

  return {
    type: 'text',
    value: t(lang, 'remove_skill', 'success', { skill: skillName }),
    extra: { removed: skillName }
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
    case 'list_skills':
      return listSkills(context);
    case 'install_skill':
      return installSkill(context);
    case 'remove_skill':
      return removeSkill(context);
    default:
      return { type: 'text', value: `Intent ${intent} not handled by skill-registry.` };
  }
}

module.exports = action;
module.exports.listSkills = listSkills;
module.exports.installSkill = installSkill;
module.exports.removeSkill = removeSkill;
