import * as T from 'three';

// Shared by rendered cloth, its shadow and CPU attachment/raycast queries.
// Courses are sheeted to the hull; upper sails are sheeted to the next yard.
export const SHEETING_GLSL = `
  uniform float uSheetEnabled;
  uniform vec3 uSheetRestFoot;
  uniform vec3 uSheetFoot;
  uniform float uSheetTurn;
  vec3 sheetPosition(vec3 p) {
    if(uSheetEnabled < .5) return p;
    float t=clamp((p.y+.12)/(uSheetRestFoot.y+.12),0.0,1.0);
    float a=uSheetTurn*t,c=cos(a),s=sin(a);
    vec2 q=p.xz-uSheetRestFoot.xz*t;
    return vec3(c*q.x+s*q.y+uSheetFoot.x*t,
      p.y+(uSheetFoot.y-uSheetRestFoot.y)*t,-s*q.x+c*q.y+uSheetFoot.z*t);
  }
  vec3 sheetNormal(vec3 p,vec3 n) {
    if(uSheetEnabled < .5) return n;
    float raw=(p.y+.12)/(uSheetRestFoot.y+.12),t=clamp(raw,0.0,1.0);
    float a=uSheetTurn*t,c=cos(a),s=sin(a);
    vec2 q=p.xz-uSheetRestFoot.xz*t;
    float d=raw>0.0&&raw<1.0?1.0/(uSheetRestFoot.y+.12):0.0;
    float dx=(-uSheetRestFoot.x*c-uSheetRestFoot.z*s+uSheetFoot.x+uSheetTurn*(-s*q.x+c*q.y))*d;
    float dz=(uSheetRestFoot.x*s-uSheetRestFoot.z*c+uSheetFoot.z+uSheetTurn*(-c*q.x-s*q.y))*d;
    float dy=1.0+(uSheetFoot.y-uSheetRestFoot.y)*d;
    vec3 r=vec3(c*n.x+s*n.z,0.0,-s*n.x+c*n.z);
    r.y=(n.y-dx*r.x-dz*r.z)/dy;return normalize(r);
  }
`;

export function sheetPosition(p,rest,foot,turn) {
  const t=T.MathUtils.clamp((p.y+.12)/(rest.y+.12),0,1),a=turn*t,c=Math.cos(a),s=Math.sin(a);
  const x=p.x-rest.x*t,z=p.z-rest.z*t;
  return p.set(c*x+s*z+foot.x*t,p.y+(foot.y-rest.y)*t,-s*x+c*z+foot.z*t);
}

export function createSailSheeting(ship) {
  const entries=[];
  ship.traverse(mesh=>{
    const frame=mesh.geometry?.userData.sheetFrame;if(!frame)return;
    const head=mesh.parent,foot=frame.foot?ship.getObjectByName(frame.foot):null;
    const rest=new T.Vector3().fromArray(frame.footCentre).sub(new T.Vector3().fromArray(frame.headCentre))
      .applyAxisAngle(new T.Vector3(0,1,0),-frame.brace);
    const uniforms={uSheetEnabled:{value:1},uSheetRestFoot:{value:rest},uSheetFoot:{value:rest.clone()},uSheetTurn:{value:0}};
    mesh.userData.sheeting=uniforms;
    const getVertex=mesh.getVertexPosition;
    mesh.getVertexPosition=function(i,out){getVertex.call(this,i,out);return sheetPosition(out,rest,uniforms.uSheetFoot.value,uniforms.uSheetTurn.value);};
    // Bounds must include the sweep of the foot and the gathered handling poses.
    const g=mesh.geometry;g.computeBoundingBox();g.computeBoundingSphere();
    const margin=(g.userData.handling?.headWidth??12)*.5+rest.length()*.2;
    g.boundingBox.expandByScalar(margin);g.boundingSphere.radius+=margin;
    entries.push({mesh,head,foot,frame,uniforms,getVertex});
  });
  const inverse=new T.Matrix4();
  function update() {
    for(const {head,foot,frame,uniforms:u} of entries) {
      head.updateMatrix();inverse.copy(head.matrix).invert();
      u.uSheetFoot.value.fromArray(frame.footCentre);
      if(foot){u.uSheetFoot.value.copy(foot.position);u.uSheetFoot.value.y+=.15;}
      u.uSheetFoot.value.applyMatrix4(inverse);
      u.uSheetTurn.value=(foot?.rotation.y??0)-head.rotation.y;
    }
  }
  update();
  return {update,entries,dispose(){for(const e of entries){e.mesh.getVertexPosition=e.getVertex;delete e.mesh.userData.sheeting;}}};
}
