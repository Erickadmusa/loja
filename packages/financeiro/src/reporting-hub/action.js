const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');

const responses = {
  pt: require('./pt.json'),
  en: require('./en.json')
};

function format(lang, section, key, params = {}) {
  const template = responses[lang][section][key][0];
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
}

async function writePdf(pathname, data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(pathname);
    doc.pipe(stream);
    doc.fontSize(18).text('Relatório Financeiro', { align: 'center' });
    doc.moveDown();
    data.forEach((row) => {
      doc.fontSize(12).text(`${row.label}: ${row.value}`);
    });
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function writeCsv(pathname, data) {
  const csvWriter = createObjectCsvWriter({
    path: pathname,
    header: [
      { id: 'label', title: 'Label' },
      { id: 'value', title: 'Value' }
    ]
  });
  await csvWriter.writeRecords(data);
}

function simulateFinancials({ growth = 0.15, cost = 0.3 }) {
  const baseRevenue = 100000;
  const baseCost = 60000;
  const revenue = baseRevenue * (1 + Number(growth));
  const expenses = baseCost * (1 + Number(cost));
  const profit = revenue - expenses;
  return { revenue, cost: expenses, profit };
}

async function generateReport(context) {
  const { lang, slots = {}, tools } = context;
  const period = slots.period || 'último mês';
  const formatRequest = (slots.format || 'pdf').toLowerCase();
  const dir = path.join(process.cwd(), 'reports');
  await fs.promises.mkdir(dir, { recursive: true });

  const summary = simulateFinancials({});
  const data = [
    { label: 'Receita', value: summary.revenue.toFixed(2) },
    { label: 'Custos', value: summary.cost.toFixed(2) },
    { label: 'Lucro', value: summary.profit.toFixed(2) }
  ];

  const timestamp = DateTime.now().toISODate();
  let filePath;

  try {
    if (formatRequest === 'csv') {
      filePath = path.join(dir, `relatorio-${timestamp}.csv`);
      await writeCsv(filePath, data);
    } else {
      filePath = path.join(dir, `relatorio-${timestamp}.pdf`);
      await writePdf(filePath, data);
    }
  } catch (error) {
    return {
      type: 'text',
      value: format(lang, 'generate_report', 'failure', { reason: error.message })
    };
  }

  if (tools && tools.bus) {
    await tools.bus.publish('financeiro.reports.generated', { period, path: filePath, format: formatRequest });
  }

  return {
    type: 'text',
    value: format(lang, 'generate_report', 'success', { period, format: formatRequest.toUpperCase(), path: filePath }),
    extra: { period, format: formatRequest, path: filePath }
  };
}

async function simulateScenario(context) {
  const { lang, slots = {}, tools } = context;
  const growth = Number(slots.growth || 0.25);
  const cost = Number(slots.cost || 0.35);
  const result = simulateFinancials({ growth, cost });

  const payload = {
    type: 'text',
    value: format(lang, 'simulate_scenario', 'success', {
      revenue: result.revenue.toFixed(2),
      cost: result.cost.toFixed(2),
      profit: result.profit.toFixed(2)
    }),
    extra: result
  };

  if (tools && tools.bus) {
    await tools.bus.publish('financeiro.reports.simulated', payload.extra);
  }

  return payload;
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
    case 'generate_report':
      return generateReport(context);
    case 'simulate_scenario':
      return simulateScenario(context);
    default:
      return { type: 'text', value: `Intent ${intent} not handled by reporting-hub.` };
  }
}

module.exports = action;
module.exports.generateReport = generateReport;
module.exports.simulateScenario = simulateScenario;
