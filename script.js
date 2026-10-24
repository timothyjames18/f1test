(function(){
  var pad=document.getElementById('pad'), gantry=document.getElementById('gantry');
  var readout=document.getElementById('readout'), msg=document.getElementById('msg');
  var hist=document.getElementById('hist');
  var lamps=[];
  for(var c=0;c<5;c++){
    var col=document.createElement('div');col.className='col';
    for(var r=0;r<2;r++){var l=document.createElement('div');l.className='lamp';col.appendChild(l);lamps.push(l);}
    gantry.appendChild(col);
  }
  var cols=gantry.children;
  function setCols(n){for(var i=0;i<5;i++){var on=i<n;for(var j=0;j<2;j++){cols[i].children[j].classList.toggle('on',on);}}}

  var state='idle', timers=[], goTime=0, results=[];
  var audioCtx=null, beepOn=true;
  try{if(localStorage.getItem('lo-beep')==='off')beepOn=false;}catch(e){}
  function unlock(){
    if(!beepOn)return;
    try{
      if(!audioCtx){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=new AC();}
      if(audioCtx.state==='suspended')audioCtx.resume();
    }catch(e){}
  }
  function tone(freq,dur){
    if(!beepOn||!audioCtx)return;
    try{
      var t=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type='square';o.frequency.value=freq;
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.12,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+0.02);
    }catch(e){}
  }
  try{var saved=JSON.parse(localStorage.getItem('lo-results')||'[]');if(Array.isArray(saved))results=saved.filter(function(x){return typeof x==='number'}).slice(-50);}catch(e){}

  function clearTimers(){timers.forEach(clearTimeout);timers=[];}
  function save(){try{localStorage.setItem('lo-results',JSON.stringify(results));}catch(e){}}

  function render(){
    var n=results.length;
    document.getElementById('sCount').textContent=n;
    document.getElementById('sBest').textContent=n?Math.min.apply(null,results)+' ms':'–';
    document.getElementById('sAvg').textContent=n?Math.round(results.reduce(function(a,b){return a+b},0)/n)+' ms':'–';
    hist.innerHTML='';
    if(!n){var li=document.createElement('li');li.className='empty';li.textContent='No attempts yet.';hist.appendChild(li);return;}
    results.slice(-8).reverse().forEach(function(v,i){
      var li=document.createElement('li');
      if(v===Math.min.apply(null,results))li.className='best';
      var a=document.createElement('span');a.textContent='Attempt '+(n-i);
      var b=document.createElement('span');b.textContent=v+' ms';
      li.appendChild(a);li.appendChild(b);hist.appendChild(li);
    });
  }

  function start(){
    clearTimers();unlock();state='lights';setCols(0);
    readout.className='';readout.textContent='Get ready';
    msg.textContent='Wait for the lights to go out.';
    for(var i=1;i<=5;i++){(function(k){timers.push(setTimeout(function(){setCols(k);tone(660,0.12);},k*1000));})(i);}
    var hold=1000+Math.random()*3000; // 1–4 s after the fifth light
    timers.push(setTimeout(function(){
      setCols(0);state='go';goTime=performance.now();tone(990,0.3);
      readout.textContent='GO';msg.textContent='';
    },5000+hold));
  }

  function press(){
    if(state==='idle'){start();return;}
    if(state==='lights'){
      clearTimers();state='idle';setCols(0);
      readout.className='bad';readout.textContent='Jump start';
      msg.textContent='You reacted before the lights went out. Press to try again.';
      return;
    }
    if(state==='go'){
      var t=Math.round(performance.now()-goTime);
      state='idle';results.push(t);if(results.length>50)results.shift();save();render();
      readout.className='good';readout.textContent=t+' ms';
      msg.textContent=t<150?'Faster than most humans can manage. Press to go again.':'Press to go again.';
    }
  }

  pad.addEventListener('pointerdown',function(e){e.preventDefault();press();});
  pad.addEventListener('keydown',function(e){
    if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)press();}
  });
  pad.addEventListener('click',function(e){e.preventDefault();});
  document.getElementById('reset').addEventListener('click',function(){results=[];save();render();});
var beepBtn=document.getElementById('beepBtn');
  function showBeep(){beepBtn.setAttribute('aria-pressed',beepOn?'true':'false');beepBtn.textContent='Beep: '+(beepOn?'On':'Off');}
  beepBtn.addEventListener('click',function(){
    beepOn=!beepOn;showBeep();
    try{localStorage.setItem('lo-beep',beepOn?'on':'off');}catch(e){}
    if(beepOn){unlock();tone(660,0.12);}
  });
  showBeep();
  render();
})();
