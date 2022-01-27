# MATERIALS SYSTEM VISUALISATION
## TL;DR
- Link to GitHub pages hosted [menu page](https://sv-data-projects.github.io/materials-systems)  
- Link to placeholder [visualisation index page](https://sv-data-projects.github.io/materials-systems/) and direct links to:
  - [Tyres prototype](https://sv-data-projects.github.io/materials-systems/tyres/)
  - [Plastics prototype](https://sv-data-projects.github.io/materials-systems/plastics/)
- Link to [supporting data](https://docs.google.com/spreadsheets/d/1hrwNUVpjX_990lH1BuGyu3-8AxauoPYknTgJDSGfQ3I) for all material visualisations

&nbsp;
# CONTENTS
- [About the prototype](#about-the-prototype)
- [Prototype workflow](#prototype-workflow)
- [Code and web app structure](#code-repository-and-web-application-structure)
- [Design considerations](#design-considerations)
- [Using these graphics in different mediums](#design-considerations)
- [Visualisation layout options](#visualisaiton-layout-options)

&nbsp;
# ABOUT THE PROTOTYPE
[Return to contents](#contents)

This project explores a 'narrative-based' interactive visual describing material flow systems. It is being  managed by Florian van den Corput @ SV over Dec-21 to Feb-22.

- This **initial prototyping** work focuses on developing a visualisation structure (a 'library' with workflow process) to test on 1-2 materials, expected to be tyres (rubber) and plastics. It is hoped that a 3rd material (textiles?) could also be done to test the (hopefully streamlined) workflow derived from developing the build process of the initial materials (note: this is subject to 'how different' the system might be and the potential for other 'un-scoped' tasks that may arise and become more 'high priority' during the project). 

- The prototype visualisations would be suitable for internal and public presentation, with the output focused on creating 'web presentation' format  (i.e. limited support outside of desktop screen, for now). Design work is expected to be 'publication' quality as a static visual, however the scope of work limits the 'web application' itself to be of 'prototype' quality (e.g. not optimised for mobile, has limited screen reader accessibility etc.). 


Further development from 'prototype' to 'production' may be commissioned as future work. Considerations (in designing adn developing this prototype work) include: 
  - This prototype being used to socialise the idea and gather feedback for further features.
  - The expectation that a range of other materials (~10 more) could be visualised using this framework and workflow. Note: further refinement and features are expected as the 'family' of materials visuals is developed.
  - The possibility of adding and encoding flow (widths and positions) with volume data, including for different time periods (i.e. expanding to a more 'data-driven' rendering approach). 
  - Design work: there is no/very limited visual design work done to the source .svg file (see Design). 
    - It should be noted that the 'programmatic rendering' approach also opens up the potential for visual design work (e.g. developing 'materially different' layout and style options) to be done without the need for a source SVG diagram. 
    - A potential (possibly large) co-benefit here is that source SVG diagrams would not be required (for future materials).

> A a more detailed listing of further design and development options may later be included in this documentation to keep a centralised set of notes for consideration.

&nbsp;
# PROTOTYPE WORKFLOW
[Return to contents](#contents)
## i. Turning static SVG diagrams into web interactives

For this prototype work - and potentially extending to other materials - a workflow has been developed to take a (carefully structured) SVG illustration as a starting point for building the web visualisation.
The general approach is to:
  - Use/import an SVG diagram where components have been (html) id tagged (manually)
  - Use supporting data tables to reference each ids (i.e. one table for nodes,  and one for flows) to attach meta-data (e.g. descriptions, and class names for use in specifying elements and element groupings that could be used with interactive features) 
  - Use an additional supporting data table to configure narrative based 'scenes' to support story-telling about a system.
  - Use JavaScript to create visual navigation and event handlers to the web page, and attach all interactivity (to the SVG and HTML elements)

All supporting data tables (for the prototype) are located in [this Google Sheet](https://docs.google.com/spreadsheets/d/1hrwNUVpjX_990lH1BuGyu3-8AxauoPYknTgJDSGfQ3I). Each table used is published (via GSheet) as a web-accessible .tsv file whose path is added to a JS object (named "api", in the main.js file). For each material, the appropriate tables are loaded and used to configure the meta-information (including scenes and narrative) that appears in each visualisation.

This prototype data API is used as a simple way of loading data to a web page, while making that data as easy as possible to change (via Google Sheet). 

&nbsp;
> **Why develop the SVG >> Web workflow**
>
> The decision to prototype with the SVG > web workflow is to allow for design and layout changes to be made through the SVG editing process. This process is quicker than having to develop a rendering engine that 'replicates' the original diagram, and allowed for development time to be shifted to narrative and scene configuration and interactions.
>
> The alternative 'data-driven' approach to rendering and positioning the nodes and paths programatically (and encoding volume data in path widths), remains possible as a future upgrade. This would involve the development of a rendering engine that would run from similar data tables to the prototypes. At this stage the need to include and encode data is not considered necessary.
> 
> **Important: changes to the Google Sheet data update 'quickly' but usually not 'immediately'. For changes made to the Google Sheet to appear, the visualisation page will first need to be reloaded. If changes don't seem to immediately appear, wait a few moments and try again. It can take up to a couple of minutes for changes in the Google Sheet to flow through to its data API (usually its within seconds however)**


&nbsp;

## ii. SVG diagrams: setup and preparation
Vector diagrams (of material systems) are developed in software packages such as Adobe Illustrator, Affinity Design and Inkscape etc. need to (firstly) be exported into SVG format. All major web browsers support [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) officially, meaning that SVG code can be rendered by the browser and be further "styled and controlled" by code (i.e. made to be interactive with the help of JavaScript).

The following are notes about preparing an Illustrator developed vector graphic for use in a materials diagram. They are not exhaustive or intended to be a "how to guide", but are intended to help someone with a reasonable knowledge of SVG and web development, understand the process and where to look for problems.

**a. Preparing diagrams in vector drawing software (a manual process)**
- Diagrams developed in vector software that are intended for static output (e.g. to image/pdf) generally don't require element "groupings" of tagging of XML id's or classes to work. The visualisation code however, **does require** that certain structures to be able to identify elements, and their groupings/relationships to together groupings. For example, separate SVG paths make up a dashed line and an arrowhead. Specific ID tags for each element are needed for the code to identify which path is the flow line (using a standard id prefix like "line_"), and which is the arrowhead (prefix of "arrowhead_"); AND that these two elements should be grouped together to form one flow path (by adding an unique suffix). 
- In practice, the flow label is also given an ID and the three elements are put into a parent group that has an id starting with "flow-group_< unique-suffix-name >"
- Further groupings (akin to layers) are introduced for nodes, links and the legend (i.e. given id's of "group-nodes", "group-links" and "group-legend"); and all are parented to a group with class "zoom-area" which is used for attaching zoom and pan interactivity.
- This re-arranging and grouping should be done in the XML editor of software packages (to ensure that hte source file is being worked on) but can technically be done in a text editor directly to the SVG code.
- The naming of id tags MUST be done to match the node and link meta data (i.e. Google Sheet "linkID" and "nodeID" fields, which provide unique suffixes for ids). Mistakes in id naming convention or grouping will (mostly likely) only show up in interaction events in the web version (i.e. the full graphic will almost certainly 'show up' in the browser when imported, but mistakes/typos will result in the interactive behaviour not working properly)
- Adobe Illustrator uses a proprietary file format (.ai) that is similar to SVG, however are not .svg files unless exported as such. 
  - One issue found with Illustrator is that unwanted/useless svg groups, or a 'splitting' of elements occurs (seemingly randomly). An example of the latter is that for some dashed lines (that should be one single svg path with dash styling), the first and last dash are separated into their own elements; resulting in three paths (two extremely short) rather than one. 
  - Both of these types of 'export' issues need to be manually fixed (e.g. in the split path example, deleting extra line elements and extending the main path)
- The notes above described a very 'manual' and highly detailed and (potentially) fragile preparation process. Because With this in mind, it is highly recommended that existing (working) svg diagrams be used as templates for the preparation for new material diagrams. All svg files used are in the "assets" folder of this repo (and it is recommended that any updates and further diagrams are stored there as "master" files).
 > By far the best way to understand how this manual re-arranging and id tagging should be done, is to look at an existing working version. This should done in conjunction with the diagrams meta-data tables (to reference the node and link IDs being used)**

&nbsp;

**b. Exporting the SVG code into the HTML file**
Taking the code out of the source .svg file and into the html file used for the webpage is a fairly straightforward process (i.e. this is essentially a copy and paste job, however it likely involves some unfamiliar tools).
- An example case might be where minor edits have been made to the source diagram and need to be updated in the webpage
- To export the SVG code/data, the file itself needs to be opened in a code editor.
- The SVG data is then imported to the 'index.html' file in each material folder
- The SVG element is given a name a specific CSS id and class (both 'system-vis') that must not be changed. The recommended update process is to simply replace everything inside the 'zoom-area' group (which is a parent containing all the SVG elements)
- It is highly recommended that the online [SVG OMG tool](https://jakearchibald.github.io/svgomg/) be used to extract (optimised) SVG code. This also makes it easier to copy the actual SVG code across to the HTML file (i.e. you can open the svg file and copy the code out from here, instead of having to open the .svg file in a code editor)
> **Again, by far the best way to understand how this works is to open the index.html file and see where the SVG data needs to be updated/replaced.**

&nbsp;

**c. Role of code for cleaning SVG inline attributes and styling with CSS classes**
The script (code) for producing the interactive web diagrams goes through a series of steps to make the SVG diagram interactive. The (commented) code itself (js/main.js) is by far best way to understand all of details of the implementation. A summary of key steps is provided here to help users understand how the SVG data might be modified by the code>

- The script uses the (manually) tagged SVG element IDs to 'attach' meta-information about nodes and links (in the respective Google Sheet tables), to the nodes and links that are seen on the the page/screen. This includes a variety of CSS classes that allow for controls for styling/highlighting/zooming to be done.
- In order for the CSS classes to take control of styling elements, all inline styles (that are part of the source .svg file) are stripped out. For example, the 'font-family' and 'font-size' that are specified for each flow label in the source .svg diagram, are removed and the class 'flow-label' added, allowing for the styling to be controlled via CSS. This means that changes to the label styles done in the source .svg diagram **will not** show up in the web version. Instead, **style changes should be done via CSS** (in the vis-core.css file which applies to all diagrams, or if specific to the material, through its own style.css file)
- The choice to override styles and use CSS is done to simplify styling and allow better (more consistent) style control interaction via JavaScript and CSS classes. This also eliminates potentially inconsistent inline styles (either in their use, or how they're exported) that might arise from using vector software.

&nbsp;

## 3. The webpage UI and Scene interface
The user interface (UI) for each interactive diagram consists of the same basic layout:
- **Header/nav bar (top)**: this is/will be made optional as branding/log and nav are not necessary if the visual is embedding within the SV website/CMS. However this is included as it is likeley to be necessary in a 'presentation' use case.
- **Title/Content pane (left side)**: contains the main title (the 'material') and subtitle and text content for each 'scene'
- **Visualisation pane (center and right)**: Contains the SVG itself. Zoom and pan interactions are attached to allow users to zoom and pan around the displayed visual
- **Scene selector pane (bottom)**: a tabbed button-like selector with short labels to describe each 'scene' in the 'material system narrative'. 

Further design notes concerning the webpage layout are detailed in further sections below.

&nbsp;

## 4. Narrative controls through individual scenes

To enable detailed narratives to be told, the concept of individual 'scenes' is used that allow authors to control the 'view' of the diagram, and simultaneously add text to the content pane.  All scene content and configuration is done via the materials scene data table (in the Google Sheet). Some notes are provided below:
 
 -  The visual control of the view of the SVG simply allows for elements to be hidden or faded, to highlight the parts of the system that are being discussed in the narrative. This is configured for each scene in the scene data data and controlled via a CSS selector (see below) 
 - A custom zoom function is called for each scene that will put the 'visible-selection' components of the scene in focus. A 'customZoom' configuration object (in the data table as JSON) can also be used, however this is unlikely to be used and not fully documented here) 


&nbsp;
## 5. Using CSS classes to control the highlighted elements

Knowledge of CSS and how all elements have been id'd and classed in the scene  configuration tables is strongly recommended for anyone trying to create scene views. Access to the configuration is made available though these tables to make it possible to customise scene views without needing to change any of tools code, however it must be stressed that this is no 'simple way' to create such a customisable process.

The following are guidance notes:
- There are various class fields in the node and link configuration tables that can be used to group those elements. Each of these are written as 'space separated' list with valid CSS names (i.e. in 'kebab case' without invalid characters). 
- The code assigns all of these classes to the node/link elements (and their parent groups). This is what allows for those group to be selected for highlighting by CSS class name. 
- More (unlimited) classes (groupings) can be added to highlight relationships.
- Setting visible elements is done in the scene configuration table in the 'visible-selection' field. 
- The visible-selection field **must be a valid CSS selector string or the scene visual highlighting feature will fail**. 
- CSS selection strings can contain multiple classes and id's, which enables maximum flexibility. 

> **Once again, examining the (working prototype) configuration tables and what they produce on-screen is the best way to understand how they work**

&nbsp;

&nbsp;

# CODE REPOSITORY AND WEB APPLICATION STRUCTURE
[Return to contents](#contents)

## i. Repo and app folder structure
This repository organises each material visualisation into separate folders: this allow for each material to be published in its our html link and to make it easier to share links to individual material visualisations. 

Shared styling and application code is located in the css and js folders in the root directory. In this setup, those 'core' files essentially make up the material systems 'library' components.

&nbsp;
## ii. Access to the repository (for making updates)
The repository is 'public' and allows anyone to view its contents. Setting the repo to public is also required to enable GitHub pages hosting, which is a convenient prototype deployment tool and is a robust option for hosting content that is embedding inside SV website (as the non-SV domain name is not exposed in that case 

The repository is stored under the [sv-data-projects organisational GitHub account](https://github.com/sv-data-projects), which is administered by the SV Data and Insights team. Other users however can request access which would enable them to edit/update the website (via its source code). 

> It is important to remember that this project is a 'small web application' and that a reasonable degree of web development knowledge is expected from anyone making changes.

&nbsp;

&nbsp;
# DESIGN CONSIDERATIONS
[Return to contents](#contents)

## i. Visual style
**TBC on completion / finalisation of design.** 

These notes will be provided as basic reference for design decisions and limitations encountered. It will include:
- SVG layout and aspect ratio (1:1) as a more flexible ratio for more screens and orientations
- Tradeoffs for visual accessibility due to the complexity of the 'systems template', e.g. label text size; and static visual vs interactive pan and zoom.
- Rationale for choice of (categorical) colour palette for flows (e.g. a complementary range that doesn't include hues close to green due to its contextual meaning in waste and resource recovery etc.).
- Typographic styling choices

&nbsp;
> **CSS is used for all visual styling**
>
> It is important to note the colour and typographic styling is done though CSS. This

&nbsp;
## ii. Mobile support and responsiveness
The prototype **does not** cater for a mobile UI. Further UI design work is required here (i.e. outside the scope of the prototype work).
There are multiple issues that will need to be considered for a 'mobile optimised' experience that are mainly concerned with the lack of screen space to displace 'whole of system' views, particularly alongside mobile legible text for narrative.

> Given the information density of each systems diagram and narrative, Serious consideration should be given to not providing a mobile (small screen) version, or potentially providing a text only experience (as the main challenge is showing both visual and accompanying text).

Note: the general 'desktop' UI layout for the prototype are built with CSS grid and have been designed to be able be restacked for a medium-large portrait screen layout (e.g. a tablet). This work however - including all device testing - is not considered in scope for the prototype.


&nbsp;
## iii. Accessibility 
The prototype **is not** optimised for screen reader accessibility, and is constrained by the original SVG diagram layout with respect to text size options. 


>  **A note on SVG (and general) accessibility**
>
> Although SVGs are native HTML DOM elements (making them technically 'readable' for screen readers), more effort is required to make  visualisations accessible for screen readers and keyboard-only users.  This includes making appropriate `Title` and `Description` tags (that do not not clash with teh visualsations UI events),  as well programming appropriate reference attributes and [WCAG ARIA roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)

&nbsp;

&nbsp;
# USING THESE GRAPHICS IN DIFFERENT MEDIUMS
[Return to contents](#contents)
## i. Published web links (for viewing and embedding)
As these graphics are rendered in the browser, this repo has also published to [Github pages](https://pages.github.com/) so that they can be easily shared an embedded. In this way,  Github pages is used to as a convenient static web server for publishing these graphics, and can be used as links to embed graphics in other webpages and apps, including the SV CMS.

An HTML index page has also been added to the repo (index.html) that provides a user friendly single access point to all graphics [here](./index.html). This is generic content page for navigating between materials  (even though most materials are not considered in the prototype). **Note: The design of this page isn't part of the prototype scope and is deliberately not styled with any SV branding.**  

If (in the future) other hosting services are preferred, they can (most likely) be linked to this Github repo. 

&nbsp;
## ii. Exporting vector graphics for designed print publications
SVG and HTML based graphics can be exported (via print to PDF) as vector graphic files. Vector files are generally the highest 'publication quality' format for data visualisation that can be embedded and/or further edited in publication. These software packages can also export in other common graphic file formats (e.g. PNG and JPG) from these software packages.

&nbsp;
## iii. Creating raster image files for MS documents (Word and PowerPoint)
To create images that might be better suited to being embedded in MS Word or PowerPOint documents, embedding vector graphics is problematic on Windows based machines (at the time or writing, where embedding PDF is possible however they become rasterised when saved). This is not problem on Mac OS machines where MS Word and PowerPoint happily accept and vector PDF files. 

> A fallback for Windows users who don't have access to graphics software is to convert from PDF to PNG (as the preferable raster image format).

&nbsp;
## iv. Embedding (iframe) on the SV website (or other web applications)
The prototype has been designed with consideration for how visuals might be embedded in the SV website (through the CMS). To accommodate embedding, each graphic is designed to be responsive and will stretch to the width of the browser page. This includes HTML text and spacing that is specified in [viewport width](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units) units so that it has the same resizing behaviour as SVG elements. 

> **Design considerations for the SV website:**
> - The current SV website has quite a narrow, centered content block. Data visualisations are embedded as into this content flow, meaning that they appear quite narrow on screen. Data visualisations intended for embedding on the SV website need to consider this limitation.
> - Every embedded data visualisation does also have a 'view full screen option': this allows some flexibility to design for full screen. 
> - The SV CMS requires that embedded graphics contain the [iframe resizer](https://github.com/davidjbradshaw/iframe-resizer) code snippet. This snipper is added as a CDN link to each graphic. All newly made graphics should be published with this snippet.   
> - The SV CMS embeds html based graphics using the "Advanced data visualisation (D3)" component that allows for any [iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) to be specified. 




&nbsp;
# VISUALISATION LAYOUT OPTIONS
[Return to contents](#contents)

The prototypes provides some layout options to provide some flexibility for use in different print and digital situations. These options allow the web page to hide any of the main UI element 'panes' (defined [above](#the-webpage-ui-and-scene-interface),  with the default setting being that each element is shown); and are set using query strings.

&nbsp;
## i. Layout options for each material visualisation URL

 Query parameter name | Query parameter value format |  Query parameter default |  Query parameter description
|--- |---| ---| ---|
 hideHeader  | 'true' or 'false' | false | Used to hide the top header (e.g. for when vis is embedded in the SV website)
 hideContentPane  | 'true' or 'false' | false | Used to hide the title block and narrative text pane.
 hideScenePane  | 'true' or 'false' | false | Used to hide the scene selector navigation pane

&nbsp;
> **Using query strings for setting visualisation options**
>
> Each systems visualsiation URL accepts a [query string](https://en.wikipedia.org/wiki/Query_string) that can be used to alter the default layout. Query strings are simply an specially formatted text string at the end of a URL, after a '?". You can think of a query string as sending a bunch of 'settings' for the data vis application to apply. This means that the application must first be setup to do something with query string it receives. The table below outlines what options are available for each graphic.
>
>You can read about how query strings are structure [here](https://en.wikipedia.org/wiki/Query_string#Structure) - it'll only take a few seconds or minutes to work out. But another simple way to figure them out is to see an example: a visualisation might be setup to receive a 'hideHeader' parameter from a query string, of a specific value like 'true' or 'false'. The visualisaiton would then display the right layout configuration. 
> - The query string would be simply be **'?hideHeader=true'** and the URL would look something like www.xxxx.com/vis.html?**hideHeader=true**. 
> - Multiple parameters can be appended wih an '&'. So www.xxxx.com/vis.html**?hideHeader=true&hideScenePane=true&hideContentPane=true** would ask the visualisation code to hide these three panes and effectively, show only the diagram.
>
> And thats all there is to query strings!