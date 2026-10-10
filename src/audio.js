/* All sound is synthesized locally using Web Audio. No third-party audio or voice assets. */
export class AudioDirector{
 constructor(){this.ctx=null;this.master=null;this.volume=.65;this.active=false;this.lastStep=0;this.lastHeart=0;this.nextNoise=0;this.near=0}
 start(){if(this.ctx){this.ctx.resume();return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try{const a=this.ctx=new AC;this.master=a.createGain();this.master.gain.value=this.volume*.5;this.master.connect(a.destination);const hum=a.createOscillator(),low=a.createBiquadFilter(),gain=a.createGain();hum.type='sawtooth';hum.frequency.value=53;low.type='lowpass';low.frequency.value=82;gain.gain.value=.06;hum.connect(low).connect(gain).connect(this.master);hum.start();this.hum=hum;const nbuf=a.createBuffer(1,a.sampleRate*2,a.sampleRate),d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.25;const noise=a.createBufferSource(),filter=a.createBiquadFilter(),ng=a.createGain();noise.buffer=nbuf;noise.loop=true;filter.type='lowpass';filter.frequency.value=270;ng.gain.value=.19;noise.connect(filter).connect(ng).connect(this.master);noise.start();this.noiseGain=ng;this.active=true}catch(e){console.warn('Audio unavailable',e)}}
 setVolume(v){this.volume=v;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(v*.5,this.ctx.currentTime,.04)}
 tone(freq,duration=.15,type='sine',vol=.13,offset=0,endFreq=null){if(!this.ctx)return;const a=this.ctx,t=a.currentTime+offset,osc=a.createOscillator(),g=a.createGain();osc.type=type;osc.frequency.setValueAtTime(Math.max(20,freq),t);if(endFreq)osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0003,vol),t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(g).connect(this.master);osc.start(t);osc.stop(t+duration+.03)}
 noiseHit(duration=.2,volume=.3,cutoff=900){if(!this.ctx)return;const a=this.ctx,t=a.currentTime,b=a.createBuffer(1,Math.floor(a.sampleRate*duration),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=cutoff;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f).connect(g).connect(this.master);s.start(t)}
 door(){this.tone(170,.55,'sawtooth',.15,0,66);this.tone(55,.48,'triangle',.12);this.noiseHit(.18,.11,600)}
 pickup(){this.tone(570,.13,'sine',.14);this.tone(820,.23,'sine',.09,.07)}
 page(){this.noiseHit(.11,.09,1900);this.tone(240,.08,'triangle',.035)}
 step(){this.noiseHit(.075,.075,380);this.tone(75,.06,'triangle',.05)}
 flash(){this.noiseHit(.22,.43,3400);this.tone(120,.35,'sawtooth',.21,0,30)}
 scare(){this.noiseHit(1.35,.75,2900);this.tone(43,1.2,'sawtooth',.54,0,31);this.tone(520,.45,'sawtooth',.29,0,65);this.tone(1220,.28,'square',.11,0,180)}
 stinger(){[292,267,213,108].forEach((f,i)=>this.tone(f,.65,'sawtooth',.075,i*.21,Math.max(40,f*.72)))}
 jingle(){// Archival 1973 music-box sequence: not a present-day voice.
   [392,493.88,587.33,493.88,392,329.63,392].forEach((f,i)=>this.tone(f,.24,'sine',.11,i*.26))
 }
 tick(t,walking,enemyDistance,threat,outside){if(!this.ctx)return;if(walking&&t-this.lastStep>.36){this.step();this.lastStep=t}if(threat&&t-this.lastHeart>Math.max(.34,1.0-enemyDistance*.035)){this.tone(55,.11,'sine',.18);this.tone(64,.09,'sine',.13,.15);this.lastHeart=t}if(this.noiseGain)this.noiseGain.gain.setTargetAtTime(outside?.24:.09,this.ctx.currentTime,.7);if(t-this.nextNoise>10+Math.random()*8){this.tone(48,.9,'triangle',.06,0,34);this.nextNoise=t}}
}
