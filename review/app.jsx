const { useState, useEffect, useRef, useCallback } = React;

const EMPTY_DRAFT = {
  merchantId: "",
  merchantName: "",
  uniqueId: "",
  biz: "履约",
  status: "待匹配",
  start: "",
  end: "",
  incomingTxn: "",
};

const EMPTY_FORM = {
  merchantId: "",
  merchantName: "",
  uniqueId: "",
  biz: "履约",
  amount: "",
  currency: "USD",
  operator: "陈予安",
};

function dayOf(value) {
  return value ? value.slice(0, 10) : "";
}

function formatDay(iso) {
  if (!iso) return "";
  const parts = iso.split("-");
  return parts[0] + "-" + parts[1] + "-" + Number(parts[2]);
}

function nowStamp() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

function openPicker(ref) {
  const el = ref.current;
  if (!el) return;
  if (typeof el.showPicker === "function") {
    try {
      el.showPicker();
      return;
    } catch (err) {
      /* 某些浏览器禁止未聚焦时打开选择器 */
    }
  }
  el.focus();
}

function matches(row, query) {
  if (query.merchantId && row.merchantId.indexOf(query.merchantId.trim()) < 0) return false;
  if (query.merchantName && row.merchantName.indexOf(query.merchantName.trim()) < 0) return false;
  const unique = query.uniqueId.trim().toLowerCase();
  if (unique && row.uniqueId.toLowerCase().indexOf(unique) < 0) return false;
  if (query.biz !== "全部" && row.biz !== query.biz) return false;
  if (query.status !== "全部" && row.status !== query.status) return false;
  const txn = query.incomingTxn.trim().toLowerCase();
  if (txn && row.incomingTxn.toLowerCase().indexOf(txn) < 0) return false;
  const day = dayOf(row.submitAt);
  if (query.start && day < query.start) return false;
  if (query.end && day > query.end) return false;
  return true;
}

function pageWindow(page, pages) {
  const size = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(pages, start + size - 1);
  start = Math.max(1, end - size + 1);
  const list = [];
  for (let i = start; i <= end; i += 1) list.push(i);
  return list;
}

function exportCsv(records) {
  const columns = ["商户ID", "商户名称", "商户唯一标识", "子业务名称", "提交时间", "提交人", "转账金额", "审核状态", "入账交易ID"];
  const lines = [columns].concat(
    records.map((row) => [
      row.merchantId,
      row.merchantName,
      row.uniqueId,
      row.biz,
      row.submitAt,
      row.operator,
      row.amountText,
      row.status,
      row.incomingTxn,
    ])
  );
  const csv = lines
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "转账审核-模拟数据.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Select({ value, options, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    function onDoc(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div className={"select" + (open ? " open" : "")} ref={ref}>
      <button type="button" className="control select-btn" onClick={() => setOpen((flag) => !flag)} aria-expanded={open} aria-label={label}>
        <span>{value}</span>
        <Icon name="chevron" size={14} />
      </button>
      {open ? (
        <div className="select-menu" role="listbox">
          {options.map((item) => (
            <button
              type="button"
              key={item}
              className={item === value ? "on" : ""}
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DateRange({ start, end, onStart, onEnd }) {
  const startRef = useRef(null);
  const endRef = useRef(null);
  return (
    <div className="control range">
      <button type="button" className={"range-text" + (start ? "" : " placeholder")} onClick={() => openPicker(startRef)}>
        {start ? formatDay(start) : "开始日期"}
      </button>
      <span className="range-arrow">→</span>
      <button type="button" className={"range-text" + (end ? "" : " placeholder")} onClick={() => openPicker(endRef)}>
        {end ? formatDay(end) : "结束日期"}
      </button>
      <span className="calendar">
        <Icon name="calendar" size={14} />
      </span>
      <input ref={startRef} className="picker-proxy" type="date" value={start} onChange={(event) => onStart(event.target.value)} aria-label="开始日期" tabIndex={-1} />
      <input ref={endRef} className="picker-proxy" type="date" value={end} onChange={(event) => onEnd(event.target.value)} aria-label="结束日期" tabIndex={-1} />
    </div>
  );
}

function Pager({ total, page, pages, pageSize, onPage, onSize }) {
  const nums = pageWindow(page, pages);
  return (
    <div className="pager">
      <div className="pager-left">
        <span>共 {total} 条记录</span>
        <select value={pageSize} onChange={(event) => onSize(Number(event.target.value))} aria-label="每页条数">
          <option value="10">10条/页</option>
          <option value="20">20条/页</option>
          <option value="50">50条/页</option>
        </select>
      </div>
      <div className="pager-pages">
        <button type="button" className="page-btn text" disabled={page <= 1} onClick={() => onPage(1)} aria-label="首页">|&lt;</button>
        <button type="button" className="page-btn text" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 5))} aria-label="向前5页">&lt;&lt;</button>
        <button type="button" className="page-btn text" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="上一页">&lt;</button>
        {nums.map((num) => (
          <button type="button" key={num} className={"page-btn" + (num === page ? " on" : "")} onClick={() => onPage(num)}>
            {num}
          </button>
        ))}
        <button type="button" className="page-btn text" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="下一页">&gt;</button>
        <button type="button" className="page-btn text" disabled={page >= pages} onClick={() => onPage(Math.min(pages, page + 5))} aria-label="向后5页">&gt;&gt;</button>
        <button type="button" className="page-btn text" disabled={page >= pages} onClick={() => onPage(pages)} aria-label="末页">&gt;|</button>
      </div>
    </div>
  );
}

function Field({ label, error, children, wide }) {
  return (
    <label className={"field" + (wide ? " full" : "")}>
      <span>{label}</span>
      {children}
      {error ? <em className="err">{error}</em> : null}
    </label>
  );
}

function CreateDialog({ onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  function submit() {
    const next = {};
    if (!/^\d{4,8}$/.test(form.merchantId.trim())) next.merchantId = "请填写 4 到 8 位商户 ID";
    if (!form.merchantName.trim()) next.merchantName = "请填写商户名称";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.uniqueId.trim())) next.uniqueId = "请填写有效的商户标识";
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) next.amount = "请填写大于 0 的金额";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({
      merchantId: form.merchantId.trim(),
      merchantName: form.merchantName.trim(),
      uniqueId: form.uniqueId.trim(),
      biz: form.biz,
      amount: Math.round(amount * 100) / 100,
      currency: form.currency,
      operator: form.operator,
    });
  }

  return (
    <div className="mask" onMouseDown={onClose}>
      <div className="dialog wide" role="dialog" aria-modal="true" aria-labelledby="create-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-hd">
          <h2 id="create-title">代客提交线下转账</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <Icon name="close" size={16} />
          </button>
        </div>
        <p className="hint">代商户登记一笔线下到账。提交后进入待匹配，等待入账交易核对。</p>
        <div className="form-grid">
          <Field label="商户ID" error={errors.merchantId}>
            <input className="control" value={form.merchantId} placeholder="请输入商户ID" onChange={(event) => set("merchantId")(event.target.value)} />
          </Field>
          <Field label="商户名称" error={errors.merchantName}>
            <input className="control" value={form.merchantName} placeholder="请输入商户名称" onChange={(event) => set("merchantName")(event.target.value)} />
          </Field>
          <Field label="商户唯一标识" error={errors.uniqueId} wide>
            <input className="control" value={form.uniqueId} placeholder="请输入商户唯一标识" onChange={(event) => set("uniqueId")(event.target.value)} />
          </Field>
          <Field label="子业务名称">
            <Select value={form.biz} options={["履约", "广告", "物流"]} onChange={set("biz")} label="子业务名称" />
          </Field>
          <Field label="币种">
            <Select value={form.currency} options={CURRENCY_OPTIONS} onChange={set("currency")} label="币种" />
          </Field>
          <Field label="转账金额" error={errors.amount}>
            <input className="control" inputMode="decimal" value={form.amount} placeholder="请输入金额" onChange={(event) => set("amount")(event.target.value)} />
          </Field>
          <Field label="提交人">
            <Select value={form.operator} options={OPERATORS} onChange={set("operator")} label="提交人" />
          </Field>
        </div>
        <div className="dialog-ft">
          <button type="button" className="btn default" onClick={onClose}>取消</button>
          <button type="button" className="btn primary" onClick={submit}>提交</button>
        </div>
      </div>
    </div>
  );
}

function plainAmount(amount) {
  return Number(amount).toFixed(2);
}

const BIZ_GROUPS = [
  "运营一部-华东组",
  "运营一部-华南组",
  "运营一部-华北组",
  "运营二部-商家增长组",
  "运营二部-广告投放组",
  "运营三部-西南组",
  "客户成功组",
  "交付中心-商家组",
  "交付中心-实施组",
  "交付中心-履约组",
];

function approvalPlan(bizGroup) {
  if (bizGroup.indexOf("交付中心") >= 0) {
    return {
      delivery: true,
      approver: "交付中心负责人",
      hint: "该业务组属于交付中心，提交后由交付中心负责人审批。",
      toast: "已提交审批，将由交付中心负责人审批",
    };
  }
  return {
    delivery: false,
    approver: "飞书审批",
    hint: "该业务组不属于交付中心，提交后按飞书审批流程处理。",
    toast: "已提交审批，请等待审批结果",
  };
}

function GroupSearch({ value, onChange, error }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const keyword = query.trim();
  const hits = keyword
    ? BIZ_GROUPS.filter((name) => name.toLowerCase().indexOf(keyword.toLowerCase()) >= 0)
    : [];

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc, true);
    return () => document.removeEventListener("mousedown", onDoc, true);
  }, [open]);

  function pick(name) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  return (
    <div className="field group-field" ref={ref}>
      <span><i className="req">*</i>运营部业务组</span>
      <div className="group-anchor">
        <div
          className={"group-box" + (error ? " bad" : "") + (open ? " open" : "")}
          onMouseDown={() => setOpen(true)}
        >
          <input
            value={query}
            placeholder="输入小组/部门名称搜索"
            aria-label="运营部业务组"
            aria-required="true"
            onBlur={(event) => {
              if (!ref.current || !ref.current.contains(event.relatedTarget)) setOpen(false);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              onChange("");
              setOpen(true);
            }}
          />
          <Icon name="search" size={16} />
        </div>
        {open ? (
          <div className="group-menu">
            {hits.length ? (
              hits.map((name) => (
                <button type="button" key={name} className={name === value ? "on" : ""} onClick={() => pick(name)}>
                  {name}
                </button>
              ))
            ) : (
              <div className="group-empty">
                <div className="group-hint">
                  <Icon name="search" size={14} />
                  <span>支持模糊搜索</span>
                </div>
                <p>请输入申请项对应的运营部业务组，支持搜索（不要选交付中心-履约组）</p>
                {keyword ? <p className="miss">没有匹配的业务组</p> : null}
              </div>
            )}
          </div>
        ) : null}
      </div>
      {error ? <em className="err">{error}</em> : null}
      {value && value !== "交付中心-履约组" ? (
        <p className={"route-note" + (approvalPlan(value).delivery ? " delivery" : "")}>{approvalPlan(value).hint}</p>
      ) : null}
    </div>
  );
}

function PrechargeDialog({ row, onClose, onConfirm }) {
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [bizGroup, setBizGroup] = useState("");
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(false);
  const [seen, setSeen] = useState(false);
  const cap = plainAmount(row.amount);

  function submit() {
    const next = {};
    const value = Number(amount);
    if (!amount.trim() || Number.isNaN(value) || value <= 0) next.amount = "请输入预充金额";
    else if (value > row.amount) next.amount = "不可大于转账金额 " + cap;
    if (!remark.trim()) next.remark = "请输入备注信息";
    if (!bizGroup) next.group = "请选择运营部业务组";
    else if (bizGroup === "交付中心-履约组") next.group = "不要选交付中心-履约组";
    const plan = bizGroup && bizGroup !== "交付中心-履约组" ? approvalPlan(bizGroup) : null;
    if (!seen) next.file = "请先查看预览一次文件";
    setErrors(next);
    if (Object.keys(next).length) return;
    onConfirm({
      prechargeAmount: Math.round(value * 100) / 100,
      prechargeRemark: remark.trim(),
      bizGroup: bizGroup,
      approver: plan.approver,
      approvalToast: plan.toast,
    });
  }

  return (
    <div className="mask" onMouseDown={onClose}>
      <div className="dialog pre-dialog" role="dialog" aria-modal="true" aria-labelledby="pre-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-hd">
          <h2 id="pre-title">预充</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <Icon name="close" size={16} />
          </button>
        </div>
        <h3 className="pre-section">客户上传的转账信息</h3>
        <div className="info-grid">
          <div className="lab">商户ID</div>
          <div>{row.merchantId}</div>
          <div className="lab">商户邮箱</div>
          <div className="break">{row.uniqueId}</div>
          <div className="lab">商户名称</div>
          <div>{row.merchantName}</div>
          <div className="lab">子业务</div>
          <div>{row.biz}</div>
          <div className="lab">客户转账币种</div>
          <div>{row.currency}</div>
          <div className="lab">客户转账金额</div>
          <div className="money">{cap}</div>
          <div className="lab">附件</div>
          <div className="span3">
            <button type="button" className="link-action" onClick={() => { setPreview(true); setSeen(true); }}>预览附件</button>
          </div>
        </div>
        <div className="notice">
          <Icon name="info" size={16} />
          <span>{row.biz}业务预充提交后将发起飞书审批，请等待审批结果。</span>
        </div>
        <h3 className="pre-section">预充申请信息</h3>
        <GroupSearch value={bizGroup} onChange={setBizGroup} error={errors.group} />
        <label className="field">
          <span><i className="req">*</i>预充金额</span>
          <div className={"amount-box" + (errors.amount ? " bad" : "")}>
            <input
              inputMode="decimal"
              value={amount}
              placeholder={"请输入预充金额，不可大于转账金额 " + cap}
              onChange={(event) => setAmount(event.target.value)}
            />
            <b>{row.currency}</b>
          </div>
          {errors.amount ? <em className="err">{errors.amount}</em> : null}
        </label>
        <label className="field remark-field">
          <span><i className="req">*</i>预充备注</span>
          <div className={"remark-box" + (errors.remark ? " bad" : "")}>
            <textarea
              value={remark}
              maxLength={500}
              placeholder="请输入备注信息（最多500字）"
              onChange={(event) => setRemark(event.target.value.slice(0, 500))}
            ></textarea>
            <em>{remark.length} / 500</em>
          </div>
          {errors.remark ? <em className="err">{errors.remark}</em> : null}
        </label>
        <div className="pre-ft">
          <span className={"pre-warn" + (errors.file ? " on" : "")}>请先查看预览一次文件，尽量确保客户已经转账。</span>
          <div className="pre-actions">
            <button type="button" className="btn default" onClick={onClose}>取消</button>
            <button type="button" className="btn primary" onClick={submit}>提交审批</button>
          </div>
        </div>
      </div>
      {preview ? (
        <div className="mask preview-mask" onMouseDown={(event) => { event.stopPropagation(); setPreview(false); }}>
          <div className="dialog preview-dialog" role="dialog" aria-modal="true" aria-labelledby="file-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-hd">
              <h2 id="file-title">预览附件</h2>
              <button type="button" className="icon-btn" onClick={() => setPreview(false)} aria-label="关闭">
                <Icon name="close" size={16} />
              </button>
            </div>
            <p className="file-name">voucher-{row.merchantId}.pdf</p>
            <div className="slip">
              <b>线下转账凭证</b>
              <div className="desc">
                <span>商户</span>
                <b>{row.merchantName}</b>
                <span>商户ID</span>
                <b>{row.merchantId}</b>
                <span>转账金额</span>
                <b>{row.currency} {cap}</b>
                <span>提交时间</span>
                <b>{row.submitAt}</b>
              </div>
              <p>模拟凭证，用于核对客户是否已经完成转账。</p>
            </div>
            <div className="dialog-ft">
              <button type="button" className="btn primary" onClick={() => setPreview(false)}>关闭</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActionDialog({ row, mode, onClose, onConfirm }) {
  const [txn, setTxn] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const title = { match: "匹配入账", confirm: "确认入账", reject: "退回并失效" }[mode];

  function submit() {
    if (mode === "match") {
      if (!/^[A-Za-z0-9]{8,32}$/.test(txn.trim())) {
        setError("请填写 8 到 32 位入账交易 ID");
        return;
      }
      onConfirm({ incomingTxn: txn.trim().toUpperCase() });
      return;
    }
    if (mode === "reject" && !reason.trim()) {
      setError("请填写退回原因");
      return;
    }
    onConfirm({ reason: reason.trim() });
  }

  return (
    <div className="mask" onMouseDown={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="action-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-hd">
          <h2 id="action-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="desc">
          <span>商户</span>
          <b>{row.merchantName}</b>
          <span>商户ID</span>
          <b>{row.merchantId}</b>
          <span>转账金额</span>
          <b>{row.amountText}</b>
          <span>当前状态</span>
          <b>{row.status}</b>
        </div>
        {mode === "match" ? (
          <div className="form-grid">
            <Field label="入账交易ID" error={error} wide>
              <input className="control" value={txn} placeholder="请输入入账交易ID" onChange={(event) => setTxn(event.target.value)} />
            </Field>
          </div>
        ) : null}
        {mode === "reject" ? (
          <div className="form-grid">
            <Field label="退回原因" error={error} wide>
              <textarea className="control" value={reason} placeholder="说明无法入账的原因" onChange={(event) => setReason(event.target.value)}></textarea>
            </Field>
          </div>
        ) : null}
        {mode === "confirm" ? <p className="hint">确认后这笔线下转账记为已入账，不能再匹配或退回。</p> : null}
        <div className="dialog-ft">
          <button type="button" className="btn default" onClick={onClose}>取消</button>
          <button type="button" className="btn primary" onClick={submit}>确定</button>
        </div>
      </div>
    </div>
  );
}

function ReviewTable({ rows, showStatus, onAction }) {
  return (
    <div className="table-wrap">
      <table>
        <caption className="sr">转账审核列表</caption>
        <thead>
          <tr>
            <th style={{ width: 96 }}>商户ID</th>
            <th style={{ width: 140 }}>商户名称</th>
            <th>商户唯一标识</th>
            <th style={{ width: 110 }}>子业务名称</th>
            {showStatus ? <th style={{ width: 100 }}>审核状态</th> : null}
            <th style={{ width: 180 }}>提交时间</th>
            <th style={{ width: 220 }}>提交人</th>
            <th style={{ width: 160 }}>转账金额</th>
            <th className="ops">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={showStatus ? 9 : 8}>
                <div className="empty">
                  <Icon name="file" size={28} />
                  <p>暂无数据</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const closed = row.status === "已确认" || row.status === "已退回";
              const matched = row.status === "已匹配" || row.status === "已确认";
              return (
                <tr key={row.uid}>
                  <td>{row.merchantId}</td>
                  <td>{row.merchantName}</td>
                  <td><div className="break">{row.uniqueId}</div></td>
                  <td>{row.biz}</td>
                  {showStatus ? <td>{row.status}</td> : null}
                  <td className="time">{row.submitAt}</td>
                  <td>
                    <div className="stack">
                      <span>{row.operator}</span>
                      <span className="sub">{row.operatorId}</span>
                    </div>
                  </td>
                  <td className="money">
                    {row.amountText}
                    {row.precharged ? <span className="tag">已预充</span> : null}
                  </td>
                  <td className="ops">
                    <div className="ops-grid">
                      <button type="button" className="link-action" disabled={closed || row.precharged} onClick={() => onAction(row, "precharge")}>预充</button>
                      <button type="button" className="link-action" disabled={closed || matched} onClick={() => onAction(row, "match")}>匹配</button>
                      <button type="button" className="link-action" disabled={closed} onClick={() => onAction(row, "confirm")}>确认</button>
                      <button type="button" className="link-action" disabled={closed} onClick={() => onAction(row, "reject")}>退回并失效</button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReviewPage({ rows, setRows, toast, initialStatus }) {
  const opening = initialStatus
    ? { ...EMPTY_DRAFT, biz: "全部", status: initialStatus }
    : { ...EMPTY_DRAFT };
  const [draft, setDraft] = useState(opening);
  const [applied, setApplied] = useState(opening);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(false);

  const filtered = rows.filter((row) => matches(row, applied));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pageNo, pages);
  const view = filtered.slice((page - 1) * pageSize, page * pageSize);
  const set = (key) => (value) => setDraft((current) => ({ ...current, [key]: value }));

  function search() {
    setLoading(true);
    setApplied({ ...draft });
    setPageNo(1);
    window.setTimeout(() => setLoading(false), 360);
  }

  function reset() {
    const next = { ...EMPTY_DRAFT, biz: "全部", status: "全部" };
    setDraft(next);
    setApplied(next);
    setPageNo(1);
  }

  function patch(uid, recipe, message) {
    let stillVisible = true;
    setRows((list) =>
      list.map((row) => {
        if (row.uid !== uid) return row;
        const next = recipe(row);
        stillVisible = matches(next, applied);
        return next;
      })
    );
    setDialog(null);
    toast(stillVisible ? message : message + "，已离开当前筛选");
  }

  function create(form) {
    const row = {
      uid: "tr" + Date.now(),
      merchantId: form.merchantId,
      merchantName: form.merchantName,
      uniqueId: form.uniqueId,
      biz: form.biz,
      submitAt: nowStamp(),
      operator: form.operator,
      operatorId: "desk-" + String(Date.now()).slice(-8),
      amount: form.amount,
      currency: form.currency,
      amountText: moneyText(form.amount, form.currency),
      status: "待匹配",
      incomingTxn: "",
      precharged: false,
      rejectReason: "",
    };
    setRows((list) => [row].concat(list));
    setDialog(null);
    setPageNo(1);
    toast(matches(row, applied) ? "线下转账已提交" : "线下转账已提交，当前筛选未包含它");
  }

  function confirmAction(payload) {
    const { row, mode } = dialog;
    if (mode === "precharge") {
      patch(
        row.uid,
        (item) => ({
          ...item,
          precharged: true,
          status: "待确认",
          prechargeAmount: payload.prechargeAmount,
          prechargeRemark: payload.prechargeRemark,
          bizGroup: payload.bizGroup,
          approver: payload.approver,
        }),
        payload.approvalToast
      );
      return;
    }
    if (mode === "match") {
      patch(row.uid, (item) => ({ ...item, status: "已匹配", incomingTxn: payload.incomingTxn }), "已匹配入账交易");
      return;
    }
    if (mode === "confirm") {
      patch(row.uid, (item) => ({ ...item, status: "已确认" }), "入账已确认");
      return;
    }
    patch(row.uid, (item) => ({ ...item, status: "已退回", rejectReason: payload.reason }), "已退回并失效");
  }

  return (
    <div data-screen-label="转账审核">
      <section className="card filter-card">
        <div className="filter-grid">
          <label className="field">
            <span>商户ID</span>
            <input className="control" placeholder="请输入商户ID" value={draft.merchantId} onChange={(event) => set("merchantId")(event.target.value)} />
          </label>
          <label className="field">
            <span>商户名称</span>
            <input className="control" placeholder="请输入商户名称" value={draft.merchantName} onChange={(event) => set("merchantName")(event.target.value)} />
          </label>
          <label className="field">
            <span>商户唯一标识</span>
            <input className="control" placeholder="请输入商户唯一标识" value={draft.uniqueId} onChange={(event) => set("uniqueId")(event.target.value)} />
          </label>
          <div className="field">
            <span>子业务名称</span>
            <Select value={draft.biz} options={BIZ_OPTIONS} onChange={set("biz")} label="子业务名称" />
          </div>
          <div className="field">
            <span>审核状态</span>
            <Select value={draft.status} options={STATUS_OPTIONS} onChange={set("status")} label="审核状态" />
          </div>
          <div className="field">
            <span>提交时间</span>
            <DateRange start={draft.start} end={draft.end} onStart={set("start")} onEnd={set("end")} />
          </div>
          <label className="field">
            <span>入账交易ID</span>
            <input className="control" placeholder="请输入入账交易ID" value={draft.incomingTxn} onChange={(event) => set("incomingTxn")(event.target.value)} />
          </label>
          <div className="filter-actions">
            <button type="button" className="btn primary" onClick={search}>搜索</button>
            <button type="button" className="btn default" onClick={reset}>重置</button>
          </div>
        </div>
      </section>

      <section className="card table-card">
        <div className="toolbar">
          <button type="button" className="btn primary" onClick={() => setDialog({ mode: "create" })}>
            <Icon name="plus" size={14} />
            代客提交线下转账
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (!filtered.length) {
                toast("没有可导出的记录");
                return;
              }
              exportCsv(filtered);
              toast("已导出当前筛选结果");
            }}
          >
            <Icon name="download" size={14} />
            导出数据
          </button>
        </div>
        <ReviewTable rows={view} showStatus={applied.status === "全部"} onAction={(row, mode) => setDialog({ mode, row })} />
        <Pager
          total={filtered.length}
          page={page}
          pages={pages}
          pageSize={pageSize}
          onPage={setPageNo}
          onSize={(size) => {
            setPageSize(size);
            setPageNo(1);
          }}
        />
        {loading ? (
          <div className="bar" aria-hidden="true">
            <div></div>
          </div>
        ) : null}
      </section>

      {dialog && dialog.mode === "create" ? <CreateDialog onClose={() => setDialog(null)} onSubmit={create} /> : null}
      {dialog && dialog.mode === "precharge" ? (
        <PrechargeDialog row={dialog.row} onClose={() => setDialog(null)} onConfirm={confirmAction} />
      ) : null}
      {dialog && dialog.mode !== "create" && dialog.mode !== "precharge" ? (
        <ActionDialog row={dialog.row} mode={dialog.mode} onClose={() => setDialog(null)} onConfirm={confirmAction} />
      ) : null}
    </div>
  );
}

function Workbench({ rows, onOpen }) {
  const count = (status) => rows.filter((row) => row.status === status).length;
  const recent = rows.slice(0, 5);
  return (
    <div data-screen-label="工作台">
      <div className="stats">
        {[
          ["待匹配", count("待匹配")],
          ["待确认", count("待确认")],
          ["已匹配", count("已匹配")],
          ["已退回", count("已退回")],
        ].map((item) => (
          <button type="button" className="stat" key={item[0]} onClick={() => onOpen(item[0])}>
            <span>{item[0]}</span>
            <b>{item[1]}</b>
          </button>
        ))}
      </div>
      <section className="card table-card">
        <div className="card-head">
          <h2 className="section-title">最近提交</h2>
          <button type="button" className="btn default" onClick={() => onOpen("待匹配")}>去审核</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>商户名称</th>
                <th>子业务名称</th>
                <th>提交时间</th>
                <th>转账金额</th>
                <th>审核状态</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr key={row.uid}>
                  <td>{row.merchantName}</td>
                  <td>{row.biz}</td>
                  <td className="time">{row.submitAt}</td>
                  <td className="money">{row.amountText}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TransferApp({ t, setTweak }) {
  const [page, setPage] = useState("review");
  const [tabs, setTabs] = useState(["workbench", "review"]);
  const [rows, setRows] = useState(TRANSFER_SEED);
  const [pop, setPop] = useState(null);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [listSeed, setListSeed] = useState({ id: "default", status: null });
  const paletteRef = useRef(null);

  const toast = useCallback((text) => {
    const id = Date.now() + Math.random();
    setToasts((list) => list.concat({ id, text }));
    window.setTimeout(() => {
      setToasts((list) => list.filter((item) => item.id !== id));
    }, 2200);
  }, []);

  const title = page === "review" ? "转账审核" : "工作台";

  useEffect(() => {
    document.title = "Fund · " + title;
  }, [title]);

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette(true);
        setPop(null);
      }
      if (event.key === "Escape") {
        setPalette(false);
        setPop(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (palette && paletteRef.current) paletteRef.current.focus();
  }, [palette]);

  useEffect(() => {
    setHi(0);
  }, [query]);

  function openPage(key) {
    setPage(key);
    setTabs((list) => (list.indexOf(key) >= 0 ? list : list.concat(key)));
    setPalette(false);
    setPop(null);
    setQuery("");
  }

  function closeTab(key, event) {
    event.stopPropagation();
    setTabs((list) => {
      const next = list.filter((item) => item !== key);
      if (!next.length) return list;
      if (page === key) setPage(next[next.length - 1]);
      return next;
    });
  }

  const hits = [
    { key: "workbench", label: "工作台", hint: "Fund" },
    { key: "review", label: "转账审核", hint: "业务入账" },
  ].filter((item) => item.label.indexOf(query.trim()) >= 0);

  function onPaletteKey(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHi((index) => (hits.length ? (index + 1) % hits.length : 0));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHi((index) => (hits.length ? (index - 1 + hits.length) % hits.length : 0));
    }
    if (event.key === "Enter" && hits[hi]) openPage(hits[hi].key);
  }

  const notes = [
    { title: "澄湾科技有 1 笔履约转账待匹配", time: "今天 09:20" },
    { title: "青禾供应链预充待确认", time: "今天 08:05" },
    { title: "当前列表为模拟数据", time: "演示环境" },
  ];

  return (
    <div className="app" data-theme={t.dark ? "dark" : "light"} data-density={t.density} style={{ "--primary": t.primary }}>
      <header className="header">
        <nav className="crumb" aria-label="breadcrumb">
          <button type="button" onClick={() => openPage("workbench")}>Fund</button>
          <span>/</span>
          {page === "review" ? (
            <>
              <span>业务入账</span>
              <span>/</span>
              <span className="current">转账审核</span>
            </>
          ) : (
            <span className="current">工作台</span>
          )}
        </nav>
        <div className="tools">
          <a className="form-link" href="../form/">飞书表单</a>
          <button type="button" className="search-btn" onClick={() => setPalette(true)}>
            <Icon name="search" size={14} />
            <span>搜索</span>
            <kbd className="kbd">⌘K</kbd>
          </button>
          <button
            type="button"
            className={"icon-btn" + (t.dark ? " on" : "")}
            aria-label={t.dark ? "切换浅色" : "切换深色"}
            onClick={() => setTweak("dark", !t.dark)}
          >
            <Icon name={t.dark ? "sun" : "moon"} size={16} />
          </button>
          <div className="tool">
            <button type="button" className={"icon-btn" + (pop === "bell" ? " on" : "")} aria-label="通知" onClick={() => setPop(pop === "bell" ? null : "bell")}>
              <Icon name="bell" size={16} />
              <i className="dot"></i>
            </button>
            {pop === "bell" ? (
              <div className="pop">
                <div className="pop-hd">通知</div>
                {notes.map((note) => (
                  <button type="button" className="note" key={note.title} onClick={() => { setPop(null); openPage("review"); }}>
                    {note.title}
                    <small>{note.time}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="tool">
            <button type="button" className="avatar-btn" aria-label="演示账号" onClick={() => setPop(pop === "user" ? null : "user")}>审</button>
            {pop === "user" ? (
              <div className="pop user-pop">
                <p>演示账号 · 审核员</p>
                <button type="button" onClick={() => { setPop(null); toast("演示环境未连接真实账号"); }}>退出</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="tabs">
        {tabs.map((key) => (
          <button type="button" key={key} className={"tab" + (page === key ? " active" : "")} onClick={() => openPage(key)}>
            <Icon name={key === "workbench" ? "grid" : "file"} size={14} />
            {key === "workbench" ? "工作台" : "转账审核"}
            <span className="tab-x" role="button" aria-label="关闭" onClick={(event) => closeTab(key, event)}>
              <Icon name="close" size={12} />
            </span>
          </button>
        ))}
      </div>

      <main className="content">
        {page === "review" ? (
          <ReviewPage key={listSeed.id} rows={rows} setRows={setRows} toast={toast} initialStatus={listSeed.status} />
        ) : (
          <Workbench
            rows={rows}
            onOpen={(status) => {
              setListSeed({ id: status + Date.now(), status: status });
              openPage("review");
            }}
          />
        )}
      </main>

      {palette ? (
        <div className="mask palette" onMouseDown={() => setPalette(false)}>
          <div className="palette-box" onMouseDown={(event) => event.stopPropagation()}>
            <input
              ref={paletteRef}
              value={query}
              placeholder="搜索页面"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onPaletteKey}
              aria-label="搜索页面"
            />
            <div className="palette-list">
              {hits.length === 0 ? <div className="empty"><p>没有匹配的页面</p></div> : hits.map((item, index) => (
                <button type="button" key={item.key} className={"hit" + (index === hi ? " on" : "")} onClick={() => openPage(item.key)} onMouseEnter={() => setHi(index)}>
                  {item.label}
                  <small>{item.hint}</small>
                </button>
              ))}
            </div>
            <div className="palette-ft">
              <b>↑↓</b><span>选择</span>
              <b>Enter</b><span>打开</span>
              <b>Esc</b><span>关闭</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="toasts" aria-live="polite">
        {toasts.map((item) => (
          <div className="toast" key={item.id}>
            <span className="ok"><Icon name="check" size={16} /></span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      <TweaksPanel title="风格">
        <TweakSection label="界面" />
        <TweakColor label="主色" value={t.primary} options={["#1677ff", "#409EFF", "#0B6E4F"]} onChange={(value) => setTweak("primary", value)} />
        <TweakRadio label="密度" value={t.density} options={["紧凑", "默认", "宽松"]} onChange={(value) => setTweak("density", value)} />
        <TweakToggle label="深色" value={t.dark} onChange={(value) => setTweak("dark", value)} />
      </TweaksPanel>
    </div>
  );
}

Object.assign(window, { TransferApp });
