const axios = require('axios');
const math = require('mathjs');

const responses = {
  pt: require('./pt.json'),
  en: require('./en.json')
};

function format(lang, key, variant, params = {}) {
  const template = responses[lang][key][variant][0];
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
}

function summarizeNumericColumns(rows) {
  if (!rows.length) return {};
  const summary = {};
  const keys = Object.keys(rows[0]);

  for (const key of keys) {
    const column = rows.map((row) => Number(row[key])).filter((value) => !Number.isNaN(value));
    if (!column.length) continue;
    summary[key] = {
      min: math.min(column),
      max: math.max(column),
      mean: math.mean(column),
      median: math.median(column),
      std: math.std(column)
    };
  }

  return summary;
}

function parseCSV(data) {
  const [headerLine, ...lines] = data.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((h) => h.trim());
  const rows = lines.map((line) => {
    const cells = line.split(',');
    return headers.reduce((acc, header, index) => {
      acc[header] = cells[index];
      return acc;
    }, {});
  });
  return rows;
}

async function analyzeMetrics(context) {
  const { lang, slots = {}, tools } = context;
  const datasetUrl = slots.dataset;

  if (!datasetUrl) {
    return {
      type: 'text',
      value: format(lang, 'analyze_metrics', 'failure', { reason: 'dataset URL missing' })
    };
  }

  if (tools && tools.logger) {
    tools.logger.info(format(lang, 'analyze_metrics', 'progress', { dataset: datasetUrl }));
  }

  try {
    const response = await axios.get(datasetUrl);
    const rows = parseCSV(response.data);
    const summary = summarizeNumericColumns(rows);
    const payload = JSON.stringify(summary);

    if (tools && tools.bus) {
      await tools.bus.publish('financeiro.analytics.summary', { dataset: datasetUrl, summary });
    }

    return {
      type: 'text',
      value: format(lang, 'analyze_metrics', 'success', { summary: payload }),
      extra: { summary }
    };
  } catch (error) {
    return {
      type: 'text',
      value: format(lang, 'analyze_metrics', 'failure', { reason: error.message })
    };
  }
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
    case 'analyze_metrics':
      return analyzeMetrics(context);
    default:
      return { type: 'text', value: `Intent ${intent} not handled by analytics-suite.` };
  }
}

module.exports = action;
module.exports.analyzeMetrics = analyzeMetrics;
