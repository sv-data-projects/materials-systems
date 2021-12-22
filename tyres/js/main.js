//////////////////////////////////////////////
///// MATERIALS SYSTEMS VISUALISTAION   //////
//////////////////////////////////////////////



// INITIALISE SETTINGS AND DATA OBJECTS

const settings = {           // Visualisation settings
    material:  'Tyres',
    svgID:  'tyres-system',
    layout: {                // Object to store default layout options (updated if settings are sent via query string)
        dynamicLabels:  true, 
        applyCSS:       true 
       
    }
}

const data = {}        





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
            await applyQuerySettings(settings)                                               // a. Apply query string settings
            await transformData(data[settings.material].nodes, data[settings.material].links, data[settings.material].scenes)    // b. Parse data
            // await renderVis(data.byType.material, settings)                                 // c. Render visualisation(s)
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


// II. 
async function applyQuerySettings(settings){

};

// III. Data transformation for nodes, links and scene
async function transformData(nodeData, linkData, sceneData){
    // 1. Node Data 
    console.log(nodeData)
    for (const node of nodeData){
        const nodeGroup = d3.select(`#node-group_${node.nodeID}`),
            nodeBox = d3.select(`#node-box_${node.nodeID}`)

        nodeGroup.attr('class', `node ${node.classList}`)
        nodeBox.classed('node-box', true)

        if(settings.layout.applyCSS){
            ["fill", "stroke", "stroke-width"].forEach(attr => document.getElementById(`node-box_${node.nodeID}`).removeAttribute(attr) )
            const nodeBBox = document.getElementById(`node-box_${node.nodeID}`).getBBox()

            d3.select(`#node-label_${node.nodeID}`).remove()
            nodeGroup.append('text').classed('node-label', true)
                .attr('x', nodeBBox.x + nodeBBox.width * 0.5)
                .attr('y', nodeBBox.y + nodeBBox.height * 0.5)
                .attr('dy', 0)
                .text(node.label)
                .call(helpers.wrap, nodeBBox.width * 0.85, 1.1, true)
        }

    }

    // 2. Link Data 
    for (const link of linkData){
        // a. Find and add link group name
        const groupID = link.linkID.indexOf('_') < 0 ? link.linkID : link.linkID.slice(0, link.linkID.indexOf('_') )
        link.group = `link-group_${groupID}`


        // b. Add class styling for  link labels
        d3.select(`#flow-label_${groupID}`).classed('link-label', true)

        // c. Remove inline attributes and control styling via CSS
        d3.selectAll(`#flow-label_${groupID} text`)
            .classed('link-label', true)
            .attr('font-family', null)
            .attr('font-size', null)
            .attr('font-weight', null)

        switch(link.linkTypeClass){
            case 'flow-shape':
                d3.select(`#flow-shape_${link.linkID}`)
                    .attr('class', `link ${link.linkTypeClass} ${link.linkShapeClass} ${link.systemClass}`)
                    .attr('fill', null)
                    .data(link)
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
                    .data(link)
                d3.select(`#arrowhead_${link.linkID}`)
                    .attr('class', `arrowhead ${link.linkTypeClass} ${link.linkShapeClass}  ${link.systemClass}`)
                    .attr('fill', null)

                break

            default:
                console.log('Unknown link type:')
                console.log(link.linkID)
        }


    }

    // 3. Add Node and link interactivity
    d3.selectAll('.link-group')
        .on('mouseover', function(){
            d3.selectAll(`.link-group:not(#${this.id}), .link-group.line, .node`)
                .style('opacity', 0.15)
        })

    d3.selectAll('.link-group.line')
        .on('mouseover', function(){
            d3.selectAll(`.link-group.line:not(#${this.id}), .link-group.flow-shape, .node`)
                .style('opacity', 0.15)
        })



    // Node interactivity
    d3.selectAll('.node')
        .on('mouseover', function(){
            d3.selectAll(`.node:not(#${this.id}), .flow-shape, .link-group.line`)
                .style('opacity', 0.15)
        })

    d3.selectAll('.node, .link-group')
        .on('mouseout', () => {
            d3.selectAll(`.flow-shape, .link-group.line, .node`)
                .style('opacity', null)
        })



};





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