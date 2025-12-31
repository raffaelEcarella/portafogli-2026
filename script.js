let movimenti = JSON.parse(localStorage.getItem('movimenti') || '[]');
let grafico;
let tentativi = 0;

function checkPin() {
  const pin = document.getElementById('pinInput').value.trim().toUpperCase();
  const msg = document.getElementById('loginMsg');

  if (pin === 'AUTOOF') { resetApp(); return; }

  let savedPin = localStorage.getItem('appPin');

  if (!savedPin) {
    if (!pin) { msg.textContent = 'Inserisci un PIN valido!'; return; }
    localStorage.setItem('appPin', pin);
    mostraApp(); return;
  }

  if (pin === savedPin) { mostraApp(); }
  else {
    tentativi++;
    if (tentativi >= 3) msg.textContent = 'PIN errato 3 volte! Usa AUTOOF per resettare l’app.';
    else msg.textContent = `PIN errato (${tentativi}/3)`;
  }
}

function mostraApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  apriSezione('home');
  applicaFiltri();
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnAccedi').addEventListener('click', checkPin);
  document.getElementById('pinInput').addEventListener('keypress', function(e){
    if(e.key==='Enter') checkPin();
  });
});

function apriSezione(nome) {
  ['home','movimenti','impostazioni'].forEach(s => {
    document.getElementById(s+'Section').style.display = (s===nome)?'block':'none';
  });
}

function aggiungiMovimento() {
  const desc = document.getElementById('descMov').value;
  const imp = parseFloat(document.getElementById('importoMov').value)||0;
  const tipo = document.getElementById('tipoMov').value;
  let data = document.getElementById('dataMov').value;

  if (!desc || !imp) { alert('Compila descrizione e importo'); return; }
  if (!data) data = new Date().toISOString();
  else data = new Date(data+'T12:00:00').toISOString();

  movimenti.push({ desc, imp, tipo, data });
  localStorage.setItem('movimenti', JSON.stringify(movimenti));
  applicaFiltri();

  document.getElementById('descMov').value='';
  document.getElementById('importoMov').value='';
  document.getElementById('dataMov').value='';
}

function eliminaMov(i) { movimenti.splice(i,1); localStorage.setItem('movimenti',JSON.stringify(movimenti)); applicaFiltri(); }

function gestisciPeriodoPicker() {
  const v = document.getElementById('filtroData').value;
  document.getElementById('periodoPicker').style.display = (v==='periodo')?'block':'none';
  applicaFiltri();
}

function applicaFiltri() {
  const filtroData = document.getElementById('filtroData').value;
  const filtroCat = document.getElementById('filtroCategoria').value;
  const listaDiv = document.getElementById('lista');
  const oggi = new Date();
  let inizio, fine;

  if (filtroData==='mese') { inizio=new Date(oggi.getFullYear(),oggi.getMonth(),1); fine=new Date(oggi.getFullYear(),oggi.getMonth()+1,0,23,59,59); }
  else if (filtroData==='periodo') {
    const di=document.getElementById('dataInizio').value;
    const df=document.getElementById('dataFine').value;
    if(di && df){ inizio=new Date(di); fine=new Date(df+'T23:59:59'); }
  }

  let saldo=0, ing=0, sp=0; let html='';

  movimenti.forEach((m,i)=>{
    const mData = new Date(m.data);
    if(inizio && mData<inizio) return;
    if(fine && mData>fine) return;
    if(filtroCat!=='tutte' && m.tipo!==filtroCat) return;

    html += `<div>${m.data.substring(0,10)} - ${m.desc} - €${m.imp} 
    <button onclick="eliminaMov(${i})">❌</button></div>`;

    if(m.tipo==='ingresso'){ saldo+=m.imp; ing+=m.imp; }
    else { saldo-=m.imp; sp+=m.imp; }
  });

  document.getElementById('saldoTot').textContent=`€${saldo}`;
  document.getElementById('totIn')?.textContent=`€${ing}`;
  document.getElementById('totSp')?.textContent=`€${sp}`;
  listaDiv.innerHTML=html;

  aggiornaObiettivi();
  aggiornaGraficoFiltrato(inizio,fine,filtroCat);
}

function salvaObiettivi() {
  const g=parseFloat(document.getElementById('obiettivoGuadagno').value)||0;
  const s=parseFloat(document.getElementById('obiettivoSpesa').value)||0;
  localStorage.setItem('obiettivi',JSON.stringify({guadagno:g,spesa:s}));
  aggiornaObiettivi();
  alert('Obiettivi salvati!');
}

function aggiornaObiettivi() {
  const o=JSON.parse(localStorage.getItem('obiettivi')||'{}');
  const saldo=parseFloat(document.getElementById('saldoTot').textContent.replace('€',''))||0;
  let status='';
  if(o.guadagno && saldo>=o.guadagno) status+='🎉 Obiettivo guadagno raggiunto!<br>';
  if(o.spesa && saldo<=-o.spesa) status+='⚠️ Obiettivo spesa superato!<br>';
  document.getElementById('statusObiettivi').innerHTML=status;
}

function aggiornaGraficoFiltrato(inizio,fine,filtroCat){
  const ctx=document.getElementById('grafico').getContext('2d');
  const mesi=["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
  const dati=new Array(12).fill(0);

  movimenti.forEach(m=>{
    const d=new Date(m.data);
    if(inizio && d<inizio) return;
    if(fine && d>fine) return;
    if(filtroCat!=='tutte' && m.tipo!==filtroCat) return;
    dati[d.getMonth()]+=(m.tipo==='ingresso')?m.imp:-m.imp;
  });

  if(grafico) grafico.destroy();
  grafico=new Chart(ctx,{type:'line',data:{labels:mesi,datasets:[{label:'Saldo',data:dati,borderColor:'blue',fill:false}]},options:{responsive:true}});
}

document.getElementById('darkToggle').addEventListener('click',()=>document.body.classList.toggle('dark'));
document.getElementById('toggleSaldo').addEventListener('click',()=>{
  const s=document.getElementById('saldoTot');
  s.textContent=(s.textContent!=='€•••')?'€•••':`€${movimenti.reduce((acc,m)=>acc+(m.tipo==='ingresso'?m.imp:-m.imp),0)}`;
});

function resetApp(){ localStorage.clear(); alert('App resettata!'); location.reload(); }
