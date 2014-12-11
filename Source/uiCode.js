var hmm, cy;

var probs, graphHeight, graphWidth, numOfStates;
var numOfObservations = 2;
var defaultNumberOfStates = 2;
var autoMode = true;
var currentCol = -1;
var animating = false;

$(function(){ // on dom ready
  hmm = cytoscape({
                 container: document.getElementById('hmm'),
                 
                 style: cytoscape.stylesheet()
                 .selector('node')
                 .css({
                      'content': 'data(id)',
                      'border-color': 'black',
                      'font-size' : 8,
                      'width': 30,
                      'height':30,
                      'text-valign': 'center',
                      'text-halign': 'center'
                      })
                 .selector('edge')
                 .css({
                      'target-arrow-shape': 'triangle',
                      'width': 2,
                      'line-color': '#ddd',
                      'target-arrow-color': '#ddd',
                      'line-color': 'data(color)',
                      'target-arrow-color': 'data(color)'
                      })
                 .selector(':selected')
                 .css({
                      'background-color': '#61bffc',
                      'line-color': '#61bffc',
                      'target-arrow-color': '#61bffc',
                      'transition-property': 'background-color, line-color, target-arrow-color',
                      'transition-duration': '0.5s'
                      }),
                 
                 layout: {
                 name: 'preset',
                 directed: true,
                 roots: '#a',
                 padding: 10
                 },
                 userPanningEnabled: true
                 });

  cy = cytoscape({
                     container: document.getElementById('cy'),
                     
                    style: cytoscape.stylesheet()
                     .selector('node')
                     .css({
                          'content': 'data(id)',
                          'font-size' : 8,
                          'width': 30,
                          'height':30,
                          'text-valign': 'center',
                          'text-halign': 'center'
                          })
                     .selector('edge')
                     .css({
                          'target-arrow-shape': 'triangle',
                          'width': 2,
                          'line-color': '#ddd',
                          'target-arrow-color': '#ddd'
                          })
                     .selector('.highlighted')
                     .css({
                          'background-color': '#61bffc',
                          'width': 'mapData(weight, 0, 30, 1, 30)',
                          'line-color': '#61bffc',
                          'target-arrow-color': '#61bffc',
                          'transition-property': 'background-color, line-color, target-arrow-color',
                          'transition-duration': '0.5s'
                          })
                     .selector('.highlighted-node')
                     .css({
                          'content': 'data(weight)',
                          'background-color': '#61bffc',
                          'width': 'mapData(weight, 0, 1, 30, 50)',
                          'height': 'mapData(weight, 0, 1, 30, 50)',
                          'line-color': '#61bffc',
                          'target-arrow-color': '#61bffc',
                          'transition-property': 'background-color, line-color, target-arrow-color',
                          'transition-duration': '0.5s'
                          })
                     .selector('.highlighted-edge')
                     .css({
                          'background-color': '#61bffc',
                          'width': 'mapData(weight, 0, 30, 1, 30)',
                          'line-color': '#61bffc',
                          'target-arrow-color': '#61bffc',
                          'transition-property': 'background-color, line-color, target-arrow-color',
                          'transition-duration': '0.5s'
                          }),
                 
                     layout: {
                        name: 'preset',
                        directed: true,
                        roots: '#a',
                        padding: 10
                     },
                     userPanningEnabled: true
            });
  
  document.getElementById("numberOfStatesInput").value = defaultNumberOfStates;
  numOfStates = defaultNumberOfStates;
  setOriginalState(numOfStates);
  
}); // on dom ready

function initUIElements(){
    autoMode = document.getElementById("autoModeCheckBox").value;
    document.getElementById("numberOfStatesInput").value = defaultNumberOfStates;
    numOfStates = defaultNumberOfStates;
    setOriginalState(numOfStates);
}

function setOriginalState(numberOfStates){
    cy.nodes().removeClass('highlighted-node');
    cy.edges().removeClass('highlighted-edge');
    
    animating = false;
    
    currentCol = -1;
    setNavButtonStatus();
    
    probs = GetObservationProbabilities(numOfStates);
    graphWidth = math.size(probs).subset(math.index(1));
    
    AddNodes(probs, numOfStates, graphWidth);
    AddEdges();
    
    InitHMM();
    
    cy.fit();
    hmm.fit();
}

function AddNodes(probs,height, width){
    
    xi = 200;
    yi = 200;
    
    for(i=0;i<width;i++){
        for(j=0;j<height;j++){
            cy.add({
                   group: "nodes",
                   data: { id:  'S' + j + 'T' + i , weight: probs.subset(math.index(j,i)), row: j , column: i },
                   position: { x: xi + i*100, y: yi + j*100 }
                   });
        }
    }
}

function AddEdges(){
    for(i=0;i<numOfObservations;i++){
        var sourceNodes = cy.elements("node[column =" + i + "]");
        var nextCol = i + 1;
        var destNodes = cy.elements("node[column = " + nextCol + "]");
        
        for(j=0; j < sourceNodes.length; j++){
            for(k=0; k < destNodes.length; k++){
                cy.add({
                       group: "edges",
                       data: { id: '' + sourceNodes[j].data().id + '' + destNodes[k].data().id , weight: 1, source: sourceNodes[j].data().id , target: destNodes[k].data().id }
                       });
            }
        }
    }
}

function InitHMM(){
    for(i=0;i<numOfStates;i++){
        hmm.add({
               group: "nodes",
               data: { id:  'S' + i , weight: 1, row: 0 , column: i },
               position: { x: 100 + i*100, y: 100 }
               });
    }
    
    hmm.nodes().forEach(function( node, i , nodes){
            hmm.nodes().forEach(function( node2 ){
                                hmm.add({
                                    group: "edges",
                                        data: { id: '' + node.data().id + '' + node2.data().id , weight: 1, source: node.data().id , target: node2.data().id, color: getRandomColor()}
                                    });
                            });
                      });
}

function StartAnnimating(){
    setOriginalState(numOfStates);
    var i = 0;
    animating = true;
    
    var highlightColumnAuto = function(){
        if(!animating)
            return;
        currentCol = i;
        highlightColumn(i);
        
        if( i < numOfObservations && animating ){
            i++;
            setTimeout(highlightColumnAuto, 1000);
        }else{
            //Animation is done
            //Change button name to restart
            animating = false;
        }
        
        
    }
    
    highlightColumnAuto();
    
}

function highlightColumn(col){
    var edges;
    var nodes = cy.elements("node[column =" + col + "]");
    nodes.addClass('highlighted-node');
    
    if(col > 0){
        nodes.forEach(function( node ){
                      edges = cy.edges("[target = '" + node.data().id + "']");
                      edges.addClass('highlighted-edge');
                      });
    }
}

function disHighlightColumn(col){
    var edges;
    var nodes = cy.elements("node[column =" + col + "]");
    nodes.removeClass('highlighted-node');
    
    if(col > 0){
        nodes.forEach(function( node ){
                      edges = cy.edges("[target = '" + node.data().id + "']");
                      edges.removeClass('highlighted-edge');
                      });
    }
}

/************UI EVENT HANDLERS***********/

function EvaluateButtonPressed(){
    if(autoMode){
        StartAnnimating();
    }else{
        setOriginalState(numOfStates);
    }
}

function numberOfStatesChanged(){
    //TODO: Validate if number and max limit
    
    //Clear all elementes
    cy.remove(cy.elements());
    hmm.remove(hmm.elements());
    numOfStates = document.getElementById("numberOfStatesInput").value;
    setOriginalState(numOfStates);
}

function autoModeChanged(){
    autoMode = document.getElementById("autoModeCheckBox").checked;
    
    setNavButtonStatus();
}

function backButtonClicked(){
    //Clear selection for previous row
    if(currentCol >= 0){
        disHighlightColumn(currentCol--);
    }
    
    setNavButtonStatus();
}

function nextButtonClicked(){
    if(currentCol < numOfObservations){
        highlightColumn(++currentCol);
    }
    
    setNavButtonStatus();
}

function setNavButtonStatus(){
    //Enable and disable navigation buttons
    if(autoMode){
        document.getElementById("backNavButton").className = "disabled";
        document.getElementById("forwardNavButton").className = "disabled";
    }else{
        document.getElementById("backNavButton").className = "active";
        document.getElementById("forwardNavButton").className = "active";
    }
    
    if(currentCol >= numOfObservations){
        document.getElementById("forwardNavButton").className = "disabled";
    }
    else if(currentCol < 0){
        document.getElementById("backNavButton").className = "disabled";
    }else{
        document.getElementById("backNavButton").className = "active";
        document.getElementById("forwardNavButton").className = "active";
    }
}

/************HELPER METHODS**************/

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function GetObservationProbabilities(numOfStates){
    switch(numOfStates) {
        case 2:
            return math.matrix([
                                [1.0, 0.48, 0.23],
                                [0.0, 0.12, 0.09]
                                ]);
            break;
        case 3:
            return math.matrix([
                                [1.0, 0.48, 0.23],
                                [1.0, 0.33, 0.29],
                                [0.0, 0.12, 0.09]
                                ]);
            break;
        case 4:
            return math.matrix([
                                [1.0, 0.48, 0.23],
                                [1.0, 0.33, 0.29],
                                [1.0, 0.38, 0.40],
                                [0.0, 0.12, 0.09]
                                ]);
            break;
        default:
            return math.matrix([
                                [1.0, 0.48, 0.23],
                                [1.0, 0.33, 0.29],
                                [1.0, 0.38, 0.40],
                                [1.0, 0.60, 0.06],
                                [0.0, 0.12, 0.09]
                                ]);
            break;
    }
}



