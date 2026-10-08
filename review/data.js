/* 转账审核演示数据。商户、邮箱、金额、时间和操作人全部虚构，不取自界面截图。 */

const MERCHANTS = [
  ["31028", "澄湾科技", "chengwan.ops@harbormail.net"],
  ["27641", "青禾供应链", "billing@qinghe-supply.co"],
  ["25890", "南枝电商", "finance@nanzhi.shop"],
  ["24117", "北麓数码", "accounts@beilu.digital"],
  ["22904", "澜舟物流", "pay@lanzhou-logistics.com"],
  ["21855", "星澜传媒", "media@xinglan-ads.com"],
  ["20733", "拾光零售", "cashier@shiguang.store"],
  ["19620", "云栖贸易", "ops@yunqi-trade.com"],
  ["18502", "禾风制造", "ap@hefeng-mfg.com"],
  ["17388", "栖迟设计", "hello@qichi.design"],
  ["16240", "暮山食品", "settle@mushan-foods.com"],
  ["15176", "听潮教育", "finance@tingchao.edu"],
  ["14093", "白露服饰", "pay@bailu-apparel.com"],
  ["13908", "砚台文具", "accounts@yantai.supply"],
  ["12864", "远浦航运", "ops@yuanpu-shipping.com"],
  ["11750", "橘园生鲜", "billing@juyuan-fresh.com"],
];

const OPERATORS = ["陈予安", "周衡之", "宋以宁", "许嘉树", "梁清和", "沈知夏"];
const CURRENCIES = ["USD", "CNY", "HKD", "EUR"];
const BIZ_CYCLE = ["履约", "履约", "履约", "广告", "履约", "物流", "履约", "广告"];
const STATUS_CYCLE = ["待匹配", "待匹配", "待确认", "待匹配", "已匹配", "待匹配", "已确认", "已退回"];

function pad(value) {
  return String(value).padStart(2, "0");
}

function mix(index) {
  let x = Math.imul(index + 0x27d4eb2d, 0x9e3779b1) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

function fakeUuid(index) {
  const hex = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 32; i += 1) {
    out += hex[(mix(index * 32 + i + 8) >>> 8) & 15];
  }
  return (
    out.slice(0, 8) +
    "-" +
    out.slice(8, 12) +
    "-4" +
    out.slice(13, 16) +
    "-a" +
    out.slice(17, 20) +
    "-" +
    out.slice(20, 32)
  );
}

function submitAt(index) {
  const base = Date.UTC(2026, 7, 12, 9, 6, 18);
  const step = (3 * 3600 + 17 * 60) * 1000;
  const date = new Date(base + index * step + (mix(index) % (2 * 3600)) * 1000);
  return (
    date.getUTCFullYear() +
    "-" +
    pad(date.getUTCMonth() + 1) +
    "-" +
    pad(date.getUTCDate()) +
    " " +
    pad(date.getUTCHours()) +
    ":" +
    pad(date.getUTCMinutes()) +
    ":" +
    pad(date.getUTCSeconds())
  );
}

function moneyText(amount, currency) {
  const parts = amount.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return currency + " " + parts.join(".");
}

function buildSeed() {
  const rows = [];
  for (let index = 0; index < 220; index += 1) {
    const merchant = MERCHANTS[index % MERCHANTS.length];
    const featured = index >= 120;
    const status = featured ? "待匹配" : STATUS_CYCLE[index % STATUS_CYCLE.length];
    const currency = CURRENCIES[index % CURRENCIES.length];
    const amount = 1260 + (mix(index + 400) % 86000) + (mix(index + 900) % 100) / 100;
    const when = submitAt(index);
    const day = when.slice(0, 10).replace(/-/g, "");
    const matched = status === "已匹配" || status === "已确认";
    rows.push({
      uid: "tr" + String(index + 1).padStart(3, "0"),
      merchantId: merchant[0],
      merchantName: merchant[1],
      uniqueId: merchant[2],
      biz: featured ? "履约" : BIZ_CYCLE[index % BIZ_CYCLE.length],
      submitAt: when,
      operator: OPERATORS[index % OPERATORS.length],
      operatorId: fakeUuid(index + 40),
      amount: Math.round(amount * 100) / 100,
      currency: currency,
      amountText: moneyText(amount, currency),
      status: status,
      incomingTxn: matched ? "IN" + day + String(1800 + index * 7) : "",
      precharged: status === "待确认",
      rejectReason: status === "已退回" ? "付款账户与商户备案不一致" : "",
    });
  }
  rows.sort((a, b) => (a.submitAt < b.submitAt ? 1 : -1));
  return rows;
}

const TRANSFER_SEED = buildSeed();
const BIZ_OPTIONS = ["全部", "履约", "广告", "物流"];
const STATUS_OPTIONS = ["全部", "待匹配", "待确认", "已匹配", "已确认", "已退回"];
const CURRENCY_OPTIONS = ["USD", "CNY", "HKD", "EUR"];

Object.assign(window, {
  TRANSFER_SEED,
  BIZ_OPTIONS,
  STATUS_OPTIONS,
  CURRENCY_OPTIONS,
  OPERATORS,
  moneyText,
});
