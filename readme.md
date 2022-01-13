# Materials systems visualisations
## TL;DR
- Link to GitHub pages hosted [menu page](https://sv-data-projects.github.io/materials-system)  
- Link to placeholder [visualisation index page](https://sv-data-projects.github.io/materials-systems/)
  - [Tyres prototype](https://sv-data-projects.github.io/materials-systems/tyres/)
  - [Plastics prototype](https://sv-data-projects.github.io/materials-systems/plastics/)
- Link to [supporting data](https://docs.google.com/spreadsheets/d/1hrwNUVpjX_990lH1BuGyu3-8AxauoPYknTgJDSGfQ3I)

&nbsp;
## About
This project explores a 'narrative-based' interactive visual describing material flow systems. It is being  managed by Florian van den Corput @ SV over Dec-21 to Jan 22.

- This **initial prototyping** work focuses on developing a visualisation structure (a 'library' with workflow process) to test on 1-2 materials, expected to be tyres (rubber) and plastics. 

- The prototype visualisations would be suitable for internal and public presentation, with the output focused on creating 'web presentation' format  (i.e. limited support outside of desktop screen, for now) .Design work is expected to be 'publication' quality as a static visual, however the scope of work limits the 'web application' itself to be of 'prototype' quality (e.g. not optimised for mobile, has limited screen reader accessibility etc.). 

- Further development from 'prototype' to 'production' may be commissioned as future work. Considerations include: 

  - This prototype being used to socialise the idea and gather feedback for further features.
  - The expectation that a range of other materials (~10 more) could be visualised using this framework and workflow. Note: further refinement and features are expected as the 'family' of materials visuals is developed.
  - The possibility of adding and encoding flow (widths and positions) with volume data, including for different time periods (i.e. expanding to a more 'data-driven' rendering approach)

&nbsp;
## A workflow from SVG >> Web (+ interactive)

For this prototype work - and potentially extending to other materials - a workflow has been developed to take a (carefully structured) SVG illustration as a starting point for building the web visualisation.
The general approach is to:
  - Use/import an SVG diagram where components have been (html) id tagged (manually)
  - Use supporting data tables to reference each ids (i.e. one table for nodes,  and one for flows) to attach meta-data (e.g. descriptions, and class names for use in specifying elements and element groupings that could be used with interactive features) 
  - Use an additional supporting data table to configure narrative based 'scenes' to support story-telling about a system.
  - Use JavaScript to create visual navigation and event handlers to the web page, and attach all interactivity (to the SVG and HTML elements)

All supporting data tables (for the prototype) are located in [this Google Sheet](https://docs.google.com/spreadsheets/d/1hrwNUVpjX_990lH1BuGyu3-8AxauoPYknTgJDSGfQ3I). Each table used is published (via GSHeet) as a web-accessible .tsv file whose path is added to a JS object (named "api", in the main.js file). For each material, the appropriate tables are loaded and used to configure the meta-information (including scenes and narrative) that appears in each visualisation.

This prototype data API is used as a simple way of loading data to a web page, while making that data as easy as possible to change (via Google Sheet). 

> The alternative 'data-driven' approach to rendering and positioning  the nodes and paths programatically (and encoding volume data in path widths), remains possible as a future upgrade. This would involve the development of a rendering engine that would run from similar data tables to the prototypes. At this stage the need to include and encode data is not considered necessary.


&nbsp;
# Repo and application structure

This repository organises each material visualisation into separate folders: this allow for each material to be published in its our html link and to make it easier to share links to individual material visualisations. 

Shared styling and application code is located in the css and js folders in the root directory.

> A generic content page for navigating between materials is included in the root directory as a basic navigation point (even though most materials are not considered in the prototype). The design of this page isn't part of the prototype scope and is deliberately not styled with any SV branding.  

&nbsp;
# Design notes 
**TBA on completion / finalisation of design.** 

These notes will be provided as basic reference for design decisions and limitations encountered. Will include:
- SVG layout and aspect ratio (1:1) as a more flexible ratio for more screens and orientations
- Streamlining of SVG components (node and link groupings)
- Tradeoffs for visual accessibility due to the complexity of the 'systems template', e.g. label text size; and static visual vs interactive pan and zoom.
- Rationale for choice of (categorical) colour palette for flows (e.g. a complementary range that doesn't include hues close to green due to its contextual meaning in waste and resource recovery).

&nbsp;
## Visualisation options
A handful of options are likely to be included to configured the visualisation for certain use cases (e.g. to hide the header banner, or to simply show the visualisation without the title and narrative pane).

These basic alternate layout configurations are (will be) provided where the visualisation is embedded in another application/site or extracted for use in other materials (e.g. via print to PDF). 

**Details TBA (options will be accessed via 'query strings').**