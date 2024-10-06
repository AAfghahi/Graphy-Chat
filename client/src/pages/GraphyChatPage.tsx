import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useInsight } from '@semoss/sdk-react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  addEdge,
  Panel,
  useReactFlow,
  NodeOrigin,
  ControlButton,
} from '@xyflow/react';
import {Paper, Button, Typography, IconButton, Tooltip, Menu, MenuItem} from '@mui/material'
import {Add, ArrowForwardRounded, LibraryBooksOutlined} from '@mui/icons-material';
import {CustomNode} from '../components/CustomNode'
import '@xyflow/react/dist/style.css';


export interface Model {
    database_name?: string;
    database_id?: string;
}

interface Answer {
    question: string;
    conclusion: string;
    LLM: string;
    vectorCatalogs: string;
}

const nodeTypes = {
  chatNode: CustomNode,
};

const initialNodes = [
  { id: '0', type:'chatNode', position: { x: 50, y: 50 }, data:{modelOptions:[], answer:'', active: false}, measured:{height: 307, width: 400}},
];

let id = 1

const getId = () => `${id++}`

export const GraphyChatPage =() => {
  const reactFlowWrapper = useRef(null);
  const nodeOrigin = [0.0, 0.0] as NodeOrigin;
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { actions } = useInsight();
  const { screenToFlowPosition, setCenter } = useReactFlow()
  const [activeText, setActiveText] = useState<string | null>(null)
  const [activeNode, setActiveNode] = useState<Record<string, any> | null>(null)
  const [position, setPosition] = useState<Record<string, number> | null>(null)

  // Model Catalog and first model in dropdown
  const [modelOptions, setModelOptions] = useState([]);
  


  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const onSelectStart = () => {
    setActiveText(null);
    handleClose()
  }

  const handleNodesChange = (changes) => {
    console.log(changes)
    setNodes(applyNodeChanges(changes,nodes))

    changes.forEach((change) => {
      if(change.type === 'position'){
        onSelectEnd()
      }
    })
  }

  const onSelectEnd = useCallback(() => {
    const activeSelection = document.getSelection();
    //look at using a higher z index and the x.y coordinates seen here. 
    const text = activeSelection?.toString();

    if ( !activeSelection || !text ) {
      setActiveText(null);
      setActiveNode(null)
      return;
    };


    const rect = activeSelection.getRangeAt(0).getBoundingClientRect()
    setPosition({
      // 80 represents the width of the share button, this may differ for you
      x: rect.left,
      // 30 represents the height of the share button, this may differ for you
      y: rect.top + window.scrollY - 50,
      width: rect.width,
      height: rect.height,
    })
    setActiveText(text);
  }, [handleNodesChange])



  //listening to a selection 
  useEffect(() => {
    document.addEventListener('selectstart', onSelectStart);
    document.addEventListener('mouseup', onSelectEnd);
    //Grabbing all the Models that are in CfGov
    init()
    return () => {
      document.removeEventListener('selectstart', onSelectStart);
      document.removeEventListener('mouseup', onSelectEnd);
      
    }
  }, []);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        return {
          ...node,
          data: {
            ...node.data,
            modelOptions: modelOptions,
            addNewNode: addNewNode,
            createNewNode: createNewNode
          }
        };
      }),
    );

  }, [modelOptions, nodes.length])

  const init = async() =>{
    let pixel = ` MyEngines ( metaKeys = [] , metaFilters = [{ "tag" : "text-generation" }] , engineTypes = [ 'MODEL' ] )`;

    await actions.run(pixel).then((response) => {
        const { output, operationType } = response.pixelReturn[0];

        if (operationType.indexOf('ERROR') > -1) {
            throw new Error(output as string);
        }
        if (Array.isArray(output)) {
            setModelOptions(output);
        }
    });
  } 

 
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const findNode = (nodes: Record<string,any>[], sentence) => {
    //Run the result through a regex and then search for the sentence
    const result = nodes.filter((node) => node.data.answer.replace(/[`*#`]/g,'').includes(sentence))

    return result[0]
  }

  const findNearestPosition =(nodes: Record<string, any>[], targetNode) => {
    //baseline x position in relationship to the Node we want it connected to
    const xPosition = targetNode.position["x"] + targetNode.measured["width"] + 200
    let yPosition = targetNode.position["y"]

    //going through the list of nodes to account for x position and see if there are any overlapping nodes
    const blockingX = nodes.filter((node) => 
      node.position["x"] <= xPosition + 450 || node.position["x"] >= xPosition
    )

    //if no nodes exist then we create a baseline node
    if(blockingX.length < 1){
      return {x: xPosition, y: yPosition}
    }

    // otherwise we go through the list of block xs and find the lowest Y value 
    blockingX.map((node) => {
      const nodePosition = node.position["y"] + node.measured["height"]
      if( nodePosition > yPosition){
        yPosition = nodePosition
      }
    })
    return {x: xPosition, y: yPosition}
  }

  const createNewNode = useCallback((additionalContext="") => {
    const nextID = getId()
    const highlightedNode = findNode(nodes, activeText)
    const position = findNearestPosition(nodes, highlightedNode)
    const newNode = {
      id:nextID,
      position: position,
      type: 'chatNode',
      data: {modelOptions:modelOptions, question: additionalContext + activeText, label: '1', answer:'', active:false },
      measured:{height: 307, width: 400},
    };

    setNodes((nds) => {
      return [...nds, newNode]
    });        
    setEdges((eds) =>
      eds.concat({ id:nextID, source: highlightedNode.id, target: nextID }),
    );
    setActiveText(null)
    const zoom = .75
    setCenter(position.x + 100, position.y + 100, { zoom, duration: 1000 });

  }, [nodes, activeText])


  const addNewNode = useCallback((id) => {
    const nextID = getId()
    const connectingNode = nodes.filter((node) => node.id === id)
    const position = findNearestPosition(nodes, connectingNode[0])
    const newNode = {
      id: nextID,
      position: position,
      type: 'chatNode',
      data: {modelOptions:modelOptions, answer:'', active:false},
      measured:{height: 307, width: 400},
    }
    setNodes((nds) => {
      return [...nds, newNode]
    });        
    setEdges((eds) =>
      eds.concat({ id:nextID, source: id, target: nextID }),
    );
    const zoom = 1
    setCenter(position.x, position.y, { zoom, duration: 1000 });
  }, [nodes])

  const createNewCell = useCallback(() => {
    const nextID = getId()
    const position = findNearestPosition(nodes, nodes[0])
    const newNode = {
      id: nextID,
      position: position,
      type: 'chatNode',
      data: {modelOptions:modelOptions, answer:'', active: false },
      measured:{height: 307, width: 400},
    }

    setNodes((nds) => {
      return [...nds, newNode]
    });        
    const zoom = 1
    setCenter(position.x, position.y , { zoom, duration: 1000 });
  }, [nodes])

  const onConnectEnd = useCallback(
    (event, connectionState) => {
      // when a connection is dropped on the pane it's not valid
      if (!connectionState.isValid) {
        // we need to remove the wrapper bounds, in order to get the correct position

        //grabbing the last node, then adding 1 to the id for the new node being created. 
        const nextID = getId()
        
        const { clientX, clientY } =
          'changedTouches' in event ? event.changedTouches[0] : event;
        const newNode = {
          id:nextID,
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          type: 'chatNode',
          data: {modelOptions:modelOptions, answer:'', active: false},
          origin: [0.5, 0.0],
          measured:{height: 307, width: 400}
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) =>
          eds.concat({ id:nextID, source: connectionState.fromNode.id, target: nextID }),
        );
      }
    },
    [screenToFlowPosition],
  );
 
  return (
    <div style={{ minHeight: '30vh', flexGrow:'1' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        proOptions={{hideAttribution: true}}
        nodeOrigin={nodeOrigin}
        onViewportChange={onSelectEnd}
      >
        
        <Controls orientation="horizontal">

        </Controls>
        <MiniMap
          onClick={(event, position)=> setCenter(position.x, position.y ,{ zoom:1 , duration: 1000 })}
        pannable zoomable />
        <Background
        id="1"
        gap={20}
        variant={BackgroundVariant.Dots}
      />
        <Panel position="bottom-center">
          <Paper square={false} sx={{display:'flex', flexDirection:'row', alignItems:"center"}}>


              <Button color="secondary" startIcon={<Add />} sx={{color: 'rgba(33, 33, 33, 1)'}} onClick={createNewCell}>
                New Cell
              </Button>
              <Typography variant="caption" sx={{marginTop:"3px", paddingRight:'5px'}}>
                {nodes.length}
              </Typography>
          </Paper>
        </Panel>
      {activeText && (
        <Paper square={false} sx={{display:'flex', flexDirection:'row', alignItems:"center", transform: `translate3d(${position.x}px, ${position.y}px, 0)`, zIndex:10000, position: 'absolute' }}>
          <Tooltip title="Create a Node connected to this one with the highlighted text">
            <IconButton onClick={()=> createNewNode()} color="primary" >
              <ArrowForwardRounded />
            </IconButton>
          </Tooltip>
          <Tooltip title="Amend your highlighted text">
            <IconButton onClick={handleClick}>
              <LibraryBooksOutlined />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={open} onClose={()=>handleClose()} onClick={handleClose}>
            <MenuItem onClick={() => {
              
              createNewNode("How do I get to ")
              handleClose()
            }}>How do I get here? </MenuItem>
            <MenuItem  onClick={() => {
              
              createNewNode("What is there to do  ")
              handleClose()
            }}>
              What is there to do here? 
            </MenuItem>
            <MenuItem onClick={() => {
              
              createNewNode("Tell me more about ")
              handleClose()  
            }}>
              Tell me more about this
            </MenuItem>
          </Menu>
        </Paper>)}
      </ReactFlow>
    </div>
  );
}