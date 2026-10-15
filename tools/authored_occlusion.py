"""Short-range geometric occlusion, baked once into glTF vertex colours.

Each asset gets its own BVH. No sky, other template or fixed light is baked in.
Moving joints use a short radius so their shading does not contain a standing pose.
"""
import math
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def bake_contact_shadows(root, distance=.055, strength=.55, rays=16):
    bpy.context.view_layer.update()
    children=[]
    def visit(o):
        if o.type=='MESH': children.append(o)
        for c in o.children: visit(c)
    visit(root)
    vertices=[];faces=[]
    origin=root.matrix_world.inverted()
    for obj in children:
        matrix=origin@obj.matrix_world
        offset=len(vertices)
        vertices.extend(matrix@v.co for v in obj.data.vertices)
        faces.extend(tuple(offset+i for i in p.vertices) for p in obj.data.polygons)
    tree=BVHTree.FromPolygons(vertices,faces,all_triangles=False,epsilon=.00001)
    golden=math.pi*(3-math.sqrt(5))
    samples=[]
    for i in range(rays):
        z=math.sqrt((i+.5)/rays);r=math.sqrt(1-z*z);a=i*golden
        samples.append((r*math.cos(a),r*math.sin(a),z))
    cached={};values=[]
    for obj in children:
        matrix=origin@obj.matrix_world
        normal_matrix=matrix.to_3x3().inverted().transposed()
        colours=[]
        for vertex in obj.data.vertices:
            p=matrix@vertex.co
            n=(normal_matrix@vertex.normal).normalized()
            key=tuple(round(v,4) for v in (*p,*n))
            ao=cached.get(key)
            if ao is None:
                axis=Vector((0,0,1)) if abs(n.z)<.9 else Vector((1,0,0))
                tangent=n.cross(axis).normalized();bitangent=n.cross(tangent)
                blocked=0
                for x,y,z in samples:
                    direction=tangent*x+bitangent*y+n*z
                    hit=tree.ray_cast(p+n*.0007,direction,distance)
                    if hit[0] is not None:
                        blocked+=(1-hit[3]/distance)**.65
                ao=max(.40,1-strength*blocked/rays)
                cached[key]=ao
            colours.extend((ao,ao,ao,1));values.append(ao)
        attr=obj.data.color_attributes.new(name='Contact occlusion',type='FLOAT_COLOR',domain='POINT')
        attr.data.foreach_set('color',colours)
        obj.data.color_attributes.active_color=attr
    root['contactOcclusion']={'radiusMetres':distance,'rays':rays,'minimum':min(values),'maximum':max(values)}
    print(root.name,'contact occlusion',len(cached),'samples',round(min(values),3),round(max(values),3))

def connect_vertex_colours():
    # A texture multiplied by a vertex colour is a core glTF operation. Reusing
    # one node graph per material keeps draw calls and the browser shader simple.
    for mat in bpy.data.materials:
        if not mat.use_nodes: continue
        nodes,links=mat.node_tree.nodes,mat.node_tree.links
        bs=nodes.get('Principled BSDF')
        if not bs or not bs.inputs['Base Color'].is_linked: continue
        previous=bs.inputs['Base Color'].links[0].from_socket
        vertex=nodes.new('ShaderNodeVertexColor');vertex.layer_name='Contact occlusion'
        mix=nodes.new('ShaderNodeMix');mix.data_type='RGBA';mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1
        links.new(previous,mix.inputs[6]);links.new(vertex.outputs['Color'],mix.inputs[7])
        links.new(mix.outputs[2],bs.inputs['Base Color'])
