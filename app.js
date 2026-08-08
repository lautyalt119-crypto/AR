const STORAGE_KEY = "guardianAR_reports_v2";

// Configuración: para usar la verificación REAL, desplegá worker.js y colocá su URL aquí.
// Ejemplo: window.GUARDIAN_API_URL = "https://guardian-ar-api.tudominio.workers.dev";
window.GUARDIAN_API_URL = "";



const $ = (id) => document.getElementById(id);

function getReports(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch(e){ return []; }
}
function saveReports(reports){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  updateStats();
  renderReports();
  renderLibrary();
}

function escapeHTML(value){
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function showSection(id){
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const section = $(id);
  if(section) section.classList.add("active");
  const btn = document.querySelector(`[data-section="${id}"]`);
  if(btn) btn.classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.section));
});
document.querySelectorAll("[data-go]").forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.go));
});

function calculateRisk(){
  // Indicadores ficticios para la demo.
  const indicators = [];
  let score = 0;

  const recent = Math.random() < .35;
  const shared = Math.random() < .40;
  const unusual = Math.random() < .30;
  const tls = Math.random() < .20;

  if(recent){score += 25; indicators.push("Dominio reciente (simulado)");}
  if(shared){score += 30; indicators.push("Infraestructura compartida (simulada)");}
  if(unusual){score += 15; indicators.push("Configuración técnica inusual (simulada)");}
  if(tls){score += 10; indicators.push("Indicador TLS para revisión (simulado)");}

  if(indicators.length === 0) indicators.push("No se detectaron indicadores relevantes en esta simulación.");

  return {score: Math.min(score,100), indicators};
}

function riskInfo(score){
  if(score >= 60) return {
    level:"ALTO", cls:"high", bg:"bg-high",
    interpretation:"Se acumularon varios indicadores técnicos. Requiere revisión humana prioritaria."
  };
  if(score >= 30) return {
    level:"MEDIO", cls:"medium", bg:"bg-medium",
    interpretation:"Hay algunos indicadores técnicos. Conviene realizar una revisión humana."
  };
  return {
    level:"BAJO", cls:"low", bg:"bg-low",
    interpretation:"Se encontraron pocos indicadores en esta simulación. No implica que el sitio sea seguro ni constituye una acusación."
  };
}

let lastReport = null;

function analyze(){
  const domain = $("domainInput").value.trim();
  if(!domain){
    alert("Ingresá un dominio de prueba.");
    return;
  }

  const {score, indicators} = calculateRisk();
  const info = riskInfo(score);

  lastReport = {
    id: "GAR-" + Date.now().toString(36).toUpperCase(),
    type:"domain",
    subject:domain,
    score,
    level:info.level,
    indicators,
    createdAt:new Date().toISOString(),
    source:"Guardian AR — simulación"
  };

  $("analysisResult").className = "result";
  $("analysisResult").innerHTML = `
    <div class="risk-head">
      <div>
        <div class="eyebrow">NIVEL DE RIESGO</div>
        <div class="risk-label ${info.cls}">${info.level}</div>
      </div>
      <div class="risk-score ${info.cls}">${score}<small>/100</small></div>
    </div>
    <div class="risk-wrap">
      <div class="bar"><div class="bar-fill ${info.bg}" style="width:${score}%"></div></div>
      <div class="scale"><span>0 · BAJO</span><span>30 · MEDIO</span><span>60 · ALTO</span><span>100</span></div>
    </div>
    <p><b>${escapeHTML(info.interpretation)}</b></p>
    <div class="indicators">
      ${indicators.map(x => `<div class="indicator">• ${escapeHTML(x)}</div>`).join("")}
    </div>
    <div class="actions">
      <button class="primary" id="saveCurrent">💾 Guardar informe</button>
      <button class="secondary" id="pdfCurrent">📄 Exportar PDF</button>
    </div>
  `;

  $("saveCurrent").onclick = () => {
    const reports = getReports();
    reports.unshift(lastReport);
    saveReports(reports);
    alert("Informe guardado en este dispositivo.");
  };
  $("pdfCurrent").onclick = () => exportPDF(lastReport);
}

$("analyzeBtn").addEventListener("click", analyze);
$("domainInput").addEventListener("keydown", e => { if(e.key === "Enter") analyze(); });

function formatDate(iso){
  return new Date(iso).toLocaleString("es-AR");
}

function renderReports(){
  const reports = getReports();
  if(!reports.length){
    $("reportsList").innerHTML = `<div class="result empty">Todavía no hay informes guardados.</div>`;
    return;
  }

  $("reportsList").innerHTML = reports.map((r,i) => {
    const info = riskInfo(r.score);
    return `
      <div class="report-item">
        <div class="report-top">
          <div><b>${escapeHTML(r.id)}</b> · ${escapeHTML(r.subject)}</div>
          <span class="pill ${info.cls}">${escapeHTML(r.level)} · ${r.score}/100</span>
        </div>
        <p class="muted">${formatDate(r.createdAt)}</p>
        <div class="actions">
          <button class="secondary" onclick="exportPDF(getReports()[${i}])">📄 PDF</button>
          <button class="danger" onclick="deleteReport(${i})">Eliminar</button>
        </div>
      </div>
    `;
  }).join("");
}

function deleteReport(index){
  const reports = getReports();
  reports.splice(index,1);
  saveReports(reports);
}

function exportPDF(report){
  if(!report){alert("No hay un informe seleccionado.");return;}
  if(!window.jspdf){alert("No se cargó el módulo PDF. Revisá tu conexión y recargá la página.");return;}

  const {jsPDF} = window.jspdf;
  const pdf = new jsPDF();
  const info = riskInfo(report.score);

  pdf.setFillColor(11,78,162);
  pdf.rect(0,0,210,30,"F");
  pdf.setTextColor(255,255,255);
  pdf.setFontSize(20);
  pdf.text("GUARDIAN AR",15,19);
  pdf.setFontSize(10);
  pdf.text("Protección digital responsable",15,25);

  pdf.setTextColor(25,35,50);
  pdf.setFontSize(15);
  pdf.text("REPORTE DE ANÁLISIS",15,45);
  pdf.setFontSize(11);
  pdf.text(`Caso: ${report.id}`,15,56);
  pdf.text(`Fecha: ${formatDate(report.createdAt)}`,15,63);
  pdf.text(`Objeto: ${report.subject}`,15,70);
  pdf.text(`Nivel: ${report.level} (${report.score}/100)`,15,77);

  let y = 90;
  pdf.setFontSize(12);
  pdf.text("Indicadores",15,y); y += 8;
  pdf.setFontSize(10);

  report.indicators.forEach(ind => {
    const lines = pdf.splitTextToSize("• " + ind, 175);
    pdf.text(lines,18,y);
    y += lines.length * 6;
  });

  y += 8;
  pdf.setFontSize(11);
  pdf.text("Interpretación",15,y); y += 7;
  pdf.setFontSize(10);
  const interpretation = pdf.splitTextToSize(info.interpretation,175);
  pdf.text(interpretation,15,y);
  y += interpretation.length * 6 + 10;

  pdf.setFontSize(9);
  pdf.setTextColor(90,100,115);
  const disclaimer = "AVISO: este informe contiene indicadores técnicos y no determina que una persona, dominio o servicio haya cometido un delito. Requiere revisión humana. Esta versión utiliza datos simulados.";
  pdf.text(pdf.splitTextToSize(disclaimer,175),15,y);

  pdf.save(`${report.id}_GuardianAR.pdf`);
}

$("exportJsonBtn").addEventListener("click",()=>{
  const reports = getReports();
  if(!reports.length){alert("No hay informes para exportar.");return;}
  const blob = new Blob([JSON.stringify(reports,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "GuardianAR_informes.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

$("clearReportsBtn").addEventListener("click",()=>{
  if(confirm("¿Borrar todos los informes de este dispositivo?")){
    localStorage.removeItem(STORAGE_KEY);
    updateStats(); renderReports(); renderLibrary();
  }
});

function renderLibrary(){
  const reports = getReports();
  if(!reports.length){
    $("libraryList").innerHTML = `<div class="result empty">La biblioteca local está vacía.</div>`;
    return;
  }
  $("libraryList").innerHTML = reports.map(r=>{
    const info=riskInfo(r.score);
    return `<div class="report-item">
      <div class="report-top"><b>${escapeHTML(r.subject)}</b><span class="pill ${info.cls}">${r.level}</span></div>
      <p class="muted">${escapeHTML(r.id)} · ${formatDate(r.createdAt)}</p>
      <p>${escapeHTML(info.interpretation)}</p>
    </div>`;
  }).join("");
}

$("importJsonBtn").addEventListener("click",()=> $("importFile").click());
$("importFile").addEventListener("change",e=>{
  const file=e.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const incoming=JSON.parse(reader.result);
      const list=Array.isArray(incoming)?incoming:[incoming];
      const valid=list.filter(r=>r && r.id && r.subject && Number.isFinite(r.score));
      const reports=getReports();
      const ids=new Set(reports.map(r=>r.id));
      valid.forEach(r=>{if(!ids.has(r.id))reports.push(r);});
      saveReports(reports);
      alert(`${valid.length} informe(s) importado(s).`);
    }catch(err){alert("Archivo JSON no válido.");}
  };
  reader.readAsText(file);
  e.target.value="";
});

function searchTopic(){
  const topic=$("topicInput").value.trim();
  if(!topic){alert("Ingresá un tema.");return;}

  const q=encodeURIComponent(topic);
  const links=[
    ["Wikipedia","https://es.wikipedia.org/w/index.php?search="+q],
    ["Google","https://www.google.com/search?q="+q],
    ["DuckDuckGo","https://duckduckgo.com/?q="+q],
    ["Google Noticias","https://news.google.com/search?q="+q]
  ];

  $("searchResult").className="result";
  $("searchResult").innerHTML=`
    <p><b>Fuentes públicas para:</b> ${escapeHTML(topic)}</p>
    ${links.map(([name,url])=>`<div class="source">🔎 <a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a></div>`).join("")}
    <p class="tiny">Guardian AR no descarga ni almacena automáticamente estas páginas. La revisión y selección de fuentes queda en manos del usuario.</p>
  `;
}
$("searchBtn").addEventListener("click",searchTopic);
$("topicInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchTopic();});


async function realCheck(){
  const raw=$("realUrlInput").value.trim();
  if(!raw){alert("Ingresá una URL completa.");return;}
  let url;
  try{
    url=new URL(raw);
    if(!["http:","https:"].includes(url.protocol)) throw new Error();
  }catch(e){
    alert("URL no válida. Usá http:// o https://");
    return;
  }

  const box=$("realCheckResult");
  if(!window.GUARDIAN_API_URL){
    box.className="result";
    box.innerHTML=`<b>Endpoint no configurado.</b><p class="muted">La parte real usa un backend seguro para no exponer claves de API en GitHub Pages. La app no envía el contenido de la página: solo la URL para una comprobación de reputación.</p>`;
    return;
  }

  box.className="result";
  box.innerHTML="⏳ Verificando reputación...";
  try{
    const response=await fetch(window.GUARDIAN_API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({url:url.href})
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"Error del servidor");

    const safe=data.safe===true;
    box.innerHTML=`
      <div class="risk-head">
        <div><div class="eyebrow">REPUTACIÓN</div>
        <div class="risk-label ${safe?"low":"high"}">${safe?"SIN COINCIDENCIA DE AMENAZA":"COINCIDENCIA DE AMENAZA"}</div></div>
        <div class="risk-score ${safe?"low":"high"}">${safe?"OK":"!"}</div>
      </div>
      <p><b>${escapeHTML(data.message||"Resultado recibido.")}</b></p>
      <p class="tiny">Fuente: Google Safe Browsing. Esto no demuestra que una página sea legal o ilegal; solo indica si coincide con categorías de amenazas conocidas.</p>
    `;
  }catch(e){
    box.innerHTML=`<b>No se pudo completar la verificación.</b><p class="muted">${escapeHTML(e.message)}</p>`;
  }
}
$("realCheckBtn").addEventListener("click",realCheck);
$("realUrlInput").addEventListener("keydown",e=>{if(e.key==="Enter")realCheck();});

const football={
  round:0, goals:0, saves:0, finished:false,
  directions:["IZQUIERDA","CENTRO","DERECHA"],
  current:null
};

function renderFootball(){
  if(football.finished){
    const win=football.goals>football.saves;
    $("footballGame").innerHTML=`
      <div class="result">
        <h3>${win?"🏆 ¡GANASTE LA COPA!":"🥲 Final del partido"}</h3>
        <p>Resultado: <b>${football.goals} - ${football.saves}</b></p>
        <button class="primary" onclick="restartFootball()">🔄 Jugar otra vez</button>
      </div>`;
    return;
  }
  $("footballGame").innerHTML=`
    <div class="grid three">
      <div class="stat card"><b>${football.goals}</b><span>Goles</span></div>
      <div class="stat card"><b>${football.saves}</b><span>Atajadas</span></div>
      <div class="stat card"><b>${football.round}/5</b><span>Penales</span></div>
    </div>
    <div class="result">
      <h3>⚽ Penal ${football.round+1}</h3>
      <p>Elegí dónde patear. El arquero también elige al azar.</p>
      <div class="actions">
        ${football.directions.map(d=>`<button class="primary" onclick="takePenalty('${d}')">${d==="IZQUIERDA"?"⬅️":d==="DERECHA"?"➡️":"⬆️"} ${d}</button>`).join("")}
      </div>
      <p class="tiny">Bonus: después de cada penal aparece una pregunta rápida de seguridad digital.</p>
    </div>
  `;
}

window.takePenalty=(direction)=>{
  if(football.finished)return;
  const keeper=football.directions[Math.floor(Math.random()*3)];
  const goal=direction!==keeper;
  if(goal)football.goals++; else football.saves++;
  const question=[
    ["¿Qué hacés con una contraseña que alguien te pide por chat?",["La comparto","No la comparto"],1],
    ["¿Qué conviene hacer con una noticia dudosa?",["Verificar fuentes","Compartirla rápido"],0],
    ["¿Un resultado automático demuestra un delito?",["Sí","No, requiere revisión"],1]
  ][football.round%3];

  const answer=prompt(`${goal?"⚽ ¡GOL!":"🧤 ¡ATAJÓ EL ARQUERO!"}\n\n${question[0]}\n\n0) ${question[1][0]}\n1) ${question[1][1]}`);
  if(answer!==null && Number(answer)===question[2]){
    alert("🧠 ¡Buenísima! Sumás un bonus de conocimiento.");
  }else{
    alert("📚 Casi. Recordá: Guardian AR ayuda a organizar señales, no reemplaza la revisión humana.");
  }

  football.round++;
  if(football.round>=5)football.finished=true;
  renderFootball();
};
window.restartFootball=()=>{football.round=0;football.goals=0;football.saves=0;football.finished=false;renderFootball();};
function updateStats(){
  const reports=getReports();
  $("statReports").textContent=reports.length;
  $("statHigh").textContent=reports.filter(r=>r.score>=60).length;
  $("statCases").textContent=reports.length;
}

renderQuiz();
updateStats();
renderReports();
renderLibrary();
