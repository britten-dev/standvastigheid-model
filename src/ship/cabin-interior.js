// A shallow, enclosed reconstruction behind the stern lights. Furniture and
// panelling are artistic interpretation, not a surveyed Surprise cabin plan.
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from '../util/loft.js';
import {detailChoice} from './detail-lod.js';

export function furnishCabin(cabin,c,cfg,mats) {
 const fine=cfg.windowJoinery, wood=[],paint=[],brass=[],paper=[],dark=[],floor=[];
 const box=(bucket,w,h,d,x,y,z,r=.002)=>{
  const g=fine&&r>0?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w*.15,h*.15,d*.15)):new T.BoxGeometry(w,h,d);
  g.translate(x,y,z);bucket.push(g);return g;
 };
 const panel=mats.timber.clone();panel.name='cabin_green_panelling';panel.color.set(0x46514a);
 panel.emissive.set(0x806644);panel.emissiveIntensity=.055;panel.roughness=.88;
 const oak=mats.timber.clone();oak.name='cabin_warm_oak';oak.color.set(0x71604b);
 oak.emissive.set(0x624427);oak.emissiveIntensity=.055;
 const pale=new T.MeshStandardMaterial({color:0xb9b1a0,roughness:.96,emissive:0x645038,emissiveIntensity:.10});
 const deck=mats.deck.clone();deck.name='cabin_floorboards';deck.color.set(0x786650);deck.roughness=.85;
 const black=mats.black.clone();black.color.set(0x171b18);
 for(const m of [panel,oak,deck,black])m.userData.bakedOcclusion=true;
 const add=(bucket,mat,name)=>{if(!bucket.length)return;const mesh=new T.Mesh(mergeGeometries(bucket),mat);mesh.name=name;cabin.add(mesh);return mesh;};
 const depth=c.rear-c.front, pitch=.48, count=Math.ceil(c.width/pitch);
 // Recessed panels, separate rails and stiles, with modest real bevels.
 for(let i=0;i<count;i++) {
  const x=-c.width/2+(i+.5)*c.width/count,w=c.width/count;
  box(paint,w-.034,c.height-.22,.035,x,c.floor+c.height*.5,c.front+.025);
  box(wood,.026,c.height-.06,.065,x-w*.5,c.floor+c.height*.5,c.front+.045);
 }
 for(const h of [.12,.68,c.height-.09])box(wood,c.width,.036,.074,0,c.floor+h,c.front+.05);
 // Enclose the existing rudder stock, which passes through this space, in
 // dark timber. Keep its real clearance rather than deleting steering gear
 // simply because the newly opened windows expose it.
 box(paint,.39,c.height,1.44,0,c.floor+c.height/2,c.rear-.86,.006);
 for(const x of [-.205,.205])box(wood,.024,c.height,.028,x,c.floor+c.height/2,c.rear-.125,.003);
 // Low cupboards along the sides give foreground occlusion and depth through
 // the outer lights; they also stop the room reading as a bare photograph box.
 for(const side of [-1,1]) {
  box(paint,.45,.55,depth*.65,side*(c.width/2-.26),c.floor+.28,c.front+depth*.52,.009);
  box(wood,.49,.026,depth*.68,side*(c.width/2-.26),c.floor+.57,c.front+depth*.52,.005);
  for(let j=0;j<3;j++) {
   const z=c.front+depth*(.26+j*.19);
   box(wood,.021,.36,.022,side*(c.width/2-.495),c.floor+.30,z);
   const knob=new T.SphereGeometry(.014,fine?10:5,fine?6:3);
   knob.translate(side*(c.width/2-.51),c.floor+.38,z+.12);brass.push(knob);
  }
 }
 // Floorboards run fore-and-aft. Thin seams and a dark backing, no gaps to sea.
 const n=Math.ceil(c.width/.19);
 for(let i=0;i<n;i++)box(floor,c.width/n-.002,.018,depth, -c.width/2+(i+.5)*c.width/n,c.floor+.011,(c.front+c.rear)/2,0);
 // Deck beams and ledges interrupt the light above the occupants.
 for(let i=0;i<4;i++)box(wood,c.width,.072,.11,0,c.ceiling-.043,c.front+.22+i*(depth-.44)/3,.006);
 // A small central music desk, projecting in front of the photographic figures.
 const z=c.rear-1.10,musicX=.31;
 box(wood,.035,.69,.035,musicX,c.floor+.36,z);
 box(wood,.27,.025,.23,musicX,c.floor+.026,z,.004);
 const desk=box(wood,.30,.26,.023,0,0,0,.004);desk.rotateX(-.21);desk.translate(musicX,c.floor+.79,z);
 box(wood,.32,.017,.046,musicX,c.floor+.662,z+.034,.002);
 // Engraved score strokes are drawn as fine geometry only for close inspection.
 if(fine){
  const sheets=box(paper,.27,.22,.0018,0,0,0,0);sheets.rotateX(-.21);sheets.translate(musicX,c.floor+.80,z+.018);
  for(let side of [-1,1])for(let staff=0;staff<3;staff++)for(let line=0;line<5;line++){
   const yy=c.floor+.735+staff*.06+line*.005;
   box(dark,.109,.00065,.002,musicX+side*.068,yy,z+.032-(yy-c.floor-.80)*.21,0);
  }
 }
 add(paint,panel,'cabin_recessed_panels');add(wood,oak,'cabin_joinery');
 add(floor,deck,'cabin_laid_floor');add(brass,mats.brass,'cabin_cupboard_fittings');
 const music=add(paper,pale,'cabin_music_sheets');const ink=add(dark,black,'cabin_music_engraving');
 if(ink&&cfg.adaptiveDetail)detailChoice(ink,.003);
 // A hooded lamp on the forward bulkhead. Its warm pool is baked into the room's
 // own finish: no point light leaking through the hull or flickering on the sea.
 const lamp=new T.Group();lamp.name='cabin_oil_lantern';lamp.position.set(-.82,c.floor+.98,c.front+.17);
 const warm=new T.MeshStandardMaterial({color:0x9d703c,emissive:0xffbc64,emissiveIntensity:1,roughness:.5});
 const glass=new T.Mesh(new T.CylinderGeometry(.043,.043,.14,fine?12:6),warm);glass.name='cabin_lamp_glow';lamp.add(glass);
 for(const y of [-.09,.09]){const cap=new T.Mesh(new T.CylinderGeometry(.065,.056,.027,fine?12:6),mats.brass);cap.position.y=y;lamp.add(cap);}
 for(let i=0;i<4;i++){const a=i*Math.PI/2,o=new T.Mesh(new T.CylinderGeometry(.004,.004,.18,4),mats.brass);o.position.set(Math.cos(a)*.048,0,Math.sin(a)*.048);lamp.add(o);}
 cabin.add(lamp);
 // Store only numeric lighting defaults in the public model metadata.
 for(const m of [panel,oak,pale,warm])m.userData.cabinEmission=m.emissiveIntensity;
 return {music};
}
