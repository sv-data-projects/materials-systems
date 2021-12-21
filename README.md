# about these materials systems visualisations

This project explores a narrative-based interactive visual describing material flow systems. It is being  managed by Florian van den Corput @ SV over Dec-21 to Jan 22

- Initial protoyping is based on a 1-2 materials (to be orgranised into folders by material name and eventurally navigated to from a content page:
  - The prototype output is focused on creating 'web presentation' format  (i.e. limited support outside of desktop screen, for now). The intention of prototyping a handful of materials is for 'testing' with audiences
  - Preparing for future work: as there may be around 10 other materials to add in the future, a system/template for schematic design and a suitable 'workflow' for producing a 'family' of 

- General approach is to:
  - use/import an SVG diagram where components have been (html) id tagged (manually)
  - use data tables to referecing each ids (i.e. one table for nodes,  and one for flows) to attach meta-data (e.g. descriptions, and class names for use in specificy elements and element groupings for adding interactivty) 
  - use JavaScript to attach interactivity 
  - Add narrative based 'scenes' will also be constructed to be able to support story-telling about a system. A separate data table for specifying scene settings and narrative will be included as a separate (input) data table
