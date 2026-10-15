// Construction is supported by Falconer (1769), PORTS, and Steel (1794), p.233.
// These small fitting dimensions are reconstructions, not measured Surprise records.
const source = 'RECONSTRUCTED §09 docs/research/09-gunport-fittings.md; fitting size inferred for the existing 9-pounder opening';
const n = value => ({ value, source, noAudit: true });
export const PORT_SPEC = {
  gunport_lid_board_count: n(4),
  gunport_lid_seam_width: n(0.0016),
  gunport_lid_edge_radius: n(0.0025),
  gunport_lid_inner_fraction: n(0.35),
  gunport_hinge_strap_width: n(0.045),
  gunport_hinge_strap_thickness: n(0.006),
  gunport_hinge_strap_length: n(0.56),
  gunport_hinge_fixed_height: n(0.12),
  gunport_hinge_barrel_diameter: n(0.03),
  gunport_hinge_barrel_length: n(0.075),
  gunport_hinge_bolt_diameter: n(0.02),
  gunport_hinge_bolt_height: n(0.006),
  gunport_hinge_spacing_fraction: n(0.60),
  gunport_lift_ring_diameter: n(0.066),
  gunport_lift_ring_iron: n(0.008),
  gunport_lift_rope_diameter: n(0.014),
  gunport_lift_entry_above_head: n(0.34),
  gunport_lift_ring_from_bottom: n(0.12),
  gunport_lid_open_degrees: n(110),
};
