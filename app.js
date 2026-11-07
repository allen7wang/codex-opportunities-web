/* Local, dependency-free interview demos. All records below are fictional. */
(() => {
  "use strict";

  const quoteSamples = [
    "客户：华东工程\n产品：304不锈钢法兰\n规格：DN50 PN16\n数量：200件\n期望交期：15天\n备注：请提供报价和交期。",
    "客户：江海机电\n产品：不锈钢法兰\n规格：DN80 PN16\n数量：120件\n期望交期：7天\n备注：请尽快回复。"
  ];
  const catalog = [
    { product: "法兰", material: "304", dn: "DN50", pn: "PN16", base: 68, lead: 10 },
    { product: "法兰", material: "304", dn: "DN80", pn: "PN16", base: 106, lead: 12 },
    { product: "法兰", material: "316L", dn: "DN50", pn: "PN16", base: 112, lead: 15 },
    { product: "弯头", material: "304", dn: "DN50", pn: "PN16", base: 32, lead: 7 }
  ];
  const orderSample = `订单号,SKU,销售额,平台费,退款,平台结算,采购成本
A001,F01,500,75,0,425,250
A002,F02,300,45,0,250,140
A003,F01,450,67.5,450,-67.5,220
A004,F03,800,120,0,680,430
A005,F04,240,36,0,204,90`;
  const freightSample = `订单号,物流费
A001,35
A002,40
A003,30
A004,60`;
  const tenderSample = `项目：某园区设备采购（虚构）
【必须】营业执照在有效期内。
【必须】提供有效的 ISO9001 证书。
【必须】设备工作温度不低于 120℃。
【必须】合同签订后 30 天内交付。
【必须】提供近三年同类项目业绩至少 2 份。`;
  const projectSample = [
    { name: "签约预付款", due: "2026-09-15", amount: 20000, evidence: true, received: true },
    { name: "设计确认款", due: "2026-09-28", amount: 30000, evidence: true, received: false },
    { name: "现场验收款", due: "2026-10-07", amount: 40000, evidence: false, received: false },
    { name: "终验交付款", due: "2026-11-01", amount: 10000, evidence: false, received: false }
  ];
  const state = {
    tab: ["quote", "reconcile", "tender", "project"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "project",
    quote: { text: quoteSamples[0], sample: 0, markup: 22, result: null },
    reconcile: { orders: orderSample, freight: freightSample, result: null, error: "" },
    tender: { text: tenderSample, license: true, iso: false, temp: 130, days: 25, cases: 1, result: null },
    project: { asOf: "2026-10-03", rows: projectSample.map(x => ({ ...x })) }
  };
  const root = document.getElementById("demo-root");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => (Number(n) < 0 ? "-" : "") + "¥" + Math.abs(Number(n)).toLocaleString("zh-CN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  const metric = (label, value, hint) => `<div class="metric"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="hint">${esc(hint)}</div></div>`;
  const panel = (title, sub, body, tag = "演示数据") => `<section class="panel"><div class="panel-head"><div><h3>${esc(title)}</h3><p>${esc(sub)}</p></div><span class="tiny-tag">${esc(tag)}</span></div><div class="panel-body">${body}</div></section>`;
  const heading = (n, title, desc) => `<div class="demo-heading"><div><p class="eyebrow">SCENARIO ${n} / INTERACTIVE DEMO</p><h2>${esc(title)}</h2><p>${esc(desc)}</p></div><div class="status-line"><span></span>本地运行 · 可修改样例</div></div>`;
  const badge = (text, type) => `<span class="badge ${type}">${esc(text)}</span>`;
  const fact = (label, value) => `<div class="fact"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;

  function getLine(text, names) {
    for (const name of names) {
      const match = text.match(new RegExp(`(?:^|\\n)\\s*${name}\\s*[：:]\\s*([^\\n]+)`, "i"));
      if (match) return match[1].trim();
    }
    return "";
  }

  function analyzeQuote() {
    const raw = state.quote.text;
    const productLine = getLine(raw, ["产品", "品名"]);
    const specLine = getLine(raw, ["规格", "型号"]);
    const qtyLine = getLine(raw, ["数量"]);
    const leadLine = getLine(raw, ["期望交期", "交期"]);
    const material = (productLine + " " + specLine).match(/316L|304/i)?.[0].toUpperCase() || "";
    const product = /法兰/.test(productLine) ? "法兰" : /弯头/.test(productLine) ? "弯头" : "";
    const dn = specLine.match(/DN\s*(\d+)/i)?.[1];
    const pn = specLine.match(/PN\s*(\d+)/i)?.[1];
    const qty = Number(qtyLine.match(/\d+(?:\.\d+)?/)?.[0]);
    const lead = Number(leadLine.match(/\d+/)?.[0]);
    const missing = [];
    if (!getLine(raw, ["客户", "客户名称"])) missing.push("客户名称");
    if (!product) missing.push("产品类型");
    if (!material) missing.push("材质牌号");
    if (!dn || !pn) missing.push("口径或压力等级");
    if (!qty || qty <= 0) missing.push("有效数量");
    if (!lead || lead <= 0) missing.push("期望交期");
    const sku = catalog.find(x => x.product === product && x.material === material && x.dn === `DN${dn}` && x.pn === `PN${pn}`);
    if (!sku && missing.length === 0) missing.push("产品目录中未找到对应型号");
    const warnings = [];
    if (sku && lead && lead < sku.lead) warnings.push(`客户要求 ${lead} 天，目录参考交期为 ${sku.lead} 天`);
    if (sku) warnings.push("税费、运费、特殊工艺与最终价格需人工确认");
    return { customer: getLine(raw, ["客户", "客户名称"]) || "待确认", product, material, dn: dn ? `DN${dn}` : "", pn: pn ? `PN${pn}` : "", qty, lead, sku, missing, warnings };
  }

  function quoteDraft(result) {
    if (!result) return "";
    const unit = result.sku ? result.sku.base * (1 + state.quote.markup / 100) : null;
    return [`产品族技术例外草稿｜非正式报价，需人工复核`, `客户：${result.customer}`, `产品：${[result.material, result.product, result.dn, result.pn].filter(Boolean).join(" ") || "待确认"}`, `数量：${result.qty || "待确认"} 件`, `参考单价：${unit === null ? "待确认" : money(unit)}`, `参考总价：${unit === null ? "待确认" : money(unit * result.qty)}`, `客户期望交期：${result.lead || "待确认"} 天`, `目录参考交期：${result.sku?.lead || "待确认"} 天`, `待补事项：${result.missing.join("、") || "无"}`, `复核提醒：${result.warnings.join("；") || "无"}`, `说明：以上为虚构演示目录计算的技术例外草稿，不是正式报价，需确认成本、税费、运费和可供货情况。`].join("\n");
  }

  function renderQuote() {
    const s = state.quote, r = s.result;
    const unit = r?.sku ? r.sku.base * (1 + s.markup / 100) : null;
    const left = `<label class="field-label" for="quote-text">客户询价原文</label><textarea id="quote-text" class="textarea" spellcheck="false">${esc(s.text)}</textarea><p class="field-help">支持本演示中的“字段：内容”文本格式；真实 PDF / 邮件接入属于试点实施范围。</p><div class="input-row"><button class="btn" data-action="quote-analyze">模拟提取例外</button><button class="btn secondary" data-action="quote-sample">切换样例</button></div><div class="divider"></div><label class="select-wrap" for="quote-markup">演示加价率 <input id="quote-markup" class="control num" type="number" min="0" max="200" step="1" value="${esc(s.markup)}"> %</label><p class="footnote">目录基准价为虚构数据，演示加价率不是报价建议。</p>`;
    let right = `<div class="empty-state"><strong>等待分析询价</strong>可以修改左侧文字，再点击“模拟提取例外”。</div>`;
    if (r) {
      const fields = [fact("客户", r.customer), fact("产品与材质", `${r.material || "待确认"} ${r.product || "待确认"}`), fact("规格", `${r.dn || "待确认"} / ${r.pn || "待确认"}`), fact("数量与交期", `${r.qty || "待确认"} 件 / ${r.lead || "待确认"} 天`)].join("");
      const alerts = r.missing.length ? `<div class="message danger">需补充：${esc(r.missing.join("、"))}</div>` : `<div class="message success">关键字段已提取并匹配演示目录。</div>`;
      const cautions = r.warnings.length ? `<ul class="note-list">${r.warnings.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
      const pricing = r.sku ? `<div class="result-card"><h4>演示加价计算</h4><div class="price-line"><span>目录基准单价</span><b>${money(r.sku.base)}</b></div><div class="price-line"><span>演示加价后单价</span><b>${money(unit)}</b></div><div class="divider"></div><div class="price-line"><span>参考总价 · 未计税运 · 非正式报价</span><strong>${money(unit * r.qty)}</strong></div>${cautions}</div>` : `<div class="message warn">当前无法形成参考数字；先补齐规格并确认目录匹配。这不是正式报价。</div>`;
      right = `<p class="section-title">提取结果 / EXTRACTED FIELDS</p><div class="fact-grid">${fields}</div>${alerts}${pricing}<div class="input-row"><button class="btn accent" data-action="quote-download">下载技术例外草稿</button></div>`;
    }
    return `${heading("03", "产品族询价技术例外", "只处理一个产品族里销售不能直接确认的技术例外，整理给人工复核的草稿。不是通用 CPQ，也不是正式报价。")}<div class="metrics">${metric("原始输入", "1 份询价", "客户提供的文本")}${metric("目录覆盖", "4 个型号", "虚构演示目录")}${metric("关键动作", "人工复核", "确认例外是否成立")}</div><div class="work-grid">${panel("01 / 输入询价", "修改样例可重新分析", left)}${panel("02 / 技术例外草稿", "显示提取依据、缺项和参考价格", right, r ? "待复核" : "未分析")}</div>${callout("客户访谈切入点", "这个产品族里，哪些询价销售能直接答，哪些必须交给技术或生产确认？")}`;
  }

  function parseCsv(text, required) {
    const rows = []; let row = [], cell = "", quoted = false;
    const source = String(text).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (ch === '"' && quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) { row.push(cell.trim()); cell = ""; }
      else if (ch === "\n" && !quoted) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (quoted) throw new Error("CSV 存在未闭合的引号");
    row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
    if (rows.length < 2) throw new Error("CSV 至少需要表头和一行数据");
    const headers = rows.shift();
    const missing = required.filter(x => !headers.includes(x));
    if (missing.length) throw new Error(`缺少列：${missing.join("、")}`);
    return rows.map((cells, i) => {
      if (cells.length !== headers.length) throw new Error(`第 ${i + 2} 行列数与表头不一致`);
      return Object.fromEntries(headers.map((key, j) => [key, cells[j]]));
    });
  }

  function num(record, field, line) {
    const n = Number(record[field]);
    if (record[field] === "" || !Number.isFinite(n)) throw new Error(`第 ${line} 行“${field}”不是有效数字`);
    return n;
  }

  function analyzeReconcile() {
    const orders = parseCsv(state.reconcile.orders, ["订单号", "SKU", "销售额", "平台费", "退款", "平台结算", "采购成本"]);
    const freight = parseCsv(state.reconcile.freight, ["订单号", "物流费"]);
    const freightMap = new Map();
    freight.forEach((x, i) => {
      if (!x["订单号"]) throw new Error(`物流表第 ${i + 2} 行缺订单号`);
      if (freightMap.has(x["订单号"])) throw new Error(`物流表存在重复订单号：${x["订单号"]}`);
      freightMap.set(x["订单号"], num(x, "物流费", i + 2));
    });
    const seen = new Set();
    const rows = orders.map((x, i) => {
      const id = x["订单号"].trim();
      if (!id) throw new Error(`订单表第 ${i + 2} 行缺订单号`);
      if (seen.has(id)) throw new Error(`订单表存在重复订单号：${id}`);
      seen.add(id);
      const sales = num(x, "销售额", i + 2), fee = num(x, "平台费", i + 2), refund = num(x, "退款", i + 2), settlement = num(x, "平台结算", i + 2), cost = num(x, "采购成本", i + 2);
      const freightFee = freightMap.get(id), expected = sales - fee - refund;
      const diff = settlement - expected;
      const issues = [];
      if (Math.abs(diff) >= 0.01) issues.push(`结算差异 ${money(diff)}`);
      if (freightFee === undefined) issues.push("缺物流费");
      if (refund > 0) issues.push("有退款，需核实退货状态");
      return { id, sku: x.SKU, sales, fee, refund, settlement, cost, freightFee, expected, diff, contribution: freightFee === undefined ? null : settlement - freightFee - cost, issues };
    });
    const unusedFreight = [...freightMap.keys()].filter(id => !seen.has(id));
    return { rows, unusedFreight, exceptions: rows.filter(x => x.issues.length), absDiff: rows.reduce((sum, x) => sum + Math.abs(x.diff), 0) };
  }

  function renderReconcile() {
    const s = state.reconcile, r = s.result;
    const left = `<label class="field-label" for="orders-csv">平台订单与结算 CSV</label><textarea id="orders-csv" class="textarea csv" spellcheck="false">${esc(s.orders)}</textarea><div class="divider"></div><label class="field-label" for="freight-csv">物流费用 CSV</label><textarea id="freight-csv" class="textarea csv" spellcheck="false" style="min-height:117px">${esc(s.freight)}</textarea><p class="field-help">按订单号关联；可直接改数字、增加订单或粘贴同列名 CSV。</p><div class="input-row"><button class="btn" data-action="reconcile-analyze">模拟标出异常</button><button class="btn secondary" data-action="reconcile-reset">重置样例</button></div>${s.error ? `<div class="message danger">${esc(s.error)}</div>` : ""}`;
    let right = `<div class="empty-state"><strong>等待标出异常</strong>点击“模拟标出异常”后，逐笔检查结算差异、缺失物流费和退款。差额不是现金收入。</div>`;
    if (r) {
      const rows = r.rows.map(x => `<tr><td class="mono"><strong>${esc(x.id)}</strong><br>${esc(x.sku)}</td><td>${money(x.expected)}</td><td>${money(x.settlement)}</td><td>${Math.abs(x.diff) < .01 ? "—" : `<strong style="color:var(--red)">${money(x.diff)}</strong>`}</td><td>${x.contribution === null ? "待补物流费" : money(x.contribution)}</td><td>${x.issues.length ? x.issues.map(y => badge(y, /差异|缺/.test(y) ? "bad" : "warn")).join(" ") : badge("已核对", "ok")}</td></tr>`).join("");
      right = `<p class="section-title">ORDER-LEVEL AUDIT / 账单例外</p><div class="table-wrap"><table class="data-table"><thead><tr><th>订单 / SKU</th><th>应结算</th><th>实结算</th><th>差额</th><th>粗算贡献*</th><th>待处理</th></tr></thead><tbody>${rows}</tbody></table></div>${r.unusedFreight.length ? `<div class="message warn">物流表中 ${r.unusedFreight.length} 个订单未在订单表出现：${esc(r.unusedFreight.join("、"))}</div>` : ""}<p class="footnote">* 粗算贡献 = 平台结算 − 物流费 − 采购成本；不含广告、仓储、税费及退货商品残值，不能直接当作会计利润。</p><div class="input-row"><button class="btn accent" data-action="reconcile-download" ${r.exceptions.length ? "" : "disabled"}>导出异常清单</button></div>`;
    }
    return `${heading("04", "ERP外物流账单异常", "假设常规 ERP 费用已经配置，这里只标出仍需人工解释的物流账单例外。结算差额是演示差异，不是现金收入。")}<div class="metrics">${metric("订单数", r ? String(r.rows.length) : "—", "本次导入")}${metric("待核对", r ? String(r.exceptions.length) : "—", "差异 / 退款 / 缺项")}${metric("结算差额绝对值", r ? money(r.absDiff) : "—", "演示差异，不是现金收入")}</div><div class="work-grid">${panel("01 / 导入两张表", "样例格式可修改并重新运行", left, "CSV 样例")}${panel("02 / 账单异常清单", "逐笔展示计算和异常原因", right, r ? "已分析" : "未分析")}</div>${callout("客户访谈切入点", "现有 ERP 配置之后，还有哪些物流账单差异要人工逐笔解释？")}`;
  }

  function analyzeTender() {
    const s = state.tender;
    const lines = s.text.split(/\n/).map(x => x.trim()).filter(x => /必须|应当/.test(x));
    const results = lines.map(line => {
      let status = "manual", note = "未识别的要求，请人工判断并补充证据";
      if (/营业执照/.test(line)) { status = s.license ? "pass" : "gap"; note = s.license ? "已勾选持有有效营业执照；仍需核验证件" : "未提供营业执照信息"; }
      else if (/ISO\s*9001/i.test(line)) { status = s.iso ? "pass" : "gap"; note = s.iso ? "已勾选证书；仍需核验有效期与主体" : "未提供 ISO9001 证书"; }
      else if (/温度/.test(line)) {
        const required = Number(line.match(/(\d+)\s*℃/)?.[1]);
        if (required) { status = Number(s.temp) >= required ? "pass" : "gap"; note = `要求 ≥ ${required}℃；企业资料为 ${s.temp || 0}℃，需核实测试报告`; }
      } else if (/交付|交货/.test(line)) {
        const required = Number(line.match(/(\d+)\s*天/)?.[1]);
        if (required) { status = Number(s.days) <= required && Number(s.days) > 0 ? "pass" : "gap"; note = `要求 ≤ ${required} 天；企业计划 ${s.days || 0} 天，需核实排产`; }
      } else if (/业绩/.test(line)) {
        const required = Number(line.match(/(?:至少|不少于)\s*(\d+)\s*份|(?<!\d)(\d+)\s*份/)?.slice(1).find(Boolean));
        if (required) { status = Number(s.cases) >= required ? "pass" : "gap"; note = `要求 ≥ ${required} 份；企业资料 ${s.cases || 0} 份，需核实合同及验收材料`; }
      }
      return { source: line, status, note };
    });
    return { results, pass: results.filter(x => x.status === "pass").length, gap: results.filter(x => x.status === "gap").length, manual: results.filter(x => x.status === "manual").length };
  }

  function renderTender() {
    const s = state.tender, r = s.result;
    const left = `<label class="field-label" for="tender-text">招标文件摘录</label><textarea id="tender-text" class="textarea" spellcheck="false">${esc(s.text)}</textarea><p class="field-help">本演示按每行“【必须】…”提取；可加一条新要求，查看人工复核提示。</p><div class="divider"></div><p class="section-title">企业资料 · 可修改</p><div class="check-grid"><label class="check-card"><input type="checkbox" data-tender="license" ${s.license ? "checked" : ""}>营业执照有效</label><label class="check-card"><input type="checkbox" data-tender="iso" ${s.iso ? "checked" : ""}>持有 ISO9001</label><label class="check-card">设备最高工作温度 <input class="control" type="number" min="0" data-tender="temp" value="${esc(s.temp)}"> ℃</label><label class="check-card">预计交付 <input class="control" type="number" min="1" data-tender="days" value="${esc(s.days)}"> 天</label><label class="check-card full">近三年同类业绩 <input class="control" type="number" min="0" data-tender="cases" value="${esc(s.cases)}"> 份</label></div><div class="input-row"><button class="btn" data-action="tender-analyze">模拟预检</button><button class="btn secondary" data-action="tender-reset">重置样例</button></div>`;
    let right = `<div class="empty-state"><strong>等待模拟预检</strong>检查“必须”要求与企业资料。未映射条款保持人工判断，不代表资格已经审定。</div>`;
    if (r) {
      const table = r.results.map((x, i) => `<tr><td class="mono">${String(i + 1).padStart(2, "0")}</td><td><strong>${esc(x.source)}</strong></td><td>${badge(x.status === "pass" ? "资料显示满足" : x.status === "gap" ? "有缺口" : "人工判断", x.status === "pass" ? "ok" : x.status === "gap" ? "bad" : "warn")}</td><td>${esc(x.note)}</td></tr>`).join("");
      right = r.results.length ? `<div class="message ${r.gap ? "danger" : r.manual ? "warn" : "success"}">${r.gap ? `预检发现 ${r.gap} 项证据缺口，不代表资格已经审定。` : r.manual ? "未发现已识别条款的缺口，未映射项仍须人工判断，不代表资格已经审定。" : "已识别条款在输入资料中有对应；这不是资格审定，仍须逐项核验原件。"}</div><div class="table-wrap"><table class="data-table"><thead><tr><th>序号</th><th>要求原文</th><th>预检状态</th><th>依据与下一步</th></tr></thead><tbody>${table}</tbody></table></div><p class="footnote">预检只比较演示输入，未映射条款保持人工判断，不能替代完整招标文件、资格审查或法律意见，也不代表资格已经审定。</p><div class="input-row"><button class="btn accent" data-action="tender-download">导出证据缺口清单</button></div>` : `<div class="message warn">没有找到带“必须”或“应当”的条目。请按样例格式输入要求。</div>`;
    }
    return `${heading("02", "单品类投标证据预检", "只对一个品类的招标摘录做证据预检。未映射条款保持人工判断，不代表资格已经审定。")}<div class="metrics">${metric("提取要求", r ? String(r.results.length) : "—", "来自左侧文本")}${metric("资料缺口", r ? String(r.gap) : "—", "应由业务人员处理")}${metric("人工判断", r ? String(r.manual) : "—", "未映射的要求")}</div><div class="work-grid">${panel("01 / 招标要求与资料", "修改参数，观察预检结果变化", left)}${panel("02 / 证据预检清单", "原文、初步状态和待办并列；未映射项保持人工判断", right, r ? "需人工核验" : "未分析")}</div>${callout("客户访谈切入点", "最近一次投标，哪些证据要人工核对？未映射的要求不要当成已经审定。")}`;
  }

  function dayDelta(a, b) {
    const first = Date.parse(`${a}T00:00:00Z`), second = Date.parse(`${b}T00:00:00Z`);
    return Number.isFinite(first) && Number.isFinite(second) ? Math.round((first - second) / 86400000) : null;
  }

  function projectSummary() {
    const s = state.project;
    const rows = s.rows.map(x => {
      const days = dayDelta(x.due, s.asOf);
      let status = "normal", action = "按计划整理开票材料";
      if (x.received) { status = "paid"; action = "演示已标收款，归档凭证供开票条件复核"; }
      else if (days === null) { status = "invalid"; action = "修正到期日期"; }
      else if (days < 0) { status = "overdue"; action = x.evidence ? `演示日期已过 ${-days} 天，证据已勾选，只可讨论开票准备` : `演示日期已过 ${-days} 天，先补齐验收证据`; }
      else if (days <= 7) { status = "soon"; action = x.evidence ? `距演示到期还有 ${days} 天，核对开票材料` : `距演示到期还有 ${days} 天，补齐验收证据`; }
      else if (!x.evidence) { status = "prepare"; action = "提前整理验收证据"; }
      return { ...x, days, status, action };
    });
    return { rows, overdue: rows.filter(x => x.status === "overdue"), attention: rows.filter(x => ["overdue", "soon", "prepare", "invalid"].includes(x.status)), missingEvidence: rows.filter(x => !x.evidence && !x.received) };
  }

  function renderProject() {
    const s = state.project, r = projectSummary();
    const left = `<label class="field-label" for="project-date">模拟查看日期</label><input id="project-date" class="control date" type="date" value="${esc(s.asOf)}"><p class="field-help">改变日期或勾选状态，右侧开票准备清单会立即更新。</p><div class="divider"></div><p class="section-title">项目里程碑 · 可修改</p><div class="table-wrap"><table class="data-table"><thead><tr><th>阶段</th><th>到期日</th><th>演示金额</th><th>验收证据</th><th>演示已标收款</th></tr></thead><tbody>${s.rows.map((x, i) => `<tr><td><strong>${esc(x.name)}</strong></td><td><input class="control project-row-control date" type="date" data-project-row="${i}" data-project-field="due" value="${esc(x.due)}"></td><td><input class="control project-row-control" type="number" min="0" step="100" data-project-row="${i}" data-project-field="amount" value="${esc(x.amount)}"></td><td><input class="checkbox-small" type="checkbox" data-project-row="${i}" data-project-field="evidence" ${x.evidence ? "checked" : ""}></td><td><input class="checkbox-small" type="checkbox" data-project-row="${i}" data-project-field="received" ${x.received ? "checked" : ""}></td></tr>`).join("")}</tbody></table></div><div class="input-row"><button class="btn secondary" data-action="project-reset">重置样例</button></div>`;
    const statusText = { paid: ["演示已标收款", "ok"], overdue: ["日期已过", "bad"], soon: ["临近到期", "warn"], prepare: ["待备证据", "warn"], invalid: ["日期有误", "bad"], normal: ["计划中", "grey"] };
    const right = `<p class="section-title">INVOICE PREP / 开票准备清单</p><div class="table-wrap"><table class="data-table"><thead><tr><th>里程碑</th><th>演示金额</th><th>状态</th><th>建议下一步</th></tr></thead><tbody>${r.rows.map(x => `<tr><td><strong>${esc(x.name)}</strong><br><span class="mono">${esc(x.due)}</span></td><td>${money(x.amount)}</td><td>${badge(...statusText[x.status])}</td><td>${esc(x.action)}</td></tr>`).join("")}</tbody></table></div><div class="message ${r.overdue.length ? "danger" : "success"}">${r.overdue.length ? `按演示日期，${r.overdue.length} 个节点已过期且未标收款。先补验收证据，再讨论能否进入开票准备。` : "按演示日期，没有过期且未标收款的节点。"}</div><div class="input-row"><button class="btn accent" data-action="project-download">导出开票准备清单</button></div><p class="footnote">清单按输入日期和勾选状态计算，只用于开票准备讨论。表内金额是演示账上数字，不是收入。合同和实际开票需在系统外确认。</p>`;
    return `${heading("01", "验收证据到开票准备", "按虚构里程碑查看验收证据是否齐备，整理开票准备清单。不代做开票，也不把账上数字写成收入。")}<div class="metrics">${metric("缺验收证据", String(r.missingEvidence.length), "未标收款且材料未齐")}${metric("日期已过", String(r.overdue.length), "演示状态，不是收入")}${metric("待准备节点", String(r.attention.length), "含临近、过期与缺材料")}</div><div class="work-grid">${panel("01 / 合同里程碑", "现场修改日期、金额和进度", left)}${panel("02 / 开票准备清单", "按日期和证据状态列出下一步", right, "动态计算")}</div>${callout("客户访谈切入点", "验收之后，哪些证据还没交到财务，因此开票准备停住了？")}`;
  }

  function callout(title, body) { return `<div class="callout"><span class="icon">↗</span><div><strong>${esc(title)}</strong><p>${esc(body)}</p></div></div>`; }
  function downloadFile(name, content, type = "text/plain;charset=utf-8") {
    const blob = new Blob([type.startsWith("text/csv") ? "\uFEFF" + content : content], { type });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function csvCell(x) { return `"${String(x ?? "").replace(/"/g, '""')}"`; }
  function csv(rows) { return rows.map(row => row.map(csvCell).join(",")).join("\r\n"); }

  function render() {
    document.querySelectorAll("[data-tab]").forEach(button => {
      const active = button.dataset.tab === state.tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    root.innerHTML = ({ quote: renderQuote, reconcile: renderReconcile, tender: renderTender, project: renderProject })[state.tab]();
  }

  function markStale() {
    const body = root.querySelector(".work-grid .panel:nth-child(2) .panel-body");
    if (!body) return;
    if (!body.querySelector("[data-stale]")) body.insertAdjacentHTML("afterbegin", '<div class="message warn" data-stale>输入已修改。请重新运行，当前结果仅对应上一次输入。</div>');
    body.querySelectorAll('button[data-action$="-download"]').forEach(button => { button.disabled = true; });
  }

  document.addEventListener("click", event => {
    const tab = event.target.closest("[data-tab]");
    if (tab) { state.tab = tab.dataset.tab; location.hash = state.tab; render(); return; }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "quote-analyze") state.quote.result = analyzeQuote();
    else if (action === "quote-sample") { state.quote.sample = 1 - state.quote.sample; state.quote.text = quoteSamples[state.quote.sample]; state.quote.result = null; }
    else if (action === "quote-download") downloadFile("产品族技术例外草稿-演示.txt", quoteDraft(state.quote.result));
    else if (action === "reconcile-analyze") { try { state.reconcile.result = analyzeReconcile(); state.reconcile.error = ""; } catch (e) { state.reconcile.result = null; state.reconcile.error = e.message; } }
    else if (action === "reconcile-reset") { state.reconcile.orders = orderSample; state.reconcile.freight = freightSample; state.reconcile.result = null; state.reconcile.error = ""; }
    else if (action === "reconcile-download") {
      const rows = [["订单号", "SKU", "问题", "应结算", "实结算", "差额", "处理状态"], ...state.reconcile.result.exceptions.map(x => [x.id, x.sku, x.issues.join("；"), x.expected, x.settlement, x.diff, "待人工核对"])];
      downloadFile("ERP外物流账单异常清单-演示.csv", csv(rows), "text/csv;charset=utf-8");
    } else if (action === "tender-analyze") state.tender.result = analyzeTender();
    else if (action === "tender-reset") state.tender = { text: tenderSample, license: true, iso: false, temp: 130, days: 25, cases: 1, result: null };
    else if (action === "tender-download") {
      const rows = [["要求原文", "状态", "依据与下一步"], ...state.tender.result.results.filter(x => x.status !== "pass").map(x => [x.source, x.status === "gap" ? "有缺口" : "人工判断", x.note])];
      downloadFile("投标证据缺口清单-演示.csv", csv(rows), "text/csv;charset=utf-8");
    } else if (action === "project-reset") state.project = { asOf: "2026-10-03", rows: projectSample.map(x => ({ ...x })) };
    else if (action === "project-download") {
      const rows = [["里程碑", "到期日", "应收金额", "状态", "建议下一步"], ...projectSummary().attention.map(x => [x.name, x.due, x.amount, x.status, x.action])];
      downloadFile("验收证据到开票准备清单-演示.csv", csv(rows), "text/csv;charset=utf-8");
    }
    render();
  });

  document.addEventListener("input", event => {
    const target = event.target;
    if (target.id === "quote-text") { const hadResult = !!state.quote.result; state.quote.text = target.value; state.quote.result = null; if (hadResult) markStale(); }
    else if (target.id === "quote-markup") state.quote.markup = Number(target.value) || 0;
    else if (target.id === "orders-csv") { const hadResult = !!state.reconcile.result; state.reconcile.orders = target.value; state.reconcile.result = null; if (hadResult) markStale(); }
    else if (target.id === "freight-csv") { const hadResult = !!state.reconcile.result; state.reconcile.freight = target.value; state.reconcile.result = null; if (hadResult) markStale(); }
    else if (target.id === "tender-text") { const hadResult = !!state.tender.result; state.tender.text = target.value; state.tender.result = null; if (hadResult) markStale(); }
  });

  document.addEventListener("change", event => {
    const target = event.target;
    if (target.dataset.tender) { state.tender[target.dataset.tender] = target.type === "checkbox" ? target.checked : Number(target.value); state.tender.result = null; render(); }
    else if (target.id === "project-date") { state.project.asOf = target.value; render(); }
    else if (target.dataset.projectField) {
      const row = state.project.rows[Number(target.dataset.projectRow)], field = target.dataset.projectField;
      row[field] = target.type === "checkbox" ? target.checked : target.type === "number" ? Number(target.value) : target.value;
      render();
    } else if (target.id === "quote-markup" && state.quote.result) render();
  });
  window.addEventListener("hashchange", () => { const tab = location.hash.slice(1); if (["quote", "reconcile", "tender", "project"].includes(tab)) { state.tab = tab; render(); } });
  render();
})();
