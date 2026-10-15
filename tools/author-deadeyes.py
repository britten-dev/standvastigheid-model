"""Blender-built elm deadeye: rounded shoulders, perimeter score and eased holes.

Normalized radius 1 and thickness 1; the browser fits each copy to its sourced
specification dimensions. Small edge radii and timber wear are reconstruction.
Steel 1794 pp.158,198 describes the form and paired lanyard arrangement.
"""
from pathlib import Path
import sys, math, json
import bpy, bmesh
import numpy as np
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
from authored_occlusion import bake_contact_shadows, connect_vertex_colours
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'

def lathe(name,profile,segments):
    verts=[(r*math.cos(i*math.tau/segments),r*math.sin(i*math.tau/segments),z) for r,z in profile for i in range(segments)]
    faces=[]
    for j in range(len(profile)-1):
        for i in range(segments):
            a=j*segments+i;b=j*segments+(i+1)%segments
            faces.append((a,b,b+segments,a+segments))
    faces.append(tuple(reversed(range(segments))))
    faces.append(tuple((len(profile)-1)*segments+i for i in range(segments)))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj)
    return obj

# Make it flat-faced, with an actual turned score to seat the rope or iron binding.
eye=lathe('authored_deadeye',[(.91,-.5),(1,-.36),(.91,-.10),(.91,.10),(1,.36),(.91,.5)],32)
bpy.context.view_layer.objects.active=eye;eye.select_set(True)
for angle in [math.pi/2,7*math.pi/6,11*math.pi/6]:
    cutter=lathe('hole_tool',[(.21,-.8),(.21,-.50),(.14,-.39),(.14,.39),(.21,.50),(.21,.8)],12)
    cutter.location=(.42*math.cos(angle),.42*math.sin(angle),0)
    mod=eye.modifiers.new('Bored and eased lanyard hole','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
# Keep samples inside the bores, not just at their mouths, for baked cavity shade.
bm=bmesh.new();bm.from_mesh(eye.data)
bore_edges=[e for e in bm.edges if abs(e.verts[0].co.z-e.verts[1].co.z)>.7
    and all(v.co.xy.length<.7 for v in e.verts)]
bmesh.ops.subdivide_edges(bm,edges=bore_edges,cuts=2,use_grid_fill=True)
bm.normal_update();bm.to_mesh(eye.data);bm.free();eye.data.update()
# Flat faces and smooth curved shoulders: no faceted outline or melted wooden faces.
for face in eye.data.polygons: face.use_smooth=abs(face.normal.z)<.98
mesh=eye.data
uv=mesh.uv_layers.new(name='Elm grain')
for poly in mesh.polygons:
    for i in poly.loop_indices:
        v=mesh.vertices[mesh.loops[i].vertex_index].co
        uv.data[i].uv=(v.x*.48+.5,v.y*.48+.5) if abs(poly.normal.z)>.4 else (math.atan2(v.y,v.x)/math.tau+.5,v.z+.5)
# Subtle longitudinal fibres, irregular growth and scuffing; colour carries no lighting.
n=512;y,x=np.mgrid[0:n,0:n].astype(np.float32)/n;rng=np.random.default_rng(1805)
warp=x+.011*np.sin(y*8)+.003*np.sin(y*27)
grain=np.sin(warp*713+np.sin(y*7)*.3)
growth=np.sin(warp*93+np.sin(y*11)*.7)
noise=rng.random((n,n))-.5
tone=.89+.045*growth+.028*grain+.026*noise
rgb=np.stack((.29*tone,.205*tone,.115*tone,np.ones_like(tone)),axis=2)
im=bpy.data.images.new('Worked elm colour',width=n,height=n,alpha=False)
im.pixels.foreach_set(rgb.astype(np.float32).reshape(-1));im.pack()
mat=bpy.data.materials.new('Oiled and weathered elm');mat.use_nodes=True;mat.use_backface_culling=True
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.79
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im
mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
eye.data.materials.clear();eye.data.materials.append(mat)
for poly in eye.data.polygons: poly.material_index=0
# Turn Blender's local disc into browser X/Y faces, Z thickness on glTF export.
eye.rotation_euler.x=math.pi/2
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
bake_contact_shadows(eye,distance=.42,strength=.5,rays=32)
connect_vertex_colours()
eye['source']='Steel 1794 pp.158,198; elm, three bored holes, perimeter score; easing and wear reconstructed'
eye['normalizedRadius']=1.0;eye['normalizedThickness']=1.0
eye['holeCircle']=.42;eye['holeRadius']=.14
# Boolean topology must stay closed before export.
mesh=eye.data
bm=bmesh.new();bm.from_mesh(mesh)
assert all(e.is_manifold for e in bm.edges),'Deadeye is not a closed solid'
bm.free()
mesh.calc_loop_triangles();triangles=len(mesh.loop_triangles)
assert triangles<1600,triangles
OUT=ROOT/'src/assets/rigging-deadeye.glb'
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,
    export_yup=True,export_apply=True,export_extras=True,export_animations=False,
    export_vertex_color='NAME',export_vertex_color_name='Contact occlusion',
    export_materials='EXPORT',export_texcoords=True,export_normals=True)
# Save a separate editable workbench without rebuilding the discarded crew prototype.
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'build/HMS Surprise - Rigging Workshop.blend'))
(ROOT/'build/deadeye-asset.json').write_text(json.dumps({'triangles':triangles,'bytes':OUT.stat().st_size,'blender':bpy.app.version_string},indent=2))
print('DEADEYE',triangles,'triangles;',OUT.stat().st_size,'bytes')
