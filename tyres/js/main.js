//////////////////////////////////////////////
///// MATERIALS SYSTEMS VISUALISTAION   //////
//////////////////////////////////////////////


// 0. INITIALISE SETTINGS AND DATA OBJECTS
const settings = {           // Visualisation settings
    material:           'Tyres',
    svgID:              'tyres-system',
    svgDims:            {},
    layout: {                // Object to store default layout options (updated if settings are sent via query string)
        dynamicLabels:  true, 
        applyCSS:       true,
        showHeader:     true,
    },
    lists: {
        sceneIDs:       ''  // Scene IDs added on load of scene data
    }, 
    animation: {
        sceneDuration:  1200,
        fadeOpacity:    0.025,
    }
}

const data = {}         // Object to store loaded/parsed data
const scene = {         // Object to store scene element references and data methods
    els: {}
}        
const state = {         // Object to store application state
    scene:      ''      // SceneID set on load
}

// 1.  VISUALISATION BUILD FUNCTION  
buildFromGSheetData(settings)       // Build function called on load

function buildFromGSheetData(settings) {
    // 1. Specify data table links for each table used (tsv published output from each separate sheet/table)
    const gsTableLinks = {
        'Tyres' : {
            nodes:          'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHoQf6l-y393B5UFWEPYgBKQTIxti_7i5YlUCZW-rVd8yqiCz2UKlR31B-Y3YiiSzmTF_gpUA3uASw/pub?gid=0&single=true&output=tsv',
            links:          'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHoQf6l-y393B5UFWEPYgBKQTIxti_7i5YlUCZW-rVd8yqiCz2UKlR31B-Y3YiiSzmTF_gpUA3uASw/pub?gid=1426394391&single=true&output=tsv',
            scenes:         'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHoQf6l-y393B5UFWEPYgBKQTIxti_7i5YlUCZW-rVd8yqiCz2UKlR31B-Y3YiiSzmTF_gpUA3uASw/pub?gid=720144192&single=true&output=tsv'
        }
    }
    // 2. Asynchronous data load (with Promise.all) and D3 (Fetch API) 
    Promise.all(
        Object.values(gsTableLinks[settings.material]).map(link => d3.tsv(link))       // Pass in array of d3.tsv loaders with each link
    ).then( rawData => {
        // a. Parse each loaded data table and store in data.[materialName] object, using the parseTable helper 
        data[settings.material] = {} 
        rawData.forEach((tableData, i) => {  parseTable(Object.keys(gsTableLinks[settings.material])[i], tableData) })
        return data

    }).then( async (data) => {
        // 3. Initiate vis build sequence with data now loaded
        await applyUserQuerySettings(settings)                                                   // a. Apply query string settings
        await getSVGData()                                                                      // b. Extract source SVG data
        await setupNodeLinkComponents(data[settings.material].nodes, data[settings.material].links)    // c. Parse data
        await setupScenes(data[settings.material].scenes)                                           // c. Render visualisation(s)
        await revealVis()                                                                   // c. Render visualisation(s)
    })

    // X. Table data parsing function: trim() header white space and prase numbers with "$" and "," stripped. 
    const parseTable = (tableName, tableData) => {
        data[settings.material][tableName] = tableData.map(row => {
            const newObj = {}
            Object.entries(row).forEach(([key, value]) => {
                switch(key.trim().toLowerCase()){
                    case 'year':
                        newObj[key.trim()] =  value
                        break     
                    default:
                        newObj[key.trim()] = isNaN(parseFloat(value.replace(/\$|,/g, ''))) ? value : parseFloat(value.replace(/\$|,/g, '')) 
                }
            })
            return newObj
        })
    };   
};

    // I. Apply user options
    async function applyUserQuerySettings(settings){
        console.log('Applying query string to vis settings...')
        // i. Check for query parameters and update settings
        const queryParameters = new URLSearchParams(window.location.search)
        if (queryParameters.has('showHeader')) { 
            settings.layout.showHeader = queryParameters.get('showHeader') === 'false' ? false : true
            d3.select('.page-container').classed('hideHeader', !settings.layout.showHeader)
        }
    }; // end applyUserQuerySettings()


    // II. Extract SVG dimensions (for zoom and pan behaviour)
    async function getSVGData(){
        // 1.  Add SVG vis element reference
        scene.els.svg = d3.select(`#${settings.svgID}`)
        scene.els.svgLegend = d3.select(`#group-legend`)

        // Extract svg dims from SVG viewBox
        const viewBoxArray = JSON.parse(`[${scene.els.svg.attr('viewBox').replaceAll(' ', ',')}]`)
        settings.svgDims.xMin = viewBoxArray[0]
        settings.svgDims.yMin = viewBoxArray[1]
        settings.svgDims.width = viewBoxArray[2]
        settings.svgDims.height = viewBoxArray[3]
    }; // end getSVGDims()



    // III. Setup node and link visual components (from SVG input imported into index.html)
    async function setupNodeLinkComponents(nodeData, linkData){
        console.log('Setting up node and link interactivity')

        // 1. Nodes: setup node groups. boxes and labels 
        for (const node of nodeData){
            // a. Add node group and box classes
            const nodeGroup = d3.select(`#node-group_${node.nodeID}`)
                    .attr('class', `node ${node.systemClass} ${node.spatialClass}`)
                    .data([node]),
                nodeBox = d3.select(`#node-box_${node.nodeID}`)
                    .classed('node-box', true), 
                nodeBBox = document.getElementById(`node-box_${node.nodeID}`).getBBox()

            node.groupID  = node.nodeID.indexOf('_') < 0 ? node.nodeID : node.nodeID.slice(0, node.nodeID.indexOf('_') )

            // b. Re-style node box and label (by removing existing SVG label and re-attaching) with CSS classes
            if(settings.layout.applyCSS){   
                ["fill", "stroke", "stroke-width"].forEach(attr => document.getElementById(`node-box_${node.nodeID}`).removeAttribute(attr) )

                d3.select(`#node-label_${node.nodeID}`).remove()
                nodeGroup.append('text').classed('node-label', true)
                    .attr('x', nodeBBox.x + nodeBBox.width * 0.5)
                    .attr('y', nodeBBox.y + nodeBBox.height * 0.5)
                    .attr('dy', 0)
                    .text(node.label)
                    .call(helpers.wrap, nodeBBox.width * 0.85, 1.1, true)
            }

            // c. Find links in and out of the node
            node.input = {
                links: [],
                nodes: []
            },
            node.output = {
                links: [],
                nodes: []
            }
            
            for (const link of linkData){
                if(link['nodeID-from'] === node.nodeID){
                    node.output.links.push(link.linkID)
                    node.output.nodes.push(link['nodeID-to'])
                }
                if(link['nodeID-to'] === node.nodeID){
                    node.input.links.push(link.linkID)
                    node.input.nodes.push(link['nodeID-from'])
                }
            }
        }

        // 2. Links: setup link groups and lines/arrowheads/shapes  
        for (const link of linkData){
            // a. Find and add link group name to link data object
            link.groupID  = link.linkID.indexOf('_') < 0 ? link.linkID : link.linkID.slice(0, link.linkID.indexOf('_') )
    
            // b. Bind data: manually attach data to the link/flow group (for accessing on link or label hover)
            d3.select(`#flow-group_${link.groupID}`)
                .classed('link-group', true)
                .data([link])

            // c. Link label (group) => remove inline styling (on text elements) and add classes to control styling via CSS 
            d3.selectAll(`#flow-label_${link.groupID}, #flow-label_${link.groupID} text`)
                .classed(`link-label  ${link.linkTypeClass} ${link.linkShapeClass} ${link.flowClass} ${link.systemClass} ${link.spatialClass}`, true)
                .attr('font-family', null)
                .attr('font-size', null)
                .attr('font-weight', null)

            // d. Link shapes: and lines/arrows => remove inline styling and add classes to control styling via CSS 
            switch( link.linkTypeClass){
                case 'flow-shape':
                    d3.select(`#flow-shape_${link.linkID}`)
                        .attr('class', `link ${link.linkTypeClass} ${link.linkShapeClass} ${link.flowClass} ${link.systemClass} ${link.spatialClass}`)
                        .attr('fill', null)
                    
                    break

                case 'line':
                    d3.select(`#line_${link.linkID}`)
                        .attr('class', `link ${link.linkTypeClass} ${link.linkShapeClass} ${link.flowClass} ${link.systemClass} ${link.spatialClass}`)
                        .attr('fill', null)
                        .attr('stroke', null)
                        .attr('stroke-dasharray', null)
                        .attr('stroke-linejoin', null)
                        .attr('stroke-miterlimit', null)

                    d3.select(`#arrowhead_${link.linkID}`)
                        .attr('class', `link arrowhead ${link.linkShapeClass}  ${link.flowClass} ${link.systemClass} ${link.spatialClass}`)
                        .attr('fill', null)

                    break

                default:
                    console.log('Unknown link type:')
                    console.log(link.linkID)
            }
        }

        // 3. Interactivity: add Node and link interactivity
            // a. Link groups
            d3.selectAll('.link-group')
                .on('mouseover', function(){
                    // i. Fade all elements (apart from selected link) 
                    if( this.classList.contains('line')){
                        d3.selectAll(`.link-group.line:not(#${this.id}), .link-group.flow-shape, .node`)
                            .style('opacity', settings.animation.fadeOpacity)
                    } else {
                        d3.selectAll(`.link-group:not(#${this.id}), .link-group.line, .node`)
                            .style('opacity', settings.animation.fadeOpacity)
                    }
                    // ii. Highlight nodes in and out
    
                })

            // b. Node interactivity
            d3.selectAll('.node')
                .on('mouseover', function(){
                    const nodeData = this.__data__
                    // i. Fade all links and nodes (apart from  selected node)
                    d3.select(`#${this.id}`).classed('selected', true)
                    d3.selectAll(`.node:not(.selected), .flow-shape:not(.link-label), .link-group path, text.link-label`)
                        .style('opacity', settings.animation.fadeOpacity)

                    // ii. Highlight links in and out
                    if(nodeData.input.links.length > 0){
                        const nodeGroupArray = nodeData.input.links.map(d => d.slice(0, d.indexOf('_')) )
                        const linksInSelection= nodeData.input.links.map(d => `#flow-group_${d}`)
                            .concat(nodeData.input.links.map(d => `#flow-shape_${d}`))
                            .concat(nodeData.input.links.map(d => `#flow-group_${d} path`))
                            .concat(nodeData.input.links.map(d => `#flow-label_${d}`))
                            .concat(nodeData.input.links.map(d => `#flow-label_${d} text`))
                            .concat(nodeData.input.links.map((d, i) => `#flow-label_${nodeGroupArray[i]} text`))
                            .concat(nodeData.input.nodes.map(d => `#node-group_${d}`))
                            .toString()


                        d3.selectAll(linksInSelection)
                            .style('opacity', null)
                    }

                    if(nodeData.output.links.length > 0){
                        const nodeGroupArray = nodeData.output.links.map(d => d.slice(0, d.indexOf('_')) )
                        const linksOutSelector = nodeData.output.links.map(d => `#flow-group_${d}`)
                            .concat(nodeData.output.links.map(d => `#flow-shape_${d}`))
                            .concat(nodeData.output.links.map(d => `#flow-group_${d} path`))
                            .concat(nodeData.output.links.map(d => `#flow-label_${d}`))
                            .concat(nodeData.output.links.map(d => `#flow-label_${d} text`))
                            .concat(nodeData.output.links.map((d, i) => `#flow-label_${nodeGroupArray[i]} text`))
                            .concat(nodeData.output.links.map((d, i) => `#node-group_${nodeGroupArray[i]}`))
                            .concat(nodeData.output.nodes.map(d => `#node-group_${d}`))
                            .toString()
                        d3.selectAll(linksOutSelector)
                            .style('opacity', null)
                    }
                    // iii. Highlight the in and out nodes

                    

                    console.log(nodeData)
                })

            // c. Node + link (shared) interactivity
            d3.selectAll('.node, .link-group')
                .on('mouseout', () => {
                    // Reset visibility
                    d3.selectAll(`.flow-shape, .link-group path, .node, text.link-label`)
                        .classed('selected', false)
                        .style('opacity', null)
                })
    }; // end setupNodeLinkComponents()


    // IV. Add and setup narrative scenes
    async function setupScenes(sceneData){

        // 1. Extract scene data
        settings.lists.sceneIDs = sceneData.map(d => d['scene-id'])
        state.scene = settings.lists.sceneIDs[0]

        // 2. Add scene navigation (temporary list)
        const navContainer = d3.select('.stepper-nav'),
            navList = navContainer.append('ul')

        navList.selectAll('.step-item')
            .data(sceneData)
            .join('li')      
                .attr('id', d => `nav-item-${d['scene-id']}`)
                .classed('step-item', true)
                .attr('role', 'tab')
                    .append('a')
                    .append('span')
                    .html(d => d['scene-menu-title'])

            // a. Append CSS rules for stepper
                const style = document.createElement('style');
                settings.lists.sceneIDs.forEach( (sceneID, i) => {
                    style.innerHTML += `
                        .stepper-container nav li:nth-child(${i+1}).step-current ~ li:last-child::before {
                            -webkit-transform: translate3d(-${(settings.lists.sceneIDs.length-(i+1))*100}%,0,0);
                            transform: translate3d(-${(settings.lists.sceneIDs.length-(i+1))*100}%,0,0);
                        }
                    `
                })
                const ref = document.querySelector('script');
                ref.parentNode.insertBefore(style, ref);


            // b. Set first scene as selected by default
            d3.select('.stepper-container nav li:first-child').classed('step-current', true)


        // 3. Add scene nav interactivity
        d3.selectAll('.step-item')  
            .on('click', function(){
                // Update nav selection
                d3.selectAll('.stepper-nav li').classed('step-current', false).attr('aria-selected', false)	
                d3.select(this).classed('step-current', true).attr('aria-selected', true)
                // Update scene view/narrative
                const sceneDatum = this.__data__,
                    panX = sceneDatum.panX * settings.svgDims.width,
                    panY = sceneDatum.panY * settings.svgDims.height            
                updateNarrative(sceneDatum)         // Update title and narrative
                updateVisibility(sceneDatum)        // Update visible components
                scene.methods.setZoom(panX, panY, sceneDatum.zoomScale)         // Update the zoom framing
            })

            // X. Helper functions for scene
            function updateNarrative(sceneDatum, duration = 1000){
                d3.selectAll('#narrative-title, #narrative-container')
                    .transition().duration(duration * 0.25)
                        .style('opacity', 0)
                setTimeout(() => {
                    d3.select('#narrative-title').html(sceneDatum['scene-title'])
                    d3.select('#narrative-container').html(sceneDatum['scene-html-text'])
                    d3.selectAll('#narrative-title, #narrative-container')
                        .transition().duration(duration * 0.75)
                            .style('opacity', null)
                }, duration * 0.25);
            }; // end updateNarrative()

            function updateVisibility(sceneDatum, duration = 1000){
                if(sceneDatum['visible-selection'] !== ''){
                    d3.selectAll('.node, .link, .link-label')
                        .style('pointer-events', 'none')
                        .transition().duration(duration)
                        .style('opacity', sceneDatum['fade-opacity'])
                    d3.selectAll(sceneDatum['visible-selection'])
                        // .style('pointer-events', null)
                        .transition().duration(duration)
                        .style('opacity', null)
                }
            }; // end updateVisibility()



        // 4. Set initial scene
        const initSceneDatum = document.getElementById(`nav-item-${state.scene}`).__data__
        updateNarrative(initSceneDatum)
        updateVisibility(initSceneDatum)  
        d3.select(`#nav-item-${state.scene}`).classed('selected', true)


        // 4. Setup Zoom and pan behaviour
            // a. Add methods for controlling zoom and pan
            scene.methods = {
                handleZoom: (e) => {
                    d3.select('g.zoom-area')
                        .attr('transform', e.transform);
                }, // end handleZoom

                resetZoom(){
                    scene.els.svg
                        .transition().duration(settings.animation.sceneDuration)
                        .call(
                            scene.methods.zoom.transform, 
                            d3.zoomIdentity,
                            d3.zoomTransform(svg.node()).invert([settings.svgDims.width / 2, settings.svgDims.height / 2])
                        )           
                },

                setZoom(x, y, scale){
                    scene.els.svg
                        .transition().duration(settings.animation.sceneDuration)
                        .call(
                            scene.methods.zoom.transform,
                            d3.zoomIdentity.translate(settings.svgDims.width / 2, settings.svgDims.height / 2)
                                .scale(scale)
                                .translate(-x, -y)
                        )    
                }
            }
            // b. Add zoom and pan handlers to SVG
            scene.methods.zoom = d3.zoom()
                .scaleExtent([1, 4])
                .translateExtent([
                    [-settings.svgDims.width * 0.0, -settings.svgDims.height * 0.0], 
                    [settings.svgDims.width * 1.0, settings.svgDims.height * 1.0]
                ])
                .on('zoom', scene.methods.handleZoom);

            scene.els.svg
                .call(scene.methods.zoom) 


    }; // end setupScenes()


    // V. Start vis
    async function revealVis(){
        // on load reveal
        d3.select(`.page-container`)
            .transition().duration(settings.animation.sceneDuration)
            .style('opacity', null)


        // Hide the svg-legend (temp)
        scene.els.svgLegend.style('opacity', 0)

    }; // end renderVis()



//////////////////////////////////////////////

//  HELPER METHODS
const helpers= {
    slugify: function (str) {
        str = str.replace(/^\s+|\s+$/g, '').toLowerCase(); // trim           
        const from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;",      // remove accents, swap ñ for n, etc
            to   = "aaaaeeeeiiiioooouuuunc------"
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }
        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes
        return str;
    }, 
    wrap: function(text, width, lineHeight, centerVertical = false) {
        text.each(function() {
            let text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                y = text.attr("y"),
                x = text.attr("x"),
                fontSize = parseFloat(text.style("font-size")),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));

                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan")
                        .attr("x", x)
                        .attr("y",  y)
                        .attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }                    
            }            
            if(centerVertical){
                text.style("transform",  "translateY(-"+(8 * (lineNumber))+"px)")
            }
        })
    }
}