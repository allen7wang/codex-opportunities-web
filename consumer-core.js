/* Dependency-free demo rules. No model calls, accounts, payments, or telemetry. */
(function (host) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fen = value => {
    const s = String(value).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(s)) throw new Error('金额须为非负数，最多两位小数；方向由交易类型决定。');
    const [a,b=''] = s.split('.');
    const n = Number(a) * 100 + Number(b.padEnd(2,'0'));
    if (!Number.isSafeInteger(n) || n > 100000000000) throw new Error('金额超出本演示范围。');
    return n;
  };
  function integer(value, label, min, max) {
    if (String(value).trim() === '' || !Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) throw new Error(`${label}须为 ${min}–${max} 的整数。`);
    return Number(value);
  }
  function parseCsv(text, required) {
    const source = String(text).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
    if (source.length > 2000000) throw new Error('演示文本上限为 200 万字符。');
    const rows=[]; let row=[], cell='', quoted=false, closed=false;
    const push=()=>{row.push(cell.trim());cell='';closed=false;};
    for(let i=0;i<source.length;i++){
      const ch=source[i];
      if(quoted){if(ch==='"'&&source[i+1]==='"'){cell+='"';i++;}else if(ch==='"'){quoted=false;closed=true;}else cell+=ch;}
      else if(ch==='"'){if(cell.trim()||closed)throw new Error('CSV 引号位置不正确。');quoted=true;}
      else if(ch===','){push();}
      else if(ch==='\n'){push();if(row.some(Boolean))rows.push(row);row=[];}
      else {if(closed&&ch.trim())throw new Error('CSV 闭合引号后有多余文字。');cell+=ch;}
    }
    if(quoted)throw new Error('CSV 引号未闭合。');
    push();if(row.some(Boolean))rows.push(row);
    if(rows.length<2)throw new Error('至少需要表头和一行数据。');
    const header=rows.shift();
    if(new Set(header).size!==header.length)throw new Error('CSV 表头不能重复。');
    const missing=required.filter(x=>!header.includes(x));
    if(missing.length)throw new Error(`缺少列：${missing.join('、')}`);
    if(rows.length>3000)throw new Error('本演示最多支持 3000 行。');
    return rows.map((cells,i)=>{if(cells.length!==header.length)throw new Error(`第 ${i+2} 行列数不一致。`);return {...Object.fromEntries(header.map((k,j)=>[k,cells[j]])),_line:i+2};});
  }
  function csv(rows){
    return '\uFEFF'+rows.map(row=>row.map(x=>{
      let s=String(x??'');
      if(typeof x!=='number' && /^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;
      return '"'+s.replace(/"/g,'""')+'"';
    }).join(',')).join('\r\n');
  }
  function career(input){
    const requirements=String(input.jd).split(/\n/).map(x=>x.trim()).filter(Boolean);
    if(!requirements.length)throw new Error('请先填写至少一条岗位要求。');
    if(String(input.jd).length>10000 || String(input.story).length>5000)throw new Error('岗位要求最多 10000 字，项目经历最多 5000 字。');
    if(!String(input.story).trim())throw new Error('请填写一段真实经历，或载入虚构样例。');
    const checks=[];
    let change=null;
    if(String(input.before).trim()==='' || String(input.after).trim()==='')checks.push({status:'unknown',title:'结果口径尚不完整',detail:'补充变化前后数值，才能区分相对提升与百分点。',source:input.story});
    else{
      const before=Number(input.before),after=Number(input.after);
      if(!Number.isFinite(before)||!Number.isFinite(after)||before<0||before>100||after<0||after>100)throw new Error('本场景的前后数值是百分比，须在 0–100 之间。');
      change={before,after,points:Math.round((after-before)*10000)/10000,relative:before===0?null:Math.round((after/before-1)*10000)/100};
      checks.push({status:'ok',title:'变化口径已展开',detail:`${before}% → ${after}%：变化 ${change.points} 个百分点；${change.relative===null?'基数为 0，相对变化不可计算':`相对变化 ${change.relative}%`}。`,source:'用户填写的前后数值'});
    }
    const own=String(input.contribution).trim();
    checks.push(own?{status:'ok',title:'本人贡献已记录',detail:own,source:'用户自述，未经外部核实'}:{status:'unknown',title:'需要补充本人贡献',detail:'你具体完成了哪一步？不要把团队全部成果写为个人贡献。',source:input.story});
    const limits={observation:'这是观察结果，不足以证明由你的行动导致。',controlled:'已记录“有对照”的用户声明；仍需核对分组、口径与偏差。',unknown:'因果依据未提供，建议用“观察到”描述结果。'};
    checks.push({status:input.method==='unknown'?'unknown':'warn',title:'结果与因果分开',detail:limits[input.method]||limits.unknown,source:'用户选择的验证方式'});
    const unknown=checks.filter(c=>c.status==='unknown').length;
    const draft=[own?`我负责${own.replace(/[。；]$/,'')}。`:'【待补充本人具体工作】',change?`该观察期指标由 ${change.before}% 变为 ${change.after}%，变化 ${change.points} 个百分点${change.relative===null?'':`（相对变化 ${change.relative}%）`}。`:'【待补充变化前后的指标口径】',input.method==='controlled'?'对照设计及其有效性仍需核查。':'这是观察结果，尚不能据此确认因果关系。'].join('');
    const questions=[!own?'你独立负责的动作和团队其他人的动作分别是什么？':'你的具体工作如何被他人或记录验证？',!change?'变化前后的基数、分母和时间窗是什么？':'前后两组用户构成是否相同，分母和统计周期一致吗？',input.method==='controlled'?'对照分组如何形成，有哪些可能的选择偏差？':'除这次行动之外，还有什么可能解释指标变化？'];
    return {requirements,checks,change,unknown,draft,questions,scope:'本地规则演示；不是专业评分或录用预测。'};
  }
  function documentCheck(rules,files,mapping,confirmed){
    if(files.length>20)throw new Error('最多选择 20 个文件。');
    if(files.some(f=>f.size>10000000)||files.reduce((s,f)=>s+f.size,0)>100000000)throw new Error('单文件最多 10 MB，合计最多 100 MB。');
    const rows=rules.map(rule=>{
      const maxKB=integer(rule.maxKB,`${rule.label}大小上限`,1,10000);
      const file=files.find(f=>f.id===mapping[rule.id]);
      if(!file)return {...rule,status:'missing',reason:'尚未匹配文件',file:null};
      const problems=[];
      if(file.type!==rule.type)problems.push(`需 ${rule.type.toUpperCase()}，检测为 ${file.type==='unknown'?'未知格式':file.type.toUpperCase()}`);
      if(file.size>maxKB*1000)problems.push(`超过 ${maxKB} KB 上限`);
      if(Object.values(mapping).filter(id=>id===file.id).length>1)problems.push('同一文件匹配了多项，请重新确认对应关系');
      const status=problems.length?'fail':confirmed[rule.id]?'ok':'unknown';
      return {...rule,file,status,reason:problems.join('；')||(status==='ok'?'格式符合且用户已确认内容可读':'格式符合；内容、适用性与可读性待用户确认')};
    });
    return {rows,passed:rows.filter(r=>r.status==='ok').length,pending:rows.filter(r=>r.status!=='ok').length,scope:'只检查文件签名、大小与匹配；不检查 PDF 页数、资格、真实性，不进行压缩。'};
  }
  function capacity(input){
    const count=integer(input.count,'计划题量',1,200),repeats=integer(input.repeats,'每题练习次数',1,10),rounds=integer(input.rounds,'可用轮次',1,20);
    const demand=count*repeats,slots=rounds*10;
    return {count,repeats,rounds,demand,slots,shortfall:Math.max(0,demand-slots),fits:demand<=slots,maxQuestions:Math.floor(slots/repeats)};
  }
  function gradeNumeric(answer,expected,confidence,streak=0){
    const numeric=v=>/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(String(v).trim());
    if(!numeric(answer)||!numeric(expected))throw new Error('请输入有效数值；本演示不判主观题和含单位的文本答案。');
    const a=Number(answer),e=Number(expected);
    if(!Number.isFinite(a)||!Number.isFinite(e))throw new Error('数值无效。');
    const correct=Math.abs(a-e)<1e-9;
    const nextStreak=correct&&confidence==='high'?streak+1:0;
    const days=nextStreak>=2?7:nextStreak===1?3:1;
    return {correct,answer:a,expected:e,confidence,streak:nextStreak,days,reason:!correct?'本轮回答有误，建议明天再练。':confidence!=='high'?'答对但把握不足，建议明天再练。':nextStreak>=2?'连续两次有把握地答对，建议 7 天后复习。':'本轮有把握地答对，建议 3 天后复习。'};
  }
  function bill(text,month,decisions={}){
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('请选择有效账期。');
    const data=parseCsv(text,['交易ID','日期','账户','类型','金额','关联ID','说明']);
    const types=['支出','退款','转账','收入'];
    const rows=data.map((x,i)=>{
      if(!x.交易ID||!x.账户)throw new Error(`第 ${x._line} 行缺少交易ID或账户。`);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(x.日期)||!Number.isFinite(Date.parse(x.日期+'T00:00:00Z'))||new Date(x.日期+'T00:00:00Z').toISOString().slice(0,10)!==x.日期)throw new Error(`第 ${x._line} 行日期无效，使用 YYYY-MM-DD。`);
      if(!types.includes(x.类型))throw new Error(`第 ${x._line} 行类型仅支持支出、退款、转账、收入。`);
      let amount;try{amount=fen(x.金额);}catch(e){throw new Error(`第 ${x._line} 行：${e.message}`);}
      return {index:i,line:x._line,id:x.交易ID,date:x.日期,account:x.账户,type:x.类型,amount,sign:['退款','收入'].includes(x.类型)?-amount:amount,reference:x.关联ID,note:x.说明,key:JSON.stringify([x.账户,x.类型,x.交易ID]),signature:JSON.stringify([x.日期,amount,x.关联ID]),category:'pending',reason:'',candidate:null,decision:decisions[i]||'pending'};
    });
    const groups=new Map();
    rows.forEach(r=>{if(!groups.has(r.key))groups.set(r.key,[]);groups.get(r.key).push(r);});
    const refundAllocated=new Map();
    rows.forEach(r=>{
      if(r.date.slice(0,7)!==month){r.category='outside';r.reason='不在所选账期';return;}
      const group=groups.get(r.key);
      if(new Set(group.map(x=>x.signature)).size>1){r.reason='相同交易键的字段冲突，需回查原文件';r.candidate='conflict';return;}
      if(group[0].index!==r.index){
        r.candidate='duplicate';r.reason=`与第 ${group[0].line} 行的交易键和金额一致，等待确认`;
        if(r.decision==='exclude_duplicate'){r.category='duplicate';r.reason='用户已确认排除重复；原始行保留';return;}
        if(r.decision!=='keep')return;
        if(r.type==='支出'||r.type==='收入'){r.category='included';r.reason='用户决定保留为独立记录';return;}
        r.reason='退款或转账重复行不能直接计入，需先更正输入';return;
      }
      if(r.type==='支出'||r.type==='收入'){r.category='included';r.reason='按原始记录计入，未验证交易真实性';return;}
      if(r.type==='转账'){
        r.candidate='transfer';r.reason='需确认是否为自有账户互转';
        if(r.decision==='internal_transfer'){r.category='transfer';r.reason='用户确认自有账户互转，已排除';}
        else if(r.decision==='keep'){r.category='included';r.reason='用户确认作为对外支出计入';}
        return;
      }
      const purchases=rows.filter(p=>p.type==='支出'&&p.id===r.reference&&p.account===r.account&&groups.get(p.key)[0].index===p.index&&new Set(groups.get(p.key).map(g=>g.signature)).size===1);
      const purchase=purchases.length===1?purchases[0]:null;
      r.candidate=purchase?'refund':'orphan';
      if(purchase){
        const allocated=refundAllocated.get(purchase.key)||0;
        if(r.amount+allocated>purchase.amount){r.candidate='overrefund';r.reason='累计确认退款将超过原消费，不能自动关联';return;}
        r.reason=`指向 ${purchase.id}，退款 ¥${(r.amount/100).toFixed(2)}，待确认`;
        if(r.decision==='confirm_refund'){r.category='included';refundAllocated.set(purchase.key,allocated+r.amount);r.reason='用户确认退款，按当期现金净流出计入';}
      }else{
        r.reason='未找到唯一原消费，保留待核对';
        if(r.decision==='standalone_refund'){r.category='included';r.reason='用户确认退款性质；原消费未载入，不补造前期支出';}
      }
    });
    const totals={raw:0,included:0,duplicate:0,transfer:0,pending:0,outside:0};
    rows.forEach(r=>{totals.raw+=r.sign;totals[r.category]+=r.sign;});
    const bridge=totals.included+totals.duplicate+totals.transfer+totals.pending+totals.outside;
    if(bridge!==totals.raw)throw new Error('内部桥接错误，已阻止结果导出。');
    return {rows,totals,pendingCount:rows.filter(r=>r.category==='pending').length,month,scope:'个人人民币演示CSV；金额为净流出口径，未决项不隐藏，不验证银行余额。'};
  }
  function detectType(bytes){
    if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'jpg';
    if([137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x))return 'png';
    if(new TextDecoder().decode(bytes.slice(0,5))==='%PDF-')return 'pdf';
    return 'unknown';
  }
  const crcTable=Array.from({length:256},(_,i)=>{let n=i;for(let j=0;j<8;j++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  const crc32=bytes=>{let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  function zipStore(entries){
    const enc=new TextEncoder(),parts=[],central=[];let offset=0;
    const header=(size,signature)=>{const b=new Uint8Array(size);new DataView(b.buffer).setUint32(0,signature,true);return b;};
    for(const entry of entries){
      if(entry.name.includes('..')||entry.name.startsWith('/')||entry.name.includes('\\'))throw new Error('无效的导出路径。');
      const name=enc.encode(entry.name),data=typeof entry.data==='string'?enc.encode(entry.data):entry.data,crc=crc32(data);
      const h=header(30,0x04034b50),v=new DataView(h.buffer);
      v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);
      parts.push(h,name,data);
      const c=header(46,0x02014b50),cv=new DataView(c.buffer);
      cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);
      central.push(c,name);offset+=h.length+name.length+data.length;
    }
    const size=central.reduce((s,b)=>s+b.length,0),end=header(22,0x06054b50),view=new DataView(end.buffer);
    view.setUint16(8,entries.length,true);view.setUint16(10,entries.length,true);view.setUint32(12,size,true);view.setUint32(16,offset,true);
    const all=[...parts,...central,end],out=new Uint8Array(offset+size+22);let position=0;
    all.forEach(b=>{out.set(b,position);position+=b.length;});return out;
  }
  const api={esc,fen,integer,parseCsv,csv,career,documentCheck,capacity,gradeNumeric,bill,detectType,crc32,zipStore};
  host.ConsumerCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis==='undefined'?window:globalThis);
