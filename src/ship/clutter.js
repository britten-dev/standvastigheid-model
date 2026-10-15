// What lies about a working deck.
//
// A deck built to its drawings is bare: guns, hatches, boats and rigging, and nothing
// between them, which is exactly how a model on a bench looks and not at all how a 74 a
// few months out of port looks. This puts back the few things every ship carried in the
// open: the scuttlebutt the watch drank from, casks lashed down in the waist, a hen coop
// each side of the forecastle, the fire buckets in their rack at the break of the
// quarterdeck, shot garlands along the main hatchway, and the falls of the running rigging
// coiled down by the masts.
//
// The objects are the photographed ones from src/ship/prop-assets.js. Where they are not
// loaded, or the level of detail does not want them, there is no clutter and the deck is
// as clean as it always was, and that includes game and distant: the clutter is about
// thirty thousand triangles and those levels have none to spare. Hero and cinematic have
// it. Nothing here moves; it all gets wet with the deck (src/ship/motion.js).
//
// Where each piece lies is in the spec (src/spec/parts/clutter.js), as a distance from a
// break of a deck or a mast. Its height comes from the surface of the deck it stands on, as
// decks.js builds it, so it cannot float above the planking or sink into it.
import * as THREE from 'three';
import { SPEC, OFFSETS } from '../spec/spec.js';
import { deg } from '../util/math.js';
import { propModel } from './prop-assets.js';
import { deckSurfaceAt } from './decks.js';

const S = (k) => SPEC[k].value;

export function buildClutter(cfg, mats, model, ctx) {
  const group = new THREE.Group();
  group.name = 'clutter';
  if (cfg.boats === 'block' || cfg.textureSize < 1024 || !propModel('rope_coil', cfg)) return group;

  const surface = {
    upper: deckSurfaceAt(model, cfg, 'upper'),
    quarterdeck: deckSurfaceAt(model, cfg, 'quarterdeck'),
    forecastle: deckSurfaceAt(model, cfg, 'forecastle'),
  };
  // Where a piece is measured from, by the name its spec row ends in. `abaft` and
  // `forward_of` are distances from a break of a deck or a mast; `between_upper_ports` is
  // the index of an upper-battery port, and the piece lies half way to the next one, so
  // that nothing stands in a gun's recoil.
  const upperPorts = OFFSETS.ports.upper.map((p) => p.z).sort((a, b) => a - b);
  const zAt = {
    abaft_forecastle_break: (v) => ctx.zFcBreak + v,
    forward_of_forecastle_break: (v) => ctx.zFcBreak - v,
    abaft_quarterdeck_break: (v) => ctx.zQdBreak + v,
    abaft_mainmast: (v) => S('furniture_mainmast_z') + v,
    abaft_mizzenmast: (v) => S('furniture_mizzenmast_z') + v,
    between_upper_ports: (i) => (upperPorts[i] + upperPorts[i + 1]) / 2,
  };

  /**
   * Put one piece on `deck`. `piece` is the spec's name for it and `prop` the model; the
   * rows `clutter_<piece>_<side>_<from>`, `_off_centre` and `_yaw_deg` say where.
   */
  const place = (piece, prop, deck, side, from) => {
    const mesh = propModel(prop, cfg);
    if (!mesh) return;
    const row = (tail) => S(`clutter_${piece}_${side}_${tail}`);
    const z = zAt[from](row(from));
    const x = (side === 'port' ? -1 : 1) * row('off_centre');
    mesh.position.set(x, surface[deck].heightAt(x, z), z);
    mesh.rotation.y = deg(row('yaw_deg'));
    mesh.name = `clutter_${piece}_${side}`;
    group.add(mesh);
  };

  // ------------------------------------------------------------------- the waist
  place('scuttlebutt', 'scuttlebutt', 'upper', 'starboard', 'abaft_forecastle_break');
  place('lashed_casks', 'lashed_casks', 'upper', 'port', 'abaft_forecastle_break');
  place('shot_garland', 'shot_garland', 'upper', 'starboard', 'between_upper_ports');
  place('shot_garland', 'shot_garland', 'upper', 'port', 'between_upper_ports');

  // ----------------------------------------------------------- the quarterdeck
  place('fire_buckets', 'fire_buckets', 'quarterdeck', 'port', 'abaft_quarterdeck_break');
  place('rope_coil_main', 'rope_coil', 'quarterdeck', 'starboard', 'abaft_mainmast');
  place('rope_coil_brace', 'rope_coil', 'quarterdeck', 'starboard', 'abaft_mainmast');
  place('rope_coil_mizzen', 'rope_coil', 'quarterdeck', 'port', 'abaft_mizzenmast');

  // ------------------------------------------------------------- the forecastle
  place('hen_coop', 'hen_coop', 'forecastle', 'starboard', 'forward_of_forecastle_break');
  place('hen_coop', 'hen_coop', 'forecastle', 'port', 'forward_of_forecastle_break');
  place('rope_coil_fore', 'rope_coil', 'forecastle', 'starboard', 'forward_of_forecastle_break');

  group.userData.count = group.children.length;
  return group;
}
