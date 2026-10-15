// The watch on deck.
//
// Nothing in this file is evidence about *this* ship, and it says so: every row is
// graded RECONSTRUCTED or FICTIONAL. What it is evidence about is people — the height of
// a British seaman in the 1790s is a well-recorded number, and it is the number that
// decides whether the ship reads at her real size. A ship with no one on her has no
// scale at all: she could be forty metres long or four, and the eye has nothing to
// measure her against. That is most of why a model looks like a model.
//
// Where they stand is the other half. In a gale, running before it, the watch is not
// spread evenly about the deck: it is at the wheel, at the con, at the lee braces, and
// otherwise under the weather rail keeping out of the water. Putting figures where the
// work is says more than putting more of them.
import { ft, m, n } from '../units.js';

// Muster rolls and the surviving measurements of seamen's slop clothing put the average
// seaman of the 1790s at about five feet six; officers, better fed from childhood, ran
// two or three inches taller.
const R = 'RECONSTRUCTED §9';

export const CREW_SPEC = {
  crew_figure_height: m(ft(5, 6), `${R} the average height of a British seaman in the 1790s, from the surviving Marine and Navy muster descriptions. This is the number that gives the ship her scale`),
  crew_officer_height: m(ft(5, 9), `${R} officers ran two to three inches taller than the people, being better fed as children`, { noAudit: true }),
  crew_shoulder_breadth: m(ft(1, 5), `${R} across the shoulders of a working man in a jacket`, { noAudit: true }),
  crew_hip_breadth: m(ft(1, 1), `${R} across the hips`, { noAudit: true }),
  crew_depth: m(ft(0, 10), `${R} front to back through the chest, in slops`, { noAudit: true }),
  crew_head_height: m(ft(0, 9.5), `${R} crown to chin, about an eighth of the whole figure`, { noAudit: true }),
  crew_head_breadth: m(ft(0, 6.5), `${R} across the skull, and a little more with a tarpaulin hat on it`, { noAudit: true }),
  crew_leg_fraction: n(0.47, `${R} the ground to the fork is a little under half the whole height, which is what makes a figure read as a man and not as a doll`, { noAudit: true }),
  crew_arm_fraction: n(0.44, `${R} shoulder to fingertip as a fraction of height`, { noAudit: true }),
  crew_arm_thickness: m(ft(0, 4.5), `${R} through a sleeve`, { noAudit: true }),
  crew_leg_thickness: m(ft(0, 5.5), `${R} through a trouser leg`, { noAudit: true }),
  crew_stance: m(ft(1, 2), `${R} how wide a man stands with the deck moving under him. It is wider than a man stands ashore, and it is one of the few things about a figure that reads at any distance`, { noAudit: true }),

  // Where the watch is. Everything is given as a distance from the stem along the
  // gundeck, the way the research files give a position, or as an offset from a fitting
  // that already has a row of its own.
  crew_helm_abaft_wheel: m(ft(1, 6), `${R} a helmsman stands close abaft the wheel with the spokes at arm's length`, { noAudit: true }),
  crew_helm_spread: m(ft(3, 6), `${R} the two men of a double wheel stand one at each wheel, which is what the second wheel is for`, { noAudit: true }),
  crew_con_abaft_binnacle: m(ft(2, 0), `${R} the officer of the watch cons her from beside the binnacle, where he can see the compass and the weather leech together`, { noAudit: true }),
  crew_lookout_from_stem: m(ft(20, 0), `${R} the forecastle lookout, well forward and at the weather rail`, { noAudit: true }),
  crew_waist_from_stem: m(ft(70, 0), `${R} the hands at the chain pumps, which are immediately either side of the mainmast`, { noAudit: true }),
  crew_brace_from_stem: m(ft(95, 0), `${R} the after braces are belayed abaft the mizzen, and in a gale there are hands standing by them`, { noAudit: true }),
  crew_taffrail_from_stem: m(ft(122, 0), `${R} an officer aft at the taffrail, watching the following sea, which is the whole business of running before a gale`, { noAudit: true }),
  crew_rail_inset: n(0.62, `${R} how far out toward the ship's side a man stands, as a fraction of the half-breadth at his station. He stands by the rail, not on the centreline`, { noAudit: true }),
  crew_top_inset: n(0.55, `${R} how far out on the top platform a man stands, as a fraction of its half-breadth`, { noAudit: true }),

  // What each man is wearing, and how he is built. A ship's company is not a set of
  // identical figures: an officer's coat has tails and a seaman's jacket has none, which
  // is the difference the eye reads first and at the greatest distance.
  crew_coat_tail_drop: n(0.34, `${R} how far an officer's coat tails hang below his waist, as a fraction of his leg. The tailed coat is the officer silhouette — take it away and he is a seaman in better cloth`, { noAudit: true }),
  crew_jacket_drop: n(0.10, `${R} a seaman's jacket ends just below the hip and no lower. It is cut short so that it does not foul him when he goes aloft`, { noAudit: true }),
  crew_hat_brim: m(ft(0, 4.5), `${R} the brim of a round hat, beyond the crown all round. It is the widest thing about a man's head and the part that survives being three hundred pixels away`, { noAudit: true }),
  crew_hat_crown: m(ft(0, 3.5), `${R} the crown of a low round hat, tarred against the weather`, { noAudit: true }),
  crew_cocked_hat_span: m(ft(1, 3), `${R} across a cocked hat from point to point. Worn athwartships by an officer of this date, it is a wider mark than his shoulders and it is how he is known at a distance`, { noAudit: true }),
  crew_neck_height: m(ft(0, 2.5), `${R} the neck, which is small and matters: without one the head sits on the shoulders like a ball on a wall`, { noAudit: true }),
  crew_hand_length: m(ft(0, 7), `${R} the hand at the end of the sleeve. Bare skin at the end of a dark arm is what says the arm is an arm`, { noAudit: true }),
  crew_queue_length: m(ft(0, 7), `${R} the tarred pigtail every seaman of this date wore down his back, and one of the few silhouette details that is unmistakably of the period rather than of any century`, { noAudit: true }),
  crew_build_variation: n(0.05, `${R} how much the height and breadth of a figure vary from man to man, as a fraction. Small — but thirteen men of exactly one height read as thirteen prints of one man, which is worse than any of them looking wrong`, { noAudit: true }),

  // The joints. A figure with straight limbs can only ever be a mannequin: what says
  // "a man" at any distance is that his arm bends at the elbow and his leg at the knee,
  // even when the bend is a few degrees. It costs one more box per limb.
  crew_upper_arm_fraction: n(0.46, `${R} shoulder to elbow as a fraction of the whole arm; the forearm and hand make up the rest`, { noAudit: true }),
  crew_elbow_deg: n(24, `${R} how far the forearm is carried in from the line of the upper arm when a man is simply standing. Nobody stands with a straight arm`, { noAudit: true }),
  crew_elbow_helm_deg: n(52, `${R} at the wheel his elbows are well bent, because the spokes are close in front of him`, { noAudit: true }),
  crew_elbow_haul_deg: n(64, `${R} hauling, his hands come in toward his chest`, { noAudit: true }),
  crew_thigh_fraction: n(0.52, `${R} hip to knee as a fraction of the leg`, { noAudit: true }),
  crew_knee_deg: n(11, `${R} knees soft against the roll. A man on a moving deck never locks them, and it is the difference between a figure standing on the deck and one balanced on it`, { noAudit: true }),
  crew_head_taper: n(0.72, `${R} how much narrower the head is at the crown than at the jaw, which is what stops it reading as a cube`, { noAudit: true }),

  // The poses. A figure with no elbows can only say what it is doing with the angle of
  // its shoulders, and the range is narrow: a straight arm raised much above seventy
  // degrees stops reading as an arm and starts reading as a semaphore.
  crew_arm_rest_deg: n(8, `${R} arms hanging, a little forward of the body, which is where a man's arms are when he is not using them`, { noAudit: true }),
  crew_arm_rest_splay_deg: n(7, `${R} and a little out from his sides, over his hips`, { noAudit: true }),
  crew_arm_helm_deg: n(-62, `${R} forward and down onto the spokes of the wheel, which stands about chest high`, { noAudit: true }),
  crew_arm_helm_splay_deg: n(10, `${R} his hands are the width of the wheel apart`, { noAudit: true }),
  crew_arm_reach_deg: n(-58, `${R} one hand out to a shroud or a rail, which is what every man on a wet deck has hold of`, { noAudit: true }),
  crew_arm_reach_splay_deg: n(34, `${R} and out to the side, because what he is holding is beside him`, { noAudit: true }),
  crew_arm_haul_deg: n(-74, `${R} hauling on a fall: both arms forward, hands together`, { noAudit: true }),
  crew_arm_haul_splay_deg: n(15, `${R} hands a little apart on the rope, one above the other`, { noAudit: true }),
  crew_haul_lean_deg: n(9, `${R} a man hauling puts his weight back against the rope. It is the lean and not the arms that says what he is doing`, { noAudit: true }),

  crew_count: n(13, `${R} the watch on deck of a frigate with a company of about two hundred, in weather that has driven everyone else below: two at the wheel, two officers, seven of the watch and two in the main top`),
  crew_lean_deg: n(6, `${R} a man standing on a deck heeled and moving stands out of the vertical, braced against it. Figures standing bolt upright on a ship that is not upright are one of the plainest tells in a rendered scene`, { noAudit: true }),
};
