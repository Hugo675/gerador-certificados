(function () {
"use strict";
// ---------- Estado ----------
var state = {
participants: [
{ nome: "Fulano de Tal1", cpf: "12345678901", inst: "COOPERATIVA A", cnpj: "" },
{ nome: "Fulana de Tal2", cpf: "98765432100", inst: "COOPERATIVA B", cnpj: "" }
],
idx: 0,
face: "front",
zoom: 1,
logo: "",
sigInst: "",
sigRt: "",
xlsxRows: null,
xlsxHeader: []
};
var PT_MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
// ---------- Utilitários ----------
function $(id) { return document.getElementById(id); }
function safe(fn) { try { return fn(); } catch (e) { console.error(e); return null; } }
function esc(s) {
return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
});
}
function toast(msg, type) {
try {
if (window.skipUI && skipUI.toast) skipUI.toast(msg, { type: type || "success" });
} catch (e) { console.warn(msg); }
}
function formatCnpj(v) {
var d = String(v || "").replace(/\D/g, "").slice(0, 14);
var out = d;
if (d.length > 2) out = d.slice(0, 2) + "." + d.slice(2);
if (d.length > 5) out = out.slice(0, 6) + "." + d.slice(5);
if (d.length > 8) out = out.slice(0, 10) + "/" + d.slice(8);
if (d.length > 12) out = out.slice(0, 15) + "-" + d.slice(12);
return out;
}
function formatCpf(v) {
var d = String(v || "").replace(/\D/g, "").slice(0, 11);
if (d.length <= 3) return d;
if (d.length <= 6) return d.slice(0, 3) + "." + d.slice(3);
if (d.length <= 9) return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
return d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
}
function todayISO() {
var t = new Date();
return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
}
function fmtDataExtenso(iso) {
var p = (iso || "").split("-");
if (p.length !== 3) return "";
var d = parseInt(p[2], 10), m = parseInt(p[1], 10) - 1, y = p[0];
return d + " de " + PT_MESES[m] + " de " + y;
}
function readFileDataURL(file, cb) {
var r = new FileReader();
r.onload = function (e) { cb(e.target.result); };
r.onerror = function () { toast("Não foi possível ler o arquivo.", "error"); };
r.readAsDataURL(file);
}
function linesOf(text) {
return String(text || "").split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
}
function getForm() {
return {
curso: $("curso").value.trim(),
datas: $("datas").value.trim(),
ch: $("ch").value.trim(),
local: $("local").value.trim(),
dataEmissao: $("dataEmissao").value,
instPart: $("instPart").value.trim(),
cnpjPart: $("cnpjPart").value.trim(),
instReal: $("instReal").value.trim(),
cnpjReal: $("cnpjReal").value.trim(),
apoio: $("apoio").value.trim(),
teorico: linesOf($("teorico").value),
pratico: linesOf($("pratico").value),
instrutor: $("instrutor").value.trim(),
rtNome: $("rtNome").value.trim(),
rtCargo: $("rtCargo").value.trim(),
rtReg: $("rtReg").value.trim()
};
}
// ---------- Texto do certificado ----------
function resolveInst(p, f) {
return {
inst: String(p.inst || "").trim() || f.instPart,
cnpj: String(p.cnpj || "").trim() || f.cnpjPart
};
}
function buildParagraph(p, f) {
var r = resolveInst(p, f);
var s = "Certificamos que <span class=\"nm\">" + esc(p.nome) + "</span>";
if (p.cpf) s += ", inscrito no CPF " + esc(formatCpf(p.cpf));
if (r.inst) s += ", colaborador da " + esc(r.inst) + (r.cnpj ? ", inscrita no CNPJ sob o número " + esc(r.cnpj) : "");
s += ", participou do curso";
if (f.curso) s += " de " + esc(f.curso);
if (f.instReal) s += " promovido pela " + esc(f.instReal) + (f.cnpjReal ? ", inscrita no CNPJ sob o número " + esc(f.cnpjReal) : "");
if (f.local) s += ", realizado na cidade de " + esc(f.local);
if (f.datas) s += ", nos dias " + esc(f.datas);
if (f.ch) s += ", com carga horária de " + esc(f.ch) + " horas";
s = s.replace(/\s{2,}/g, " ").trim();
return s + ".";
}
function paragraphSize(text) {
var len = text.replace(/<[^>]+>/g, "").length;
if (len > 620) return 16;
if (len > 480) return 17.5;
if (len > 360) return 18.5;
return 19;
}
// ---------- Renderização de faces ----------
function frontHTML(p, f) {
var txt = buildParagraph(p, f);
var size = paragraphSize(txt);
var logo = state.logo ? "<img class=\"cert-logo\" src=\"" + state.logo + "\" alt=\"Logo\">" : "<div style=\"height:60px\"></div>";
var dataTxt = fmtDataExtenso(f.dataEmissao || todayISO());
var sigI = state.sigInst ? "<img src=\"" + state.sigInst + "\" alt=\"Assinatura do instrutor\">" : "";
var sigR = state.sigRt ? "<img src=\"" + state.sigRt + "\" alt=\"Assinatura do responsável técnico\">" : "";
var rtLine = "<span class=\"sg-nome\">" + esc(f.rtNome) + "</span>" +
(f.rtCargo ? "<span class=\"sg-sub\">" + esc(f.rtCargo) + "</span>" : "") +
(f.rtReg ? "<span class=\"sg-sub\">Registro: " + esc(f.rtReg) + "</span>" : "");
var nota = $("chkVerso").checked ? "<span class=\"cert-note\">Conteúdo programático no verso</span>" : "";
var logoSm = state.logo ? "<img class=\"cert-logo-sm\" src=\"" + state.logo + "\" alt=\"\">" : "";
return "" +
"<div class=\"cert\">" +
"<div class=\"band-top\"></div><div class=\"band-bot\"></div>" +
(state.logo ? "<img class=\"wm\" src=\"" + state.logo + "\" alt=\"\">" : "") +
logo +
"<div class=\"cert-title\">CERTIFICADO</div>" +
"<p class=\"cert-body\" style=\"font-size:" + size + "px\">" + txt + "</p>" +
"<div class=\"cert-date\">Palmas/TO, " + esc(dataTxt) + "</div>" +
"<div class=\"cert-sigs\">" +
"<div class=\"sig\"><div class=\"img-box\"></div><div class=\"line\"><span class=\"sg-nome\">" + esc(p.nome) + "</span></div><div class=\"rot\">Participante</div></div>" +
"<div class=\"sig\"><div class=\"img-box\">" + sigI + "</div><div class=\"line\"><span class=\"sg-nome\">" + esc(f.instrutor) + "</span></div><div class=\"rot\">Instrutor</div></div>" +
"<div class=\"sig\"><div class=\"img-box\">" + sigR + "</div><div class=\"line\">" + rtLine + "</div><div class=\"rot\">RESP. TÉCNICO</div></div>" +
"</div>" +
"<div class=\"cert-foot\">" + logoSm + "<span>" + esc(f.apoio) + "</span>" + nota + "</div>" +
"</div>";
}
function versoHTML(p, f) {
var teo = f.teorico.map(function (t, i) { return "<li>" + esc(t) + "</li>"; }).join("");
var pra = f.pratico.map(function (t, i) { return "<li>" + esc(t) + "</li>"; }).join("");
var logoSm = state.logo ? "<img src=\"" + state.logo + "\" alt=\"\" style=\"height:34px;object-fit:contain\">" : "";
var inst = f.instReal || f.apoio;
return "" +
"<div class=\"cert verso\">" +
"<div class=\"band-top\"></div><div class=\"band-bot\"></div>" +
logoSm +
"<p class=\"cert-verso-head\" style=\"margin-top:8px\">CONTEÚDO PROGRAMÁTICO:</p>" +
"<div class=\"cert-verso-rule\"></div>" +
"<p class=\"cert-verso-sub\">Carga horária: " + esc(f.ch || "—") + " horas</p>" +
"<div class=\"cert-cols\">" +
"<h4>Conteúdo Programático Teórico:</h4>" +
"<ol>" + teo + "</ol>" +
"<h4>Conteúdo Programático Prático:</h4>" +
"<ol>" + pra + "</ol>" +
"</div>" +
"<div class=\"cert-verso-foot\"><span>" + esc(inst || "") + "</span></div>" +
"</div>";
}
function renderPreview() {
var host = $("pvHost");
var list = state.participants.filter(function (p) { return p.nome; });
var f = getForm();
if (!list.length) {
host.innerHTML = "<div class=\"pv-empty\">Nenhum participante com nome. Adicione uma linha na lista.</div>";
$("pvName").textContent = "—";
$("pvIndex").textContent = "0 / 0";
return;
}
if (state.idx >= list.length) state.idx = list.length - 1;
if (state.idx < 0) state.idx = 0;
var p = list[state.idx];
$("pvName").textContent = p.nome;
$("pvIndex").textContent = (state.idx + 1) + " / " + list.length;
host.innerHTML = state.face === "front" ? frontHTML(p, f) : versoHTML(p, f);
applyZoom();
}
function baseFitScale() {
var stage = $("pvScale").parentNode;
var cs = window.getComputedStyle(stage);
var padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
var padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
var availW = stage.clientWidth - padX;
var availH = Math.max(200, Math.min(window.innerHeight - 160, 900)) - padY;
var sw = availW > 0 ? availW / 1123 : 0.5;
var sh = availH > 0 ? availH / 794 : sw;
return Math.max(0.1, Math.min(sw, sh, 1));
}
function applyZoom() {
var scale = $("pvScale");
var s = baseFitScale() * state.zoom;
var host = $("pvHost");
var cert = host.querySelector(".cert");
scale.style.width = (1123 * s) + "px";
scale.style.height = (794 * s) + "px";
host.style.transformOrigin = "center center";
host.style.transform = "translate(-50%, -50%) scale(" + s + ")";
host.style.left = "50%";
host.style.top = "50%";
if (cert) {
cert.style.transform = "none";
}
$("zoomLabel").textContent = Math.round(state.zoom * 100) + "%";
}
function updateKpis() {
var f = getForm();
var valid = state.participants.filter(function (p) { return p.nome; }).length;
$("countBadge").textContent = valid + " participantes";
$("kpiPart").textContent = valid;
$("kpiCH").textContent = (f.ch || "0") + " h";
$("kpiItens").textContent = f.teorico.length + f.pratico.length;
$("kpiPaginas").textContent = valid * 2;
$("readyCount").textContent = valid;
$("statusBadge").textContent = valid ? "Pronto para gerar" : "Adicione participantes";
}
function refresh() {
safe(renderPreview);
safe(updateKpis);
}
// ---------- Lista de participantes ----------
function renderList() {
var body = $("listBody");
body.innerHTML = "";
state.participants.forEach(function (p, i) {
var tr = document.createElement("tr");
tr.innerHTML =
"<td><input data-k=\"nome\" data-i=\"" + i + "\" value=\"" + esc(p.nome) + "\" aria-label=\"Nome\"></td>" +
"<td><input data-k=\"cpf\" data-i=\"" + i + "\" value=\"" + esc(formatCpf(p.cpf)) + "\" aria-label=\"CPF\"></td>" +
"<td style=\"display:none\"></td>" +
"<td><input data-k=\"inst\" data-i=\"" + i + "\" value=\"" + esc(p.inst || "") + "\" aria-label=\"Instituição\" placeholder=\"Padrão do formulário\"></td>" +
"<td><button type=\"button\" class=\"btn-ghost\" data-rm=\"" + i + "\" aria-label=\"Remover\">Remover</button></td>";
body.appendChild(tr);
});
}
body_listDelegate();
function body_listDelegate() {
var body = $("listBody");
body.addEventListener("input", function (e) {
var t = e.target;
var i = parseInt(t.getAttribute("data-i"), 10);
var k = t.getAttribute("data-k");
if (isNaN(i) || !k || !state.participants[i]) return;
if (k === "cpf") {
t.value = formatCpf(t.value);
state.participants[i].cpf = t.value.replace(/\D/g, "");
} else if (k === "inst") {
state.participants[i].inst = t.value;
} else {
state.participants[i][k] = t.value;
}
refresh();
});
body.addEventListener("click", function (e) {
var rm = e.target.getAttribute && e.target.getAttribute("data-rm");
if (rm === null || rm === undefined) return;
var i = parseInt(rm, 10);
state.participants.splice(i, 1);
if (state.idx >= state.participants.length) state.idx = Math.max(0, state.participants.length - 1);
renderList();
refresh();
toast("Participante removido.");
});
}
$("btnAddRow").addEventListener("click", function () {
state.participants.push({ nome: "", cpf: "", inst: "", cnpj: "" });
renderList();
refresh();
toast("Linha adicionada. Preencha o nome.");
});
function fillSelect(sel, header, pick) {
sel.innerHTML = "";
header.forEach(function (h, i) {
var o = document.createElement("option");
o.value = i;
o.textContent = h || ("Coluna " + (i + 1));
if (i === pick) o.selected = true;
sel.appendChild(o);
});
var none = document.createElement("option");
none.value = "-1";
none.textContent = "(nenhuma)";
sel.insertBefore(none, sel.firstChild);
}
function guessCol(header, words) {
for (var i = 0; i < header.length; i++) {
var h = String(header[i] || "").toLowerCase();
for (var j = 0; j < words.length; j++) if (h.indexOf(words[j]) !== -1) return i;
}
return -1;
}
function handleXlsx(file) {
readFileDataURL(file, function () {});
var reader = new FileReader();
reader.onload = function (e) {
safe(function () {
var wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
var ws = wb.Sheets[wb.SheetNames[0]];
var rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" });
if (!rows.length) throw new Error("vazio");
var header = rows[0].map(function (h) { return String(h); });
state.xlsxHeader = header;
state.xlsxRows = rows.slice(1);
var cN = guessCol(header, ["nome", "name", "participante"]);
var cC = guessCol(header, ["cpf"]);
var cI = guessCol(header, ["instituição", "instituicao", "empresa", "cooperativa"]);
var cJ = guessCol(header, ["cnpj"]);
fillSelect($("colNome"), header, cN < 0 ? 0 : cN);
fillSelect($("colCpf"), header, cC);
fillSelect($("colInst"), header, cI);
state.xlsxCnpjCol = cJ;
$("xlsxMapping").style.display = "grid";
$("pdfInfo").style.display = "none";
$("listInfo").textContent = "Planilha carregada: " + state.xlsxRows.length + " linhas. Escolha as colunas e clique em Aplicar.";
toast("Planilha lida com sucesso.");
});
};
reader.onerror = function () { toast("Erro ao ler a planilha.", "error"); };
reader.readAsArrayBuffer(file);
}
function applyMapping() {
if (!state.xlsxRows) return;
var cN = parseInt($("colNome").value, 10);
var cC = parseInt($("colCpf").value, 10);
var cI = parseInt($("colInst").value, 10);
var out = [];
state.xlsxRows.forEach(function (r) {
var nome = cN >= 0 ? String(r[cN] || "").trim() : "";
if (!nome) return;
out.push({
nome: nome,
cpf: cC >= 0 ? String(r[cC] || "").replace(/\D/g, "") : "",
inst: cI >= 0 ? String(r[cI] || "").trim() : "",
cnpj: state.xlsxCnpjCol >= 0 ? formatCnpj(String(r[state.xlsxCnpjCol] || "")) : ""
});
});
state.participants = out;
state.idx = 0;
renderList();
refresh();
toast(out.length + " participantes carregados.");
}
function handlePdf(file) {
var url = URL.createObjectURL(file);
$("pdfFrame").src = url;
$("pdfInfo").style.display = "block";
$("xlsxMapping").style.display = "none";
$("listInfo").textContent = "PDF carregado: " + file.name + ". Revise a lista abaixo e corrija os nomes.";
toast("PDF exibido para conferência.");
}
$("fileList").addEventListener("change", function (e) {
var f = e.target.files && e.target.files[0];
if (!f) return;
var name = f.name.toLowerCase();
if (/\.pdf$/.test(name)) handlePdf(f);
else if (/\.(xlsx|xls|csv)$/.test(name)) handleXlsx(f);
else toast("Formato não suportado.", "error");
});
$("btnApplyMapping").addEventListener("click", applyMapping);
$("listBody").addEventListener("keydown", function () {});
// ---------- Logo / assinaturas ----------
$("fileLogo").addEventListener("change", function (e) {
var f = e.target.files && e.target.files[0];
if (!f) return;
readFileDataURL(f, function (u) {
state.logo = u;
$("logoName").textContent = f.name;
refresh();
toast("Logo carregada.");
});
});
$("fileSigInst").addEventListener("change", function (e) {
var f = e.target.files && e.target.files[0];
if (!f) return;
readFileDataURL(f, function (u) {
state.sigInst = u;
$("sigInstName").textContent = f.name;
refresh();
toast("Assinatura do instrutor carregada.");
});
});
$("fileSigRt").addEventListener("change", function (e) {
var f = e.target.files && e.target.files[0];
if (!f) return;
readFileDataURL(f, function (u) {
state.sigRt = u;
$("sigRtName").textContent = f.name;
refresh();
toast("Assinatura do responsável técnico carregada.");
});
});
// ---------- Máscaras ----------
["cnpjPart","cnpjReal"].forEach(function (id) {
$(id).addEventListener("input", function (e) {
e.target.value = formatCnpj(e.target.value);
refresh();
});
});
// ---------- Formulário -> preview ----------
["curso","datas","ch","local","dataEmissao","instPart","cnpjPart","instReal","cnpjReal","apoio","teorico","pratico","instrutor","rtNome","rtCargo","rtReg","chkVerso"].forEach(function (id) {
var el = $(id);
if (!el) return;
el.addEventListener("input", refresh);
el.addEventListener("change", refresh);
});
// ---------- Face e zoom ----------
function setFace(face) {
state.face = face;
$("btnFront").classList.toggle("on", face === "front");
$("btnBack").classList.toggle("on", face === "back");
renderPreview();
}
$("btnFront").addEventListener("click", function () { setFace("front"); });
$("btnBack").addEventListener("click", function () { setFace("back"); });
$("btnZoomIn").addEventListener("click", function () {
state.zoom = Math.min(1.6, +(state.zoom + 0.1).toFixed(2));
applyZoom();
});
$("btnZoomOut").addEventListener("click", function () {
state.zoom = Math.max(0.5, +(state.zoom - 0.1).toFixed(2));
applyZoom();
});
window.addEventListener("resize", function () { safe(applyZoom); });
$("btnFit").addEventListener("click", function () {
state.zoom = 1;
safe(applyZoom);
});
if (window.ResizeObserver) {
new ResizeObserver(function () { safe(applyZoom); }).observe($("pvScale").parentNode);
}
// ---------- Navegação ----------
$("btnPrevP").addEventListener("click", function () {
var n = state.participants.filter(function (p) { return p.nome; }).length;
if (!n) return;
state.idx = (state.idx - 1 + n) % n;
renderPreview();
});
$("btnNextP").addEventListener("click", function () {
var n = state.participants.filter(function (p) { return p.nome; }).length;
if (!n) return;
state.idx = (state.idx + 1) % n;
renderPreview();
});
// ---------- Impressão ----------
function validParticipants() {
return state.participants.filter(function (p) { return p.nome; });
}
function buildPrintDocument(pages) {
var css = "" +
"@page{size:A4 landscape;margin:0}" +
"html,body{margin:0;padding:0;background:#fff;font-family:Inter,Arial,sans-serif}" +
"*{print-color-adjust:exact;-webkit-print-color-adjust:exact}" +
".pg{width:1123px;height:794px;page-break-after:always;break-after:page;break-inside:avoid;overflow:hidden;position:relative}" +
".pg:last-child{page-break-after:auto;break-after:auto}" +
".cert{width:1123px;height:794px;background:#fff;position:relative;box-sizing:border-box;padding:46px 62px 40px;display:flex;flex-direction:column;color:#1f2937;overflow:hidden;font-family:'PT Serif',Georgia,serif;print-color-adjust:exact;-webkit-print-color-adjust:exact}" +
".cert::before{content:'';position:absolute;inset:14px;border:4px solid #00529B;pointer-events:none;z-index:2;clip-path:polygon(22px 0,calc(100% - 22px) 0,100% 22px,100% calc(100% - 22px),calc(100% - 22px) 100%,22px 100%,0 calc(100% - 22px),0 22px)}" +
".cert::after{content:'';position:absolute;inset:24px;border:1px solid #c9a660;pointer-events:none;z-index:2}" +
".cert .band-top,.cert .band-bot{position:absolute;left:0;right:0;height:12px;background:linear-gradient(90deg,#00529B,#4A9BD4);z-index:3}" +
".cert .band-top{top:0}.cert .band-bot{bottom:0}" +
".cert .wm{position:absolute;left:50%;top:50%;width:520px;height:520px;transform:translate(-50%,-50%);opacity:.06;pointer-events:none;z-index:0;object-fit:contain}" +
".cert>*:not(.band-top):not(.band-bot):not(.wm){position:relative;z-index:1}" +
".cert.verso{padding:34px 48px}" +
".cert-logo{height:60px;max-height:60px;width:auto;max-width:180px;object-fit:contain;align-self:flex-start}" +
".cert-logo-sm{height:30px;object-fit:contain}" +
".cert-title{text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:50px;letter-spacing:8px;color:#00529B;font-weight:700;margin:8px 0 16px}" +
".cert-body{font-size:19px;line-height:1.65;text-align:justify;margin:0;color:#374151}" +
".cert-body .nm{font-weight:700;color:#00529B;font-size:24px}" +
".cert-date{text-align:right;font-size:15px;font-style:italic;color:#4b5563;margin:18px 0 6px}" +
".cert-sigs{display:flex;gap:24px;margin-top:auto}" +
".sig{flex:1;text-align:center;display:flex;flex-direction:column;justify-content:flex-end;height:150px}" +
".sig .img-box{height:68px;display:flex;align-items:flex-end;justify-content:center}" +
".sig .img-box img{max-height:68px;max-width:100%;object-fit:contain}" +
".cert-sigs{align-items:flex-end}" +
".sig .line{border-top:1px solid #00396e;padding-top:6px;font-size:14px;line-height:1.3;color:#1f2937;display:flex;flex-direction:column;gap:5px}" +
".sig .line .sg-nome{font-weight:700;font-size:14.5px}" +
".sig .line .sg-sub{font-size:12px;color:#5b6777;font-weight:400;line-height:1.3}" +
".sig .rot{font-size:11px;color:#5b6777;text-transform:uppercase;letter-spacing:1.5px;font-variant:small-caps;margin-top:6px;line-height:1.2}" +
".cert-foot{display:flex;align-items:center;gap:10px;background:#EAF3FA;padding:8px 12px;margin:14px -12px 0;font-size:12px;color:#374151}" +
".cert-note{margin-left:auto;font-size:11px;color:#5b6777}" +
".cert-verso-head{font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#00529B;margin:0 0 4px;letter-spacing:2px}" +
".cert-verso-rule{width:120px;height:1px;background:linear-gradient(90deg,#00529B,#c9a660);margin:4px 0 10px}" +
".cert-verso-sub{font-size:15px;margin:0 0 12px;color:#374151}" +
".cert-cols{columns:2;column-gap:36px;font-size:12.5px;line-height:1.5;color:#1f2937}" +
".cert-cols h4{font-size:13.5px;color:#00529B;margin:8px 0 4px;break-after:avoid}" +
".cert-cols ol{margin:0;padding-left:0;list-style:none;counter-reset:it}" +
".cert-cols li{margin-bottom:4px;break-inside:avoid;padding-left:26px;position:relative;counter-increment:it}" +
".cert-cols li::before{content:counter(it);position:absolute;left:0;top:0;color:#00529B;font-weight:700}" +
".cert-verso-foot{font-size:11px;color:#5b6777;background:#EAF3FA;padding:8px 12px;margin:auto -12px 0;display:flex;align-items:center;gap:8px}";
var body = pages.map(function (h) { return "<div class=\"pg\">" + h + "</div>"; }).join("");
return "<!DOCTYPE html><html lang=\"pt-BR\"><head><meta charset=\"UTF-8\"><title>Certificados SESCOOP/TO</title><style>" + css + "</style></head><body>" + body + "</body></html>";
}
function openPrint(pages) {
var win = window.open("", "_blank");
if (!win) {
toast("Pop-up bloqueado. Permita pop-ups deste site e tente novamente.", "error");
return;
}
try {
win.document.open();
win.document.write(buildPrintDocument(pages));
win.document.close();
var go = function () {
var fonts = win.document.fonts;
var wait = fonts && fonts.ready ? fonts.ready : Promise.resolve();
wait.then(function () {
setTimeout(function () { try { win.focus(); win.print(); } catch (e) { console.error(e); } }, 400);
});
};
if (win.document.readyState === "complete") go();
else win.onload = go;
} catch (e) {
console.error(e);
toast("Falha ao montar os certificados.", "error");
}
}
$("btnPrintAll").addEventListener("click", function () {
var list = validParticipants();
if (!list.length) { toast("Adicione ao menos um participante com nome.", "error"); return; }
var f = getForm();
var pages = [];
list.forEach(function (p) {
pages.push(frontHTML(p, f));
pages.push(versoHTML(p, f));
});
openPrint(pages);
toast("Preparando " + list.length + " certificado(s) para impressão.");
});
$("btnPrintPreview").addEventListener("click", function () {
var list = validParticipants();
if (!list.length) { toast("Nenhum participante para imprimir.", "error"); return; }
var p = list[Math.min(state.idx, list.length - 1)];
var f = getForm();
openPrint([frontHTML(p, f), versoHTML(p, f)]);
toast("Preview enviado para impressão.");
});
$("btnCopySummary").addEventListener("click", function () {
var f = getForm();
var list = validParticipants();
var txt = "Curso: " + f.curso + "\nDatas: " + f.datas + "\nCarga horária: " + f.ch + " h\nLocal: " + f.local + "\nParticipantes: " + list.length;
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(txt).then(function () { toast("Resumo copiado."); }, function () { toast("Não foi possível copiar.", "error"); });
} else {
toast("Cópia não suportada neste navegador.", "error");
}
});
$("btnResetForm").addEventListener("click", function () {
$("curso").value = "Cooperativismo e Gestão de Cooperativas Rurais";
$("datas").value = "28/09/2026 a 02/10/2026";
$("ch").value = "40";
$("local").value = "Palmas";
$("dataEmissao").value = todayISO();
$("instPart").value = "";
$("cnpjPart").value = "";
$("instReal").value = "";
$("cnpjReal").value = "";
$("apoio").value = "Apoio: Serviço Nacional de Aprendizagem do Cooperativismo no Estado do Tocantins – SESCOOP/TO";
state.idx = 0;
renderList();
refresh();
toast("Exemplo restaurado.");
});
// ---------- Inicialização ----------
document.addEventListener("DOMContentLoaded", function () {
try {
$("dataEmissao").value = todayISO();
renderList();
setFace("front");
refresh();
window.addEventListener("load", function () { safe(applyZoom); });
} catch (e) {
console.error(e);
}
});
})();