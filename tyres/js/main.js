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
        applyCSS:       true 
    },
    lists: {
        sceneIDs:       ''  // Scene IDs added on load of scene data
    }, 
    animation: {
        sceneDuration:  1200,
        fadeOpacity:    0.15,
    }
}

const data = {}         // Object to store loaded/parsed data
const scene = {}        // Object to store scene data methods
const state = {         // Object to store application state
    scene:      ''          // SceneID set on load
}

// I.  VISUALISATION BUILD FUNCTION  
buildFromGSheetData(settings)       // Called on load

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
        await getSVGDims()    // b. Parse data
        await setupNodeLinkComponents(data[settings.material].nodes, data[settings.material].links)    // b. Parse data
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


// II. Apply user options
async function applyUserQuerySettings(settings){
    console.log('Applying query string to vis settings...')
}; // end applyUserQuerySettings()


// III. Extract SVG dimensions (for zoom and pan behaviour)
async function getSVGDims(){
    const viewBoxArray = JSON.parse(`[${d3.select(`#${settings.svgID}`).attr('viewBox').replaceAll(' ', ',')}]`)
    settings.svgDims.xMin = viewBoxArray[0]
    settings.svgDims.yMin = viewBoxArray[1]
    settings.svgDims.width = viewBoxArray[2]
    settings.svgDims.height = viewBoxArray[3]

}; // end getSVGDims()

// IV. Setup node and link visual components (from SVG input imported into index.html)
async function setupNodeLinkComponents(nodeData, linkData){
    console.log('Setting up node and link interactivity')
    // 1. Nodes: setup node groups. boxes and labels 
    for (const node of nodeData){
        const nodeGroup = d3.select(`#node-group_${node.nodeID}`),
            nodeBox = d3.select(`#node-box_${node.nodeID}`), 
            nodeBBox = document.getElementById(`node-box_${node.nodeID}`).getBBox()

        // a. Add node group and box classes
        nodeGroup.attr('class', `node ${node.classList}`)
        nodeBox.classed('node-box', true)

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
    }

    // 2. Links: setup link groups and lines/arrowheads/shapes  
    for (const link of linkData){
        // a. Find and add link group name to link data object
        const groupID = link.linkID.indexOf('_') < 0 ? link.linkID : link.linkID.slice(0, link.linkID.indexOf('_') )
        link.group = `link-group_${groupID}`

        // b. Bind data: manually attach data to the link/flow group (for accessing on link or label hover)
        d3.select(`#flow-group_${groupID}`)
            .classed('label-group', true)
            .data([link])

        // c. Link label (group) => remove inline styling (on text elements) and add classes to control styling via CSS 
        d3.selectAll(`#flow-label_${groupID}, #flow-label_${groupID} text`)
            .classed('link-label', true)
            .attr('font-family', null)
            .attr('font-size', null)
            .attr('font-weight', null)

        // d. Link shapes: and lines/arrows => remove inline styling and add classes to control styling via CSS 
        switch(link.linkTypeClass){
            case 'flow-shape':
                d3.select(`#flow-shape_${link.linkID}`)
                    .attr('class', `link ${link.linkTypeClass} ${link.linkShapeClass} ${link.systemClass}`)
                    .attr('fill', null)
                d3.select(`#flow-group_${groupID}`)
                    .attr('class', `link-group ${link.linkTypeClass}`)                    
                break

            case 'line':
                d3.select(`#flow-group_${groupID} `)
                    .attr('class', `link-group ${link.linkTypeClass} ${link.linkShapeClass}  ${link.systemClass}`)

                d3.select(`#line_${link.linkID}`)
                    .attr('class', `link ${link.linkTypeClass} ${link.linkShapeClass}  ${link.systemClass}`)
                    .attr('fill', null)
                    .attr('stroke', null)
                    .attr('stroke-dasharray', null)
                    .attr('stroke-linejoin', null)
                    .attr('stroke-miterlimit', null)

                d3.select(`#arrowhead_${link.linkID}`)
                    .attr('class', `arrowhead ${link.linkTypeClass} ${link.linkShapeClass}  ${link.systemClass}`)
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
                // Highlight selection
                if( this.classList.contains('line')){
                    d3.selectAll(`.link-group.line:not(#${this.id}), .link-group.flow-shape, .node`)
                        .style('opacity', settings.animation.fadeOpacity)
                } else {
                    d3.selectAll(`.link-group:not(#${this.id}), .link-group.line, .node`)
                        .style('opacity', settings.animation.fadeOpacity)
                }
                // ???
            })

        // b. Node interactivity
        d3.selectAll('.node')
            .on('mouseover', function(){
                // Highlight node
                d3.selectAll(`.node:not(#${this.id}), .flow-shape, .link-group.line`)
                    .style('opacity', settings.animation.fadeOpacity)

                // ???
            })

        // c. Node + link (shared) interactivity
        d3.selectAll('.node, .link-group')
            .on('mouseout', () => {
                // Reset visibility
                d3.selectAll(`.flow-shape, .link-group.line, .node`)
                    .style('opacity', null)
            })
}; // end setupNodeLinkComponents()


// V. Add and setup narrative scenes
async function setupScenes(sceneData){
   
    console.log('Setting up scenes...')

    // 1. Extract scene data
    settings.lists.sceneIDs = sceneData.map(d => d['scene-id'])
    state.scene = settings.lists.sceneIDs[0]

    // 2. Add scene navigation (temporary list)
    const navContainer = d3.select('.navigation-container'),
        navList = navContainer.append('ul')

    navList.selectAll('.nav-item')
        .data(sceneData)
        .join('li')      
            .attr('id', d => `nav-item-${d['scene-id']}`)
            .classed('nav-item', true)
            .html(d => d['scene-title'])

    // 3. Add scene nav interactivity
    d3.selectAll('.nav-item')  
        .on('click', function(){
            d3.selectAll('.nav-item').classed('selected', false)
            d3.select(this).classed('selected', true)
            const sceneDatum = this.__data__
            // Update title and narrative
            updateNarrative(sceneDatum)

            // Update visible components

            // Update zoom and pan
            console.log(sceneDatum)
            const panX = sceneDatum.panX * settings.svgDims.width,
                panY = sceneDatum.panY * settings.svgDims.height
            scene.methods.setZoom(panX, panY, sceneDatum.zoomScale)
        })


        // X. Helper functions  
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
        }; // updateNarrative

    // 4. Set initial scene
    updateNarrative(document.getElementById(`nav-item-${state.scene}`).__data__)
    d3.select(`#nav-item-${state.scene}`).classed('selected', true)



    // 4. Setup Zoom and pan behaviour
        // a. Add methods for controlling zoom and pan
        scene.methods = {
            handleZoom: (e) => {
                d3.select('g.zoom-area')
                    .attr('transform', e.transform);
            }, // end handleZoom

            resetZoom(){
                const svg = d3.select(`#${settings.svgID}`)
                svg
                    .transition().duration(settings.animation.sceneDuration)
                    .call(
                        scene.methods.zoom.transform, 
                        d3.zoomIdentity,
                        d3.zoomTransform(svg.node()).invert([settings.svgDims.width / 2, settings.svgDims.height / 2])
                    )           
            },

            setZoom(x, y, scale){
                console.log('Zoom to:', x, y, scale)
                d3.select(`#${settings.svgID}`)
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
            .scaleExtent([1, 3])
            .translateExtent([
                [-settings.svgDims.width * 0.0, -settings.svgDims.height * 0.0], 
                [settings.svgDims.width * 1.0, settings.svgDims.height * 1.0]
            ])
            .on('zoom', scene.methods.handleZoom);

        d3.select(`#${settings.svgID}`)
            .call(scene.methods.zoom) 


}; // end setupScenes()




// V. Start vis
async function revealVis(){
    // on load reveal
    d3.select(`.vis-pane`)
        .transition().duration(settings.animation.sceneDuration)
        .style('opacity', null)
}; // end renderVis()




// X. HELPER METHODS
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