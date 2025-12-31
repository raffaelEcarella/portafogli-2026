let movimenti=JSON.parse(localStorage.getItem('movimenti')||'[]');
let grafico;

// LOGIN
function checkAccess(){
  const username=document.getElementById('username').value.trim();
  const email=document.getElementById('userEmail').value.trim();
  const code=document.getElementById('accessCode').value.trim();
  
  if(username.toUpperCase()==='AUTOOF'){localStorage.clear();alert('Dati resettati!');location.reload();return;}

  let profilo=JSON.parse(localStorage.getItem('profilo'));
  if(!profilo){
    if(!username||!code){alert('Compila nome e codice');return;}
    profilo={nome:username,email:email,codice:code};
    localStorage.setItem('profilo',JSON.stringify(profilo));
  }else{
    if(username!==profilo.nome||code!==profilo.codice){alert('Nome o codice errati!');return;}
  }

  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='block';
  caricaProfilo(); aggiornaDashboard();
}

// MENU
function apriSezione(nome){
  ['home','movimenti','obiettivi','impostazioni'].forEach(s=>{
    document.getElementById(s+'Section').style.display=(s===nome)?'block':'none';
  });
}

// PROFILO
function caricaProfilo(){
  const p=JSON.parse(localStorage.getItem('profilo'));
  if(p){
    document.getElementById('profileName').value=p.nome||'';
    document.getElementById('profileEmail').value=p.email||'';
    document.getElementById('profileCode').value=p.codice||'';
  }
}
function aggiornaProfilo(){
  const nome=document.getElementById('profileName').value;
  const email=document.getElementById('profileEmail').value;
  const codice=document.getElementById('profileCode').value;
  if(!nome||!email||!codice){alert('Compila tutti i campi');return;}
  localStorage.setItem('profilo',JSON.stringify({nome,email,codice}));
  alert('Profilo aggiornato!');
}
function resetApp(){localStorage.clear();alert('App resettata!');location.reload();}

// MOVIMENTI
function aggiungiMovimento(){
  const desc=document.getElementById('descMov').value;
  const imp=parseFloat(document.getElementById('importoMov').value)||0;
  const tipo=document.getElementById('tipoMov').value;
  if(!desc||!imp){alert('Compila descrizione e importo');return;}
  movimenti.push({desc,imp,tipo,data:new Date().toISOString()});
  localStorage.setItem('movimenti',JSON.stringify(movimenti));
  applicaFiltri();
  document.getElementById('descMov').value='';document.getElementById('importoMov').value='';
}
function eliminaMov(i){movimenti.splice(i,1);localStorage.setItem('movimenti',JSON.stringify(movimenti));applicaFiltri();}

// FILTRI
function gestisciPeriodoPicker(){
  const v=document.getElementById('filtroData').value;
  document.getElementById('periodoPicker').style.display=(v==='periodo')?'block':'none';
  applicaFiltri();
}

function applicaFiltri(){
  const filtroData=document.getElementById('filtroData').value;
  const filtroCat=document.getElementById('filtroCategoria').value;
  const listaDiv=document.getElementById('lista');
  const oggi=new Date();
  let inizio, fine;

  if(filtroData==='mese'){
    inizio=new Date(oggi.getFullYear(),oggi.getMonth(),1);
    fine=new Date(oggi.getFullYear(),oggi.getMonth()+1,0,23,59,59);
  } else if(filtroData==='periodo'){
    const di=document.getElementById('dataInizio').value;
    const df=document.getElementById('dataFine').value;
    if(di && df){ inizio=new Date(di); fine=new Date(df+'T23:59:59'); }
  }

  let saldo=0,ing=0,sp=0;
  let html='';

  movimenti.forEach((m,i)=>{
    const mData=new Date(m.data);
    if(inizio && fine && (mData<inizio || mData>fine)) return;
    if(filtroCat!=='tutte' && m.tipo!==filtroCat) return;

    html+=`<div>${m.data.substring(0,10)} - ${m.desc} - €${m.imp} 
    <button onclick="eliminaMov(${i})">❌</button></div>`;
    
    if(m.tipo==='ingresso'){saldo+=m.imp;ing+=m.imp;}else{saldo-=m.imp;sp+=m.imp;}
  });

  document.getElementById('saldoTot').textContent=`€${saldo}`;
  document.getElementById('totIn').textContent=`€${ing}`;
  document.getElementById('totSp').textContent=`€${sp}`;
  listaDiv.innerHTML=html;

  aggiornaObiettivi();
  aggiornaGraficoFiltrato(inizio,fine,filtroCat);
}

// OBIETTIVI
function salvaObiettivi(){
  const g=parseFloat(document.getElementById('obiettivoGuadagno').value)||0;
  const s=parseFloat(document.getElementById('obiettivoSpesa').value)||0;
  localStorage.setItem('obiettivi',JSON.stringify({guadagno:g,spesa:s}));
  aggiornaObiettivi(); alert('Obiettivi salvati!');
}
function aggiornaObiettivi(){
  const o=JSON.parse(localStorage.getItem('obiettivi')||'{}');
  const saldo=parseFloat(document.getElementById('saldoTot').textContent.replace('€',''))||0;
  let status='';
  if(o.guadagno&&saldo>=o.guadagno) status+='🎉 Obiettivo guadagno raggiunto!<br>';
  if(o.spesa&&saldo<=-o.spesa) status+='⚠️ Obiettivo spesa superato!<br>';
  document.getElementById('statusObiettivi').innerHTML=status;
}

// GRAFICO
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
  grafico=new Chart(ctx,{type:'line',data:{labels:mesi,datasets:[{label:'Saldo filtrato',data:dati,borderColor:'blue',fill:false}]},options:{responsive:true}});
}

// DARK MODE & TOGGLE SALDO
document.getElementById('darkToggle').addEventListener('click',()=>document.body.classList.toggle('dark'));
document.getElementById('toggleSaldo').addEventListener('click',()=>{
  const s=document.getElementById('saldoTot');
  if(s.textContent!=='€•••'){s.textContent='€•••';}else{applicaFiltri();}
});

window.addEventListener('load',()=>{caricaProfilo();applicaFiltri();});
