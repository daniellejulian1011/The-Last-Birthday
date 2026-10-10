/* The Last Birthday - native WebGL2 micro-engine. No dependencies or build step. */
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const dist2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const V=(x=0,y=0,z=0)=>({x,y,z});
const colors={};
function rgb(c){if(Array.isArray(c))return c;if(colors[c])return colors[c];c=c.replace('#','');if(c.length===3)c=c.split('').map(v=>v+v).join('');return colors['#'+c]=[parseInt(c.substring(0,2),16)/255,parseInt(c.substring(2,4),16)/255,parseInt(c.substring(4,6),16)/255]}
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function norm(v){const n=Math.hypot(...v)||1;return v.map(e=>e/n)}
export class Geometry{
 constructor(){this.vertices=[];this.count=0}
 tri(a,b,c,col,glow=0,n=null){const face=n||norm(cross(sub(b,a),sub(c,a)));const color=rgb(col);for(const p of [a,b,c])this.vertices.push(...p,...face,...color,glow);this.count+=3;return this}
 quad(a,b,c,d,color,glow=0,n=null){this.tri(a,b,c,color,glow,n);this.tri(a,c,d,color,glow,n);return this}
 box(x,y,z,sx,sy,sz,color,glow=0,rot=0){const ax=sx/2,ay=sy/2,az=sz/2,cs=Math.cos(rot),sn=Math.sin(rot),tr=([xx,yy,zz])=>[x+xx*cs+zz*sn,y+yy,z+zz*cs-xx*sn];const v=[[-ax,-ay,-az],[ax,-ay,-az],[ax,ay,-az],[-ax,ay,-az],[-ax,-ay,az],[ax,-ay,az],[ax,ay,az],[-ax,ay,az]].map(tr);for(const f of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]])this.quad(v[f[0]],v[f[1]],v[f[2]],v[f[3]],color,glow);return this}
 sphere(x,y,z,rx,ry,rz,color,glow=0,lats=8,lons=12){for(let i=0;i<lats;i++){const a=-Math.PI/2+i*Math.PI/lats,b=-Math.PI/2+(i+1)*Math.PI/lats;for(let j=0;j<lons;j++){const p=j*2*Math.PI/lons,q=(j+1)*2*Math.PI/lons;const at=(la,lo)=>[x+rx*Math.cos(la)*Math.cos(lo),y+ry*Math.sin(la),z+rz*Math.cos(la)*Math.sin(lo)];const A=at(a,p),B=at(a,q),C=at(b,q),D=at(b,p);this.quad(A,D,C,B,color,glow)}}return this}
 rod(a,b,r,color,glow=0,sides=9){let up=sub(b,a),l=Math.hypot(...up);if(l<.0001)return this;up=up.map(v=>v/l);let ref=Math.abs(up[1])<.9?[0,1,0]:[1,0,0],right=norm(cross(up,ref)),front=norm(cross(up,right));const circle=(pos,ang)=>pos.map((p,i)=>p+r*(right[i]*Math.cos(ang)+front[i]*Math.sin(ang)));for(let k=0;k<sides;k++){let t=k*2*Math.PI/sides,u=(k+1)*2*Math.PI/sides;this.quad(circle(a,t),circle(a,u),circle(b,u),circle(b,t),color,glow)}this.tri(a,circle(a,0),circle(a,2*Math.PI/sides),color,glow);this.tri(b,circle(b,2*Math.PI/sides),circle(b,0),color,glow);return this}
 torus(x,y,z,r,t,color,glow=0,segments=14){for(let k=0;k<segments;k++){let a=k*2*Math.PI/segments,b=(k+1)*2*Math.PI/segments;this.rod([x+r*Math.cos(a),y,z+r*Math.sin(a)],[x+r*Math.cos(b),y,z+r*Math.sin(b)],t,color,glow,6)}return this}
 plane(x1,z1,x2,z2,y,c,glow=0){this.quad([x1,y,z1],[x2,y,z1],[x2,y,z2],[x1,y,z2],c,glow);return this}
}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0])}
function lookAt(eye,at){const z=norm(sub(eye,at)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]),1])}
const vs=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;layout(location=1) in vec3 aNormal;layout(location=2) in vec4 aColor;
uniform mat4 uProjection;uniform mat4 uView;
out vec3 vPos;out vec3 vNorm;out vec4 vColor;
void main(){vPos=aPosition;vNorm=aNormal;vColor=aColor;gl_Position=uProjection*uView*vec4(aPosition,1.);}`;
const fs=`#version 300 es
precision highp float;
in vec3 vPos;in vec3 vNorm;in vec4 vColor;
uniform vec3 uEye;uniform vec3 uForward;uniform vec3 uLamp1;uniform vec3 uLamp2;uniform float uLight;uniform float uTime;uniform float uScare;out vec4 outColor;
float hash(vec2 x){return fract(sin(dot(x,vec2(127.1,311.7)))*43758.5453);}
void main(){vec3 norml=normalize(vNorm);vec3 diff=vPos-uEye;float distanceToEye=length(diff);vec3 viewdir=normalize(diff);
float flashlight=pow(max(dot(viewdir,uForward),0.),16.)*uLight*(2.0/(1.+.026*distanceToEye*distanceToEye));
flashlight*=.68+.32*max(dot(norml,-viewdir),0.);
vec3 a=uLamp1-vPos;vec3 b=uLamp2-vPos;float l1=max(dot(norml,normalize(a)),0.)*13./(6.+dot(a,a));float l2=max(dot(norml,normalize(b)),0.)*11./(6.+dot(b,b));
float amb=.065+max(dot(norml,normalize(vec3(.4,1.,-.3))),0.)*.055;
float flutter=.84+.16*sin(uTime*3.7+vPos.x*.3);
vec3 lit=vColor.rgb*(amb+flashlight+flutter*l1*.36+l2*.28)+vColor.rgb*vColor.a*(.95+.1*sin(uTime*2.));
vec3 tint=vec3(.8,.80,.89);lit*=tint;lit+=vec3(.16,.03,.025)*uScare*.3;
float mist=1.-exp(-distanceToEye*.018);vec3 fogColor=mix(vec3(.018,.017,.024),vec3(.037,.021,.026),clamp(uScare,0.,1.));lit=mix(lit,fogColor,clamp(mist,0.,.81));
float grain=(hash(gl_FragCoord.xy+uTime*77.)-.5)*.031;lit+=grain;
vec3 mapped=lit/(lit+vec3(.78));mapped=pow(max(mapped,vec3(0.)),vec3(.93));outColor=vec4(mapped,1.);
}`;
function makeShader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});if(!this.gl)throw Error('WebGL2 is unavailable in this browser.');const gl=this.gl;const prog=gl.createProgram();gl.attachShader(prog,makeShader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(prog,makeShader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));this.prog=prog;gl.useProgram(prog);this.uni={};for(const n of ['Projection','View','Eye','Forward','Lamp1','Lamp2','Light','Time','Scare'])this.uni[n]=gl.getUniformLocation(prog,'u'+n);this.static=this.makeBuffer();this.dynamic=this.makeBuffer();gl.enable(gl.DEPTH_TEST);/* Double-sided geometry: interiors must be visible from within. */this.quality=1;this.lastWidth=0;this.lastHeight=0;}
 makeBuffer(){const gl=this.gl,vao=gl.createVertexArray(),buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(const [loc,n,offset] of [[0,3,0],[1,3,12],[2,4,24]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,40,offset)}gl.bindVertexArray(null);return{vao,buffer,count:0}}
 upload(slot,geo,usage){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,slot.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geo.vertices),usage);slot.count=geo.count}
 setStatic(geo){this.upload(this.static,geo,this.gl.STATIC_DRAW)}
 render(camera, dynamic, t,opts={}){const gl=this.gl, w=Math.min(1920,Math.floor(this.canvas.clientWidth*this.quality*devicePixelRatio)),h=Math.min(1080,Math.floor(this.canvas.clientHeight*this.quality*devicePixelRatio));if(w!==this.lastWidth||h!==this.lastHeight){this.canvas.width=w;this.canvas.height=h;gl.viewport(0,0,w,h);this.lastWidth=w;this.lastHeight=h}gl.clearColor(.025,.022,.030,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.prog);const f=[Math.sin(camera.yaw)*Math.cos(camera.pitch),Math.sin(camera.pitch),-Math.cos(camera.yaw)*Math.cos(camera.pitch)],eye=[camera.x,camera.y,camera.z],at=eye.map((v,i)=>v+f[i]);gl.uniformMatrix4fv(this.uni.Projection,false,perspective(Math.PI/2.5,w/h,.08,92));gl.uniformMatrix4fv(this.uni.View,false,lookAt(eye,at));gl.uniform3fv(this.uni.Eye,eye);gl.uniform3fv(this.uni.Forward,f);gl.uniform3fv(this.uni.Lamp1,opts.lamp1||[-20,3,5]);gl.uniform3fv(this.uni.Lamp2,opts.lamp2||[20,2,-10]);gl.uniform1f(this.uni.Light,opts.flashlight?2.6:0);gl.uniform1f(this.uni.Time,t);gl.uniform1f(this.uni.Scare,opts.scare||0);gl.bindVertexArray(this.static.vao);gl.drawArrays(gl.TRIANGLES,0,this.static.count);this.upload(this.dynamic,dynamic,gl.DYNAMIC_DRAW);gl.bindVertexArray(this.dynamic.vao);gl.drawArrays(gl.TRIANGLES,0,this.dynamic.count);gl.bindVertexArray(null)}
}
