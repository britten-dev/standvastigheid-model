// Painted, caulked timber: colour and actual relief are deliberately separate.
// Dimensions are a restrained reconstruction, not measured Surprise scantlings.
import {FEATURES,hullModel} from './hull.js';
import {PAINT} from '../spec/spec.js';
const cache=new Map();
const hash=n=>{const x=Math.sin(n*127.13+31.71)*43758.5453;return x-Math.floor(x);};
const grey=v=>`rgb(${v},${v},${v})`;

export function hullTimber(size,kind='colour'){
 const key=`${size}:${kind}`;if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const g=canvas.getContext('2d'),features=hullModel().featureYAt(0);
 const stops=FEATURES.map(([name,v])=>[features[name],v]);
 const yPixel=y=>{let i=0;while(i<stops.length-2&&stops[i+1][0]<y)i++;
  const [a,v]=stops[i],[b,w]=stops[i+1];return (1-(v+(w-v)*Math.max(0,Math.min(1,(y-a)/(b-a)))))*size;};
 const metre=size/PAINT.hull_map_metres.value,height=kind==='height',rough=kind==='roughness';
 g.fillStyle=grey(128);g.fillRect(0,0,size,size);
 // V compresses several parts of the hull differently; derive course locations
 // from the midship feature heights, retaining the sheer on the lofted surface.
 let bottom=features.keel_bottom,row=0;
 while(bottom<features.rail){
  const breadth=.235+hash(row+10)*.075,top=Math.min(features.rail,bottom+breadth);
  const y0=yPixel(top),y1=yPixel(bottom),h=y1-y0;
  const offset=(row*2.41+hash(row+2)*.45)%6.096;
  for(let segment=-2;segment<3;segment++){
   const x=(offset+segment*6.096)*metre,w=6.096*metre;
   const tone=hash(row*19+((segment%2+2)%2)*97);
   g.fillStyle=grey(Math.round(height?128+(tone-.5)*4:rough?125+(tone-.5)*50:133+(tone-.5)*42));
   g.fillRect(x,y0,w,h);
   // Broad, shallow cupping of the plank, with no baked light direction.
   if(height){const cup=g.createLinearGradient(0,y0,0,y1);
    cup.addColorStop(0,'rgba(80,80,80,.16)');cup.addColorStop(.3,'rgba(145,145,145,.12)');
    cup.addColorStop(.7,'rgba(145,145,145,.12)');cup.addColorStop(1,'rgba(80,80,80,.16)');
    g.fillStyle=cup;g.fillRect(x,y0,w,h);}
   g.save();g.beginPath();g.rect(x,y0,w,h);g.clip();
   // Fine grain follows the timber, underneath intact paint. Sparse irregular
   // streaks are colour/finish variation; they cannot become pits in the normal.
   for(let k=0;k<(height?12:42);k++){
    const seed=row*137+k*7+((segment%2+2)%2)*101,t=hash(seed),yy=y0+(k+.5)/(height?12:42)*h;
    g.strokeStyle=height?`rgba(95,95,95,${.025+t*.055})`:rough?'rgba(165,165,165,.15)':`rgba(${t>.5?'71,71,71':'185,185,185'},${.06+t*.12})`;
    g.lineWidth=Math.max(.4,metre*(height?.002:.003));g.beginPath();
    const start=x+w*hash(seed+1)*.18,end=x+w*(.55+hash(seed+3)*.45),bend=(hash(seed+5)-.5)*h*.10;
    g.moveTo(start,yy);g.bezierCurveTo(start+w*.25,yy+bend,end-w*.2,yy-bend,end,yy);g.stroke();
   }
   // Subtle growth-ring deviations and old brush laps interrupt the uniform
   // straight grain. Paint remains intact: these are low-relief fibres, not
   // exposed rotten wood or colour stains converted to bumps.
   for(let knot=0;knot<2;knot++) {
    const cx=x+w*(.2+hash(row*61+knot*23)*.6),cy=y0+h*(.24+hash(row*83+knot)*.50);
    const rx=metre*(.075+hash(row+knot*17)*.09),ry=h*.09;
    for(let ring=1;ring<=5;ring++) {
     g.strokeStyle=height?'rgba(108,108,108,.09)':rough?'rgba(165,165,165,.12)':'rgba(76,73,64,.065)';
     g.lineWidth=Math.max(.45,metre*.001);g.beginPath();
     g.ellipse(cx,cy,rx*(.4+ring*.21),ry*(.4+ring*.23),0,0,Math.PI*2);g.stroke();
    }
   }
   // A restrained worn edge catches a raking light without a bright uniform
   // outline round every plank. Short exposed flecks occur only at some butts.
   if(!height&&!rough && hash(row*31+segment)>.62) {
    g.fillStyle='rgba(179,166,134,.19)';
    for(let nick=0;nick<7;nick++) {
     const yy=y0+h*hash(row*19+nick*11);
     g.fillRect(x+metre*.008,yy,metre*(.008+hash(nick+row)*.026),Math.max(.55,metre*.002));
    }
   }
   // Sparse end checks and flush fastening plugs beneath the painted finish.
   // Dimensions/spacing are reconstructed; contrast stays low enough that the
   // hull cannot acquire a spotted riveted-metal pattern at normal viewing range.
   const framePitch=metre*.6096;
   for (let frame=Math.floor(x/framePitch);frame<=Math.ceil((x+w)/framePitch);frame++) {
    const xx=(frame+.28)*framePitch;
    for (const fraction of [.24,.76]) {
     const yy=y0+h*fraction, r=metre*.011;
     g.fillStyle=grey(height?123:rough?143:126);
     g.beginPath();g.ellipse(xx,yy,r,h*.011/breadth,0,0,Math.PI*2);g.fill();
    }
   }
   if (height || !rough) for(let k=0;k<3;k++) {
    const yy=y0+h*(.18+hash(row*17+k)*.64), len=metre*(.08+hash(row*23+k)*.15);
    g.strokeStyle=height?'rgba(95,95,95,.20)':'rgba(80,75,68,.12)';
    g.lineWidth=Math.max(.5,metre*.0015);g.beginPath();g.moveTo(x+metre*.013,yy);
    g.quadraticCurveTo(x+len*.45,yy+metre*.005,x+len,yy-metre*.002);g.stroke();
   }
   g.restore();
   if(height){
    const bevel=g.createLinearGradient(x,0,x+metre*.014,0);
    bevel.addColorStop(0,'#656565');bevel.addColorStop(.45,'#797979');bevel.addColorStop(1,'rgba(128,128,128,0)');
    g.fillStyle=bevel;g.fillRect(x,y0,metre*.014,h);
   }
   // Caulking, rather than open black slots. Bevel slopes live in the height
   // field; the colour seam is thinner and remains subdued under paint.
   g.fillStyle=grey(height?66:rough?185:85);
   g.fillRect(x,y0,Math.max(.65,metre*.006),h);
   if(!height&&!rough){
    // Occasional paint abrasion beside a butt, never regularly spaced dots.
    for(let k=0;k<5;k++){const yy=y0+hash(row*29+k)*h;
     g.fillStyle='rgba(177,164,136,.12)';g.fillRect(x+metre*.01,yy,metre*(.012+hash(k+row)*.055),Math.max(.5,metre*.002));}
   }
  }
  if(height){
   const eased=g.createLinearGradient(0,y0,0,y0+h*.07);
   eased.addColorStop(0,'#626262');eased.addColorStop(.4,'#797979');eased.addColorStop(1,'rgba(128,128,128,0)');
   g.fillStyle=eased;g.fillRect(0,y0,size,h*.07);
  }
  g.fillStyle=grey(height?66:rough?185:80);
  g.fillRect(0,y0,size,Math.max(.7,metre*.005));
  bottom=top;row++;
 }
 cache.set(key,canvas);return canvas;
}
