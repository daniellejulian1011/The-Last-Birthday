"""Generate self-contained glTF 2.0 skinned GLB character prototypes with animation clips.
Run: python tools/build_rigged_models.py
These are game-ready *rigged prototype* assets, not scanned high-poly production likenesses.
"""
from pathlib import Path
import math, json, struct, numpy as np
import trimesh

OUT=Path(__file__).resolve().parents[1]/'assets'/'models'
OUT.mkdir(exist_ok=True,parents=True)

def rgba(rgb):
 c=rgb.lstrip('#');return [int(c[i:i+2],16)/255 for i in (0,2,4)]+[1]

def skeleton(character):
 if 'morrow' in character:
  bones=[('Root',None,(0,0,0)),('Hips','Root',(0,.70,0)),('Spine','Hips',(0,.49,0)),('Chest','Spine',(0,.34,0)),('Neck','Chest',(0,.23,0)),('Head','Neck',(0,.31,0)),('Jaw','Head',(0,-.18,-.22)),('Ear.L','Head',(-.24,.32,0)),('Ear.R','Head',(.24,.32,0)),('UpperArm.L','Chest',(-.34,.13,0)),('Forearm.L','UpperArm.L',(-.07,-.36,0)),('Hand.L','Forearm.L',(-.02,-.31,0)),('UpperArm.R','Chest',(.34,.13,0)),('Forearm.R','UpperArm.R',(.07,-.36,0)),('Hand.R','Forearm.R',(.02,-.31,0)),('Thigh.L','Hips',(-.22,-.12,0)),('Shin.L','Thigh.L',(0,-.36,0)),('Foot.L','Shin.L',(0,-.34,-.11)),('Thigh.R','Hips',(.22,-.12,0)),('Shin.R','Thigh.R',(0,-.36,0)),('Foot.R','Shin.R',(0,-.34,-.11))]
 else:
  bones=[('Root',None,(0,0,0)),('Hips','Root',(0,.89,0)),('Spine','Hips',(0,.30,0)),('Chest','Spine',(0,.27,0)),('Neck','Chest',(0,.18,0)),('Head','Neck',(0,.18,0)),('Jaw','Head',(0,-.11,-.08)),('UpperArm.L','Chest',(-.27,.05,0)),('Forearm.L','UpperArm.L',(-.04,-.30,0)),('Hand.L','Forearm.L',(0,-.27,0)),('UpperArm.R','Chest',(.27,.05,0)),('Forearm.R','UpperArm.R',(.04,-.30,0)),('Hand.R','Forearm.R',(0,-.27,0)),('Thigh.L','Hips',(-.14,-.11,0)),('Shin.L','Thigh.L',(0,-.35,0)),('Foot.L','Shin.L',(0,-.32,-.06)),('Thigh.R','Hips',(.14,-.11,0)),('Shin.R','Thigh.R',(0,-.35,0)),('Foot.R','Shin.R',(0,-.32,-.06))]
 scale=.67 if 'morrow' in character else .74 if 'june' in character else .80
 bones=[(name,parent,tuple(v*scale for v in local)) for name,parent,local in bones]
 out=[]
 for name,parent,local in bones:
  origin=np.asarray(local,dtype=np.float32)+(next(v['origin'] for v in out if v['name']==parent) if parent else 0)
  out.append(dict(name=name,parent=parent,local=local,origin=origin))
 return out

class GLB:
 def __init__(self,tag):
  self.tag=tag;self.blob=bytearray();self.gltf={'asset':{'version':'2.0','generator':'Berry Vibes Studio - Procedural GLB Rig Builder'},'scene':0,'scenes':[{'nodes':[0,1]}],'nodes':[],'meshes':[{'name':tag,'primitives':[]}],'skins':[],'buffers':[{}],'bufferViews':[],'accessors':[],'materials':[],'animations':[]}
  self.materials={};self.bones=skeleton(tag)
  self.gltf['nodes']=[{'name':'CharacterMesh','mesh':0,'skin':0},{'name':'SkeletonRoot','children':[]}]
  self.ids={name:i+2 for i,(name,_,_) in enumerate((b['name'],b['parent'],b['local']) for b in self.bones)}
  for b in self.bones:
   node={'name':b['name'],'translation':list(b['local'])}
   self.gltf['nodes'].append(node)
  for b in self.bones:
   if b['parent']:self.gltf['nodes'][self.ids[b['parent']]] .setdefault('children',[]).append(self.ids[b['name']])
   else:self.gltf['nodes'][1]['children'].append(self.ids[b['name']])
  matrices=[]
  for b in self.bones:
   m=np.eye(4,dtype=np.float32);m[:3,3]=-b['origin'];matrices.append(m.T.flatten())
  inv=self.accessor(np.vstack(matrices).astype('<f4'),5126,'MAT4',target=None)
  self.gltf['skins'].append({'name':tag+'_skin','inverseBindMatrices':inv,'joints':[self.ids[b['name']] for b in self.bones],'skeleton':self.ids['Root']})
 def accessor(self,arr,component,typ,target=34962):
  arr=np.ascontiguousarray(arr);offset=len(self.blob);self.blob.extend(arr.tobytes());self.blob.extend(b'\x00'*((-len(self.blob))%4));idx=len(self.gltf['bufferViews']);view={'buffer':0,'byteOffset':offset,'byteLength':arr.nbytes};
  if target is not None:view['target']=target
  self.gltf['bufferViews'].append(view)
  n=arr.shape[0]
  a={'bufferView':idx,'componentType':component,'count':n,'type':typ}
  if typ=='VEC3' and arr.dtype.kind=='f':a['min']=arr.min(axis=0).tolist();a['max']=arr.max(axis=0).tolist()
  self.gltf['accessors'].append(a);return len(self.gltf['accessors'])-1
 def material(self,color):
  if color not in self.materials:
   i=len(self.gltf['materials']);self.materials[color]=i;self.gltf['materials'].append({'name':'Paint_'+color,'pbrMetallicRoughness':{'baseColorFactor':rgba(color),'metallicFactor':0.06,'roughnessFactor':.83},'doubleSided':True})
  return self.materials[color]
 def part(self,shape,center,scale,bone,color):
  if shape=='sphere':m=trimesh.creation.icosphere(subdivisions=2)
  elif shape=='box':m=trimesh.creation.box(extents=[1,1,1])
  else:m=trimesh.creation.cylinder(radius=.5,height=1,sections=12)
  vs=np.asarray(m.vertices,dtype=np.float32)*np.asarray(scale,dtype=np.float32)+np.asarray(center,dtype=np.float32)
  faces=np.asarray(m.faces,dtype=np.uint32).reshape(-1)
  norms=np.asarray(m.vertex_normals,dtype=np.float32)
  joint=np.zeros((len(vs),4),dtype='<u2');joint[:,0]=self.bones.index(next(b for b in self.bones if b['name']==bone))
  weights=np.zeros((len(vs),4),dtype='<f4');weights[:,0]=1
  primitive={'attributes':{'POSITION':self.accessor(vs.astype('<f4'),5126,'VEC3'),'NORMAL':self.accessor(norms.astype('<f4'),5126,'VEC3'),'JOINTS_0':self.accessor(joint,5123,'VEC4'),'WEIGHTS_0':self.accessor(weights,5126,'VEC4')},'indices':self.accessor(faces.astype('<u4'),5125,'SCALAR',34963),'material':self.material(color)}
  self.gltf['meshes'][0]['primitives'].append(primitive)
 def animate(self):
  def quat(axis,a):
   h=a/2;c=math.cos(h);q=[0,0,0,c];q[axis]=math.sin(h);return q
  for action,duration in [('Idle',3),('Walk',1.1),('Reach',1.5)]:
   frames=np.array([0,.25,.50,.75,1],dtype='<f4')*duration
   t=self.accessor(frames,5126,'SCALAR',target=None)
   anim={'name':action,'samplers':[],'channels':[]}
   for bone in ['Head','Ear.L','Ear.R','UpperArm.L','UpperArm.R','Thigh.L','Thigh.R']:
    if bone not in self.ids:continue
    rotations=[]
    for k in range(5):
     phase=k/4*math.tau
     if action=='Walk':ang=(.42 if 'Arm' in bone or 'Thigh' in bone else .08)*math.sin(phase)*(1 if '.L' in bone else -1);axis=0
     elif action=='Reach':ang=(-.63 if 'Arm' in bone else .15)*math.sin(phase/2);axis=0
     else:ang=.06*math.sin(phase)*(1 if '.L' in bone else -1);axis=2 if 'Ear' in bone or bone=='Head' else 0
     rotations.append(quat(axis,ang))
    output=self.accessor(np.array(rotations,dtype='<f4'),5126,'VEC4',target=None)
    ix=len(anim['samplers']);anim['samplers'].append({'input':t,'output':output,'interpolation':'LINEAR'});anim['channels'].append({'sampler':ix,'target':{'node':self.ids[bone],'path':'rotation'}})
   self.gltf['animations'].append(anim)
 def write(self):
  self.animate();self.gltf['buffers'][0]['byteLength']=len(self.blob)
  js=json.dumps(self.gltf,separators=(',',':'),ensure_ascii=False).encode('utf-8');js+=b' '*((-len(js))%4);bin_=bytes(self.blob);bin_+=b'\x00'*((-len(bin_))%4)
  content=struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(bin_),b'BIN\x00')+bin_
  file=OUT/(self.tag+'.glb');file.write_bytes(struct.pack('<4sII',b'glTF',2,12+len(content))+content)
  print(file.name,file.stat().st_size,'bytes',len(self.gltf['meshes'][0]['primitives']),'rigged parts',len(self.bones),'bones',len(self.gltf['animations']),'clips')


def morrow(tag,old):
 a=GLB(tag);fur='#dfb5b6' if old else '#79585b';mask='#ded1b0' if old else '#a39582';eye='#1a171c';bow='#7c2935' if old else '#5c2630'
 for shape,pos,size,bone,col in [
 ('sphere',(0,1.26,0),(.85,1.02,.61),'Spine',fur),('sphere',(0,1.34,-.24),(.62,.79,.21),'Spine',mask),('sphere',(0,1.78,0),(.98,.48,.65),'Chest',fur),
 ('sphere',(0,2.08,0),(1.01,.91,.73),'Head',mask),('sphere',(-.24,2.16,-.32),(.30,.38,.15),'Head',eye),('sphere',(.24,2.16,-.32),(.30,.38,.15),'Head',eye),
 ('sphere',(0,1.90,-.45),(.25,.16,.18),'Head','#ab6267'),('sphere',(0,1.75,-.38),(.53,.18,.28),'Jaw','#282026'),
 ('sphere',(-.25,2.65,0),(.33,.74,.33),'Ear.L',fur),('sphere',(.25,2.65,0),(.33,.74,.33),'Ear.R',fur),
 ('sphere',(-.37,1.9,-.2),(.42,.21,.25),'Chest',bow),('sphere',(.37,1.9,-.2),(.42,.21,.25),'Chest',bow),
 ('sphere',(-.47,1.58,0),(.35,.82,.4),'UpperArm.L',fur),('sphere',(.47,1.58,0),(.35,.82,.4),'UpperArm.R',fur),
 ('sphere',(-.54,1.13,0),(.27,.67,.3),'Forearm.L',fur),('sphere',(.54,1.13,0),(.27,.67,.3),'Forearm.R',fur),
 ('sphere',(-.57,.81,-.02),(.26,.34,.25),'Hand.L','#beb4a1'),('sphere',(.57,.81,-.02),(.26,.34,.25),'Hand.R','#beb4a1'),
 ('sphere',(-.22,.65,0),(.39,.68,.4),'Thigh.L',fur),('sphere',(.22,.65,0),(.39,.68,.4),'Thigh.R',fur),
 ('sphere',(-.22,.30,0),(.31,.54,.32),'Shin.L',fur),('sphere',(.22,.30,0),(.31,.54,.32),'Shin.R',fur),
 ('box',(-.22,.06,-.13),(.44,.18,.62),'Foot.L','#514540'),('box',(.22,.06,-.13),(.44,.18,.62),'Foot.R','#514540')]:
  a.part(shape,tuple(v*.67 for v in pos),tuple(v*.67 for v in size),bone,col)
 for i in range(3):a.part('sphere',(0,(1.56-i*.19)*.67,-.36*.67),tuple(v*.67 for v in (.16,.16,.11)),'Spine','#4b3635')
 a.write()

def human(tag,sex,era):
 a=GLB(tag);adult=era==1983;girl=sex=='june';top='#853f40' if girl and adult else '#a79c8a' if girl else '#513937';pants='#4d5968' if girl else '#413b39';skin='#d6a487' if girl else '#b8886a';hair='#312625' if girl else '#3f302b'
 for shape,pos,size,bone,col in [
 ('sphere',(0,1.17,0),(.50,.68,.34),'Spine',top),('sphere',(0,1.46,0),(.65,.38,.42),'Chest',top),('sphere',(0,1.68,0),(.39,.48,.36),'Head',skin),
 ('sphere',(0,1.89,.06),(.46,.36,.44),'Head',hair),('sphere',(-.26,1.50,0),(.26,.53,.27),'UpperArm.L',top),('sphere',(.26,1.50,0),(.26,.53,.27),'UpperArm.R',top),
 ('sphere',(-.32,1.18,0),(.22,.48,.23),'Forearm.L',top),('sphere',(.32,1.18,0),(.22,.48,.23),'Forearm.R',top),
 ('sphere',(-.34,.94,0),(.18,.3,.17),'Hand.L',skin),('sphere',(.34,.94,0),(.18,.3,.17),'Hand.R',skin),
 ('sphere',(-.15,.71,0),(.29,.58,.28),'Thigh.L',pants),('sphere',(.15,.71,0),(.29,.58,.28),'Thigh.R',pants),
 ('sphere',(-.15,.34,0),(.25,.57,.24),'Shin.L',pants),('sphere',(.15,.34,0),(.25,.57,.24),'Shin.R',pants),
 ('box',(-.15,.06,-.10),(.28,.14,.47),'Foot.L','#3c3330'),('box',(.15,.06,-.10),(.28,.14,.47),'Foot.R','#3c3330')]:a.part(shape,tuple(v*(.74 if girl else .80) for v in pos),tuple(v*(.74 if girl else .80) for v in size),bone,col)
 if girl:
  a.part('sphere',(0,1.53*.74,.29*.74),tuple(v*.74 for v in (.18,.50,.31)),'Head',hair)
  a.part('box',(0,1.12*.74,-.30*.74),tuple(v*.74 for v in (.56,.10,.08)),'Spine','#634e39')
 else:
  a.part('box',(0,1.43*.80,-.36*.80),tuple(v*.80 for v in (.09,.34,.08)),'Chest','#8c3037');a.part('box',(0,1.22*.80,-.35*.80),tuple(v*.80 for v in (.34,.42,.13)),'Spine','#662b30')
 a.write()

if __name__=='__main__':
 morrow('mr_morrow_1973',True)
 morrow('mr_morrow_1983',False)
 human('june_mercer_1973','june',1973)
 human('june_mercer_1983','june',1983)
 human('edwin_candlewick_1983','edwin',1983)
