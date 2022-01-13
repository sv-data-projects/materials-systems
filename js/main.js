//////////////////////////////////////////////
///// MATERIALS SYSTEMS VISUALISATION   //////
///// -------------------------------   //////
///// Shared functions and api (link)   //////
///// references across all material    //////
///// system visuals.                   //////
//////////////////////////////////////////////

// 0. INITIALISE DATA AND SETTINGS OBJECTS

const api = {           // References for data table links for each table used (tsv published output from each separate sheet/table)
    gsTableLinks: {
        'Tyres' : {
            nodes:          'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHoQf6l-y393B5UFWEPYgBKQTIxti_7i5YlUCZW-rVd8yqiCz2UKlR31B-Y3YiiSzmTF_gpUA3uASw/pub?gid=0&single=true&output=tsv',
            links:          'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHoQf6l-y393B5UFWEPYgBKQTIxti_7i5YlUCZW-rVd8yqiCz2UKlR31B-Y3YiiSzmTF_gpUA3uASw/pub?gid=1426394391&single=true&output=tsv',
            scenes:         'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHoQf6l-y393B5UFWEPYgBKQTIxti_7i5YlUCZW-rVd8yqiCz2UKlR31B-Y3YiiSzmTF_gpUA3uASw/pub?gid=720144192&single=true&output=tsv'
        },
        'Plastics' : {
            nodes:          'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHoQf6l-y393B5UFWEPYgBKQTIxti_7i5YlUCZW-rVd8yqiCz2UKlR31B-Y3YiiSzmTF_gpUA3uASw/pub?gid=1416008378&single=true&output=tsv',
            links:          'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHoQf6l-y393B5UFWEPYgBKQTIxti_7i5YlUCZW-rVd8yqiCz2UKlR31B-Y3YiiSzmTF_gpUA3uASw/pub?gid=1423640588&single=true&output=tsv',
            scenes:         'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHoQf6l-y393B5UFWEPYgBKQTIxti_7i5YlUCZW-rVd8yqiCz2UKlR31B-Y3YiiSzmTF_gpUA3uASw/pub?gid=1983312551&single=true&output=tsv'
        }
    }
}

const data = {}         // Object to store loaded/parsed data

const settings = {      // Visualisation settings
    svgID:              'system-vis',
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

const scene = {         // Object to store scene element references and data methods
    els: {},
    methods: {} 
}   

const state = {         // Object to store application state
    scene:      ''      // SceneID set on load
}

// 1.  VISUALISATION BUILD FUNCTION  
function buildFromGSheetData(settings) {
    // 2. Asynchronous data load (with Promise.all) and D3 (Fetch API): references the shared "api" object for links to specific data tables
    Promise.all(
        Object.values(api.gsTableLinks[settings.material]).map(link => d3.tsv(link))       // Pass in array of d3.tsv loaders with each link
    ).then( rawData => {
        // a. Parse each loaded data table and store in data.[materialName] object, using the parseTable helper 
        data[settings.material] = {} 
        rawData.forEach((tableData, i) => {  parseTable(Object.keys(api.gsTableLinks[settings.material])[i], tableData) })
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

        // 1. NODES: setup node groups. boxes and labels 
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

            // d. Attach link classes to nodes (to and from)
            const allLinksClass = node.output.links.concat(node.input.links).map(d => d.slice(d.indexOf('_') + 1))
            for( const className of allLinksClass){
                nodeGroup.classed(className, true)
            }
        }

        // 2. LINKS: setup link groups and lines/arrowheads/shapes  
        for (const link of linkData){
            // a. Find and add link group name to link data object
            link.groupID  = link.linkID.indexOf('_') < 0 ? link.linkID : link.linkID.slice(0, link.linkID.indexOf('_') )
    
            // b. Bind data: manually attach data to the link/flow group (for accessing on link or label hover)
            d3.select(`#flow-group_${link.groupID}`)
                .attr('class', function(d){ 
                    return `link-group ${this.id.slice(this.id.indexOf('_') + 1)}`
                })
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
                    d3.select(`#flow-group_${link.linkID}`)
                        .classed('unknown-flow', true)

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

        // 3. LEGEND: setup the svg legend elements for control by JS/CSS (note: all elements given legend-item class)
            // a. Restyle title by CSS class
            d3.select('#legend-title')
                .attr('font-size', null)
                .attr('font-family', null)
                .attr('font-weight', null)
                .classed('legend-item', true)

            // b. Restyle legend label text and any groups holding multiple lines of label text by CSS class
            d3.selectAll('#group-legend * text:not(#legend-title), #group-legend g g')
                .attr('font-size', null)
                .attr('font-family', null)
                .attr('font-weight', null)
                .classed('legend-label', true)

            d3.selectAll('#group-legend g')
                .attr('class', function(d){ 
                    return `legend-item legend-group ${this.id.slice(this.id.indexOf('_') + 1)}`
                })

            // c. Restyle each legend dot with CSS class
            d3.selectAll('#group-legend * circle')
                .attr('fill', null)
                .attr('class', function(d){ 
                    return `legend-item legend-dot ${this.id.slice(this.id.indexOf('_') + 1)}`
                })
    

        // 4. INTERACTIVITY: add Node and link interactivity
            // a. Setup interactivity methods
            scene.methods.setNodeLinkInteractions = () => {
                d3.selectAll('.link-group')
                    .on('mouseover', scene.methods.linkMouseover)
                    .on('click', scene.methods.linkClick)
                d3.selectAll('.node')
                    .on('mouseover', scene.methods.nodeMouseover)
                    .on('click', scene.methods.nodeClick )
                d3.selectAll('.node, .link-group')
                    .on('mouseout', scene.methods.resetVisibility)
                d3.selectAll('.legend-group')
                    .on('mouseover', scene.methods.highlightLegendClass)   
                    .on('mouseout', scene.methods.resetVisibility)
            }; // end setNodeLinkInteractions()

            scene.methods.clearAllNodeLinkInteractions = () => {
                d3.selectAll('.node, .link-group')
                    .on('mouseover', null)
                    .on('mouseout', null)
                    .on('click', null)
            }; // end clearAllNodeLinkInteractions()

            scene.methods.clearNodeLinkMouseover = () => {
                d3.selectAll('.node, .link-group')
                    .on('mouseover', null)
                    .on('mouseout', null)
            }; // clearNodeLinkMouseover()

            scene.methods.nodeMouseover = function() {
                const nodeData = this.__data__
                // i. Fade all links and nodes (apart from  selected node) and  highlight links in and out
                scene.methods.highlighNodeInOuts(this.id, nodeData.input, nodeData.output)
            }; // end nodeMouseover()

            scene.methods.highlighNodeInOuts = (nodeID, inputData, outputData) => {
                scene.methods.resetVisibility()
                d3.selectAll('.node').classed('selected', false)
                d3.select(`#${nodeID}`).classed('selected', true)
                d3.selectAll(`.node:not(.selected), .flow-shape:not(.link-label), .link-group path, text.link-label`)
                    .transition().duration(0)
                    .style('opacity', settings.animation.fadeOpacity)

                if(inputData.links.length > 0){
                    const nodeGroupArray = [...new Set(inputData.links.map(d => d.slice(0, d.indexOf('_')) ))]
                    const linksInSelection = inputData.links.map(d => `#flow-group_${d}`)
                        .concat(inputData.links.map(d => `#flow-shape_${d}`))
                        .concat(inputData.links.map(d => `#flow-group_${d} path`))
                        .concat(inputData.links.map(d => `#flow-label_${d}`))
                        .concat(nodeGroupArray.map(d => `#flow-label_${d}`))
                        .concat(inputData.links.map(d => `#flow-label_${d} text`))
                        .concat(inputData.links.map((d, i) => `#flow-label_${nodeGroupArray[i]} text`))
                        .concat(inputData.nodes.map(d => `#node-group_${d}`))
                        .toString()

                    d3.selectAll(linksInSelection)
                        .transition().duration(0)
                        .style('opacity', null)
                }

                if(outputData.links.length > 0){
                    const nodeGroupArray = [...new Set(outputData.links.map(d => d.slice(0, d.indexOf('_')) ))]
                    const linksOutSelector = outputData.links.map(d => `#flow-group_${d}`)
                        .concat(outputData.links.map(d => `#flow-shape_${d}`))
                        .concat(outputData.links.map(d => `#flow-group_${d} path`))
                        .concat(outputData.links.map(d => `#flow-label_${d}`))
                        .concat(nodeGroupArray.map(d => `#flow-label_${d}`))
                        .concat(outputData.links.map(d => `#flow-label_${d} text`))
                        .concat(outputData.links.map((d, i) => `#flow-label_${nodeGroupArray[i]} text`))
                        .concat(outputData.links.map((d, i) => `#node-group_${nodeGroupArray[i]}`))
                        .concat(outputData.nodes.map(d => `#node-group_${d}`))
                        .toString()
                    d3.selectAll(linksOutSelector)
                        .transition().duration(200)
                        .style('opacity', null)
                }
            }; // end highlightNodeInsOuts()

            scene.methods.highlightLinkNodes = (link) => {
                // i. Fade all elements (apart from selected link) 
                if( link.classList.contains('line')){
                    d3.selectAll(`.link-group.line:not(#${link.id}), .link-group.flow-shape, .node`)
                        .transition().duration(0)
                        .style('opacity', settings.animation.fadeOpacity)
                } else {
                    d3.selectAll(`.link-group:not(#${link.id}), .link-group.line, .node`)
                        .transition().duration(0)
                        .style('opacity', settings.animation.fadeOpacity)
                }
                // ii. Highlight nodes in and out
                const linkData = link.__data__
                d3.selectAll('.node').classed('selected', false)
                    .transition().duration(0)
                    .style('opacity', settings.animation.fadeOpacity)
                    
                d3.selectAll(`#node-group_${linkData['nodeID-from']} , #node-group_${linkData['nodeID-to']}`)
                    .transition().duration(0)
                    .style('opacity', null)

            }; // end highlightLinkNodes

            scene.methods.nodeClick = function(event) {
                event.stopPropagation()
                const nodeData = this.__data__

                // i. Highlight links in and out, set overlay and interactivity
                scene.methods.highlighNodeInOuts(this.id, nodeData.input, nodeData.output)
                scene.methods.renderOverlay(nodeData.label, nodeData.description)
                scene.methods.openOverlay()
                scene.methods.clearNodeLinkMouseover()

                // ii. Pan and zoom to visible nodes
                const connectedNodeIDs = [...new Set(nodeData.input.nodes.concat(nodeData.output.nodes) )]
                    .filter(d => d !== "")
                    .map( d => `node-group_${d}`)
                    .concat([this.id]),

                    connectedNodeBBox = connectedNodeIDs.map( d => document.getElementById(d).getBBox()),
                    topLeft =       [d3.min(connectedNodeBBox.map(d => d.x)), d3.min(connectedNodeBBox.map(d => d.y))] 
                    bottomRight =   [d3.max(connectedNodeBBox.map(d => d.x + d.width)),  d3.max(connectedNodeBBox.map(d => d.y + d.height))],
                    height =        bottomRight[1] - topLeft[1],
                    width =         bottomRight[0] - topLeft[0],
                    panX = d3.mean([bottomRight[0], topLeft[0]]),
                    panY = d3.mean([bottomRight[1], topLeft[1]]),
                    zoom = 0.85 * d3.min([settings.svgDims.height / height , settings.svgDims.width / width])        
                
                scene.methods.setZoom(panX, panY, zoom)    


            }; // end nodeClick()

            scene.methods.linkMouseover = function() {
                // i Highlight link and to/from nodes
                scene.methods.highlightLinkNodes(this)

            }; // end linkMouseover()

            scene.methods.linkClick = function(event) {
                event.stopPropagation()
                const linkData = this.__data__

                // i Highlight link and to/from nodes, set overlay and interactivity
                scene.methods.highlightLinkNodes(this)
                scene.methods.renderOverlay(linkData.label, linkData.description)
                scene.methods.openOverlay()
                scene.methods.clearNodeLinkMouseover()

                // ii. Pan and zoom to visible nodes
                let connectedNodeLinkIDs = []
                if(linkData['nodeID-from']) connectedNodeLinkIDs.push(`node-group_${linkData['nodeID-from']}`)
                if(linkData['nodeID-to']) connectedNodeLinkIDs.push(`node-group_${linkData['nodeID-to']}`)

                connectedNodeLinkIDs = connectedNodeLinkIDs
                    .filter(d => d !== "")
                    .concat([this.id])

                const connectedNodeBBox = connectedNodeLinkIDs.map( d => document.getElementById(d).getBBox()),
                    topLeft =       [d3.min(connectedNodeBBox.map(d => d.x)), d3.min(connectedNodeBBox.map(d => d.y))] 
                    bottomRight =   [d3.max(connectedNodeBBox.map(d => d.x + d.width)),  d3.max(connectedNodeBBox.map(d => d.y + d.height))],
                    height =        bottomRight[1] - topLeft[1],
                    width =         bottomRight[0] - topLeft[0],
                    panX = d3.mean([bottomRight[0], topLeft[0]]),
                    panY = d3.mean([bottomRight[1], topLeft[1]]),
                    zoom = 0.85 * d3.min([settings.svgDims.height / height , settings.svgDims.width / width])        
                
                scene.methods.setZoom(panX, panY, zoom)    

            }; // end linkClick()

            scene.methods.highlightLegendClass = function(){
                if(this.classList[2] !== 'unknown-flow'){
                    d3.selectAll(`.flow-shape:not(.${this.classList[2]}), .node:not(.${this.classList[2]}), .link-group.unknown-flow`)
                        .style('opacity', 0)
                } else {
                    d3.selectAll(`.flow-shape`)
                        .style('opacity', 0)
                }
            }; // end highlightLegendClass()

            scene.methods.resetVisibility = () => {
                // Reset visibility
                d3.selectAll(`.flow-shape, .link-group, .link-group path, .node, text.link-label`)
                    .classed('selected', false)
                    .style('opacity', null)
            }; // end resetVisibility()

            scene.methods.resetAll = () => {
                scene.methods.resetVisibility()
                scene.methods.resetZoom()
                scene.methods.closeOverlay()
            };

            // b. Call method to setup node and link interactivity
            scene.methods.setNodeLinkInteractions()

        // 4. Setup overlay methods and button close behaviour (incl. setting node/link interaction)
            scene.methods.renderOverlay = (header, htmlContent) => {
                d3.select('.overlay-header').html(header)
                d3.select('.overlay-content').html(htmlContent)
                d3.selectAll('.overlay-header, .overlay-content')
                    .style('opacity', 0)
                    .transition().duration(250)
                    .style('opacity', null)
            }; // end renderOverlay()

            scene.methods.closeOverlay = (resetZoom = true) => {
                d3.select('.overlay-pane').classed('open', false)
                scene.methods.setNodeLinkInteractions()
                scene.methods.resetVisibility()
                if(resetZoom) scene.methods.resetZoom()
            }; // end closeOverlay()

            scene.methods.openOverlay = () => {
                d3.select('.overlay-pane').classed('open', true)

                // Add reset event for SVG
                scene.els.svg.on('click', () => {
                    scene.methods.closeOverlay() 
                    scene.els.svg.on('click', null)
                })

            };  // end openOverlay()

            d3.select('.overlay-close-button')
                .on('click', scene.methods.closeOverlay )

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


        // 3. Scene interactivity helpers methods
            scene.methods.updateSceneNarrative = function(sceneDatum, duration = 1000){
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


            scene.methods.updateSceneVisibility = function(sceneDatum, duration = 1000){
                if(sceneDatum['visible-selection'] !== ''){
                    d3.selectAll('.node, .link, .link-label, .legend-item')
                        .transition().duration(duration)
                        .style('opacity', sceneDatum['fade-opacity'])

                    d3.selectAll(sceneDatum['visible-selection'])
                        .transition().duration(duration)
                        .style('opacity', null)
                }
            }; // end updateVisibility()

            scene.methods.zoomToELements = function(nodeArray, zoomFactor = 0.925, duration = 1000){
                const nodeBBoxArray = nodeArray.map( d => d.getBBox()),
                    topLeft =       [d3.min(nodeBBoxArray.map(d => d.x)), d3.min(nodeBBoxArray.map(d => d.y))] 
                    bottomRight =   [d3.max(nodeBBoxArray.map(d => d.x + d.width)),  d3.max(nodeBBoxArray.map(d => d.y + d.height))],
                    height =        bottomRight[1] - topLeft[1],
                    width =         bottomRight[0] - topLeft[0],
                    panX =          d3.mean([bottomRight[0], topLeft[0]]),
                    panY =          d3.mean([bottomRight[1], topLeft[1]]),
                    zoom =          zoomFactor * d3.min([settings.svgDims.height / height , settings.svgDims.width / width])        

                scene.methods.setZoom(panX, panY, zoom)    
            }; // end zoomToElements
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
     
                scene.methods.updateSceneNarrative(sceneDatum)         // Update title and narrative
                scene.methods.updateSceneVisibility(sceneDatum)        // Update visible components

                switch(sceneDatum.zoomType.toLowerCase()){
                    case 'auto':    // Auto zoom to selected (non-text) elements
                        scene.methods.zoomToELements(
                            d3.selectAll(sceneDatum['visible-selection']).nodes().filter(d => d.tagName !== 'text')
                        )       
                        break

                    case 'custom':  // Update the zoom framing
                        const customSettings = JSON.parse(sceneDatum.customZoom),
                            panX = customSettings.panX * settings.svgDims.width,
                            panY = customSettings.panY * settings.svgDims.height    

                        scene.methods.setZoom(panX, panY, customSettings.zoomScale)        
                        break

                    case 'none':
                    case 'reset':
                    case 'default':
                    default:
                        scene.methods.resetZoom()

                }

                // Close any overlays (without resetting zoom)
                scene.methods.closeOverlay(false)
                scene.methods.clearNodeLinkMouseover()              // Stop mouseover 
            })


        // 4. Set initial scene
        const initSceneDatum = document.getElementById(`nav-item-${state.scene}`).__data__
        scene.methods.updateSceneNarrative(initSceneDatum)
        scene.methods.updateSceneVisibility(initSceneDatum)  
        d3.select(`#nav-item-${state.scene}`).classed('selected', true)


        // 5. Setup Zoom and pan behaviour
            // a. Add methods for controlling zoom and pan
            scene.methods.handleZoom = (e) => {
                d3.select('g.zoom-area')
                    .attr('transform', e.transform);
            } // end handleZoom();

            scene.methods.resetZoom = () =>{
                scene.els.svg
                    .transition().duration(settings.animation.sceneDuration)
                    .call(
                        scene.methods.zoom.transform, 
                        d3.zoomIdentity,
                        d3.zoomTransform(scene.els.svg.node()).invert([settings.svgDims.width / 2, settings.svgDims.height / 2])
                    )           
            }; // end resetZoom()'

             scene.methods.setZoom = (x, y, scale) => {
                scene.els.svg
                    .transition().duration(settings.animation.sceneDuration)
                    .call(
                        scene.methods.zoom.transform,
                        d3.zoomIdentity.translate(settings.svgDims.width / 2, settings.svgDims.height / 2)
                            .scale(scale)
                            .translate(-x, -y)
                    )    
            }; // end setZoom();
            
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
        // scene.els.svgLegend.style('opacity', 0)

    }; // end renderVis()




///////////////////////////////
/////   HELPER METHODS    /////
///////////////////////////////

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