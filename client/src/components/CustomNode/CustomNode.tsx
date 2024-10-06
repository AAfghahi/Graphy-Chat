import React, {useState, useEffect, useCallback} from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Autocomplete,
    TextField,
    Typography,
    Button,
    AccordionActions,
    CircularProgress,
    IconButton,
    Tooltip, 
} from '@mui/material';
import {Model} from '../../pages/GraphyChatPage';
import { useInsight } from '@semoss/sdk-react';
import { useForm, Controller } from 'react-hook-form';
import { Handle, Position, NodeResizer, useReactFlow, NodeToolbar} from '@xyflow/react';
import {ExpandMore, SettingsOutlined, DeleteOutline, AddRounded, ContentCopyRounded, ClearOutlined, CheckCircleOutline, KeyboardArrowUp, KeyboardArrowDown} from '@mui/icons-material';
import Markdown from 'markdown-to-jsx';

const styledHandler= {
    width:"10px",
    height:"10px",
    marginLeft: "-8px",
    marginRight: '-8px',
    zIndex:"3",
    background:"transparent",
    border: "1px solid"
}

export const CustomNode = ({
    id,
    data
}) => {
    const { actions } = useInsight();
    const [expand, setExpand] = useState<boolean>(true)
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("")
    const [isAnswered, setIsAnswered] = useState<boolean>(false)
    const [answer, setAnswer] = useState<string>(data.answer)
    const {deleteElements} = useReactFlow();
    const [isCopied, setIsCopied] = useState<boolean>(false)
    const [isResponseCopied, setIsResponseCopied] = useState<boolean>(false)

    const onDelete = useCallback(() => {
        deleteElements({nodes: [{id}]})
    }, [id, deleteElements])


    useEffect(()=> {
        data.answer = answer
    }, [answer])

    const { control, handleSubmit, setValue, getValues } = useForm({
                defaultValues: {
                    QUESTION: '',
                },
            })

    const askQuestion = async(question: string) => {
        // turn on loading
        setError('');
        setIsLoading(true);
        setIsAnswered(false);
        let pixel = '';

        try {
            if (!question) {
                throw new Error('Question is required');
            }

                pixel = `
            LLM(engine="${
                (selectedModel as Model).database_id
            }" , command="<encode>${question}</encode>")`;

            const LLMresponse = await actions.run<[{ response: string }]>(
                pixel,
            );

            const { output: LLMOutput, operationType: LLMOperationType } =
                LLMresponse.pixelReturn[0];

            if (LLMOperationType.indexOf('ERROR') > -1) {
                throw new Error(LLMOutput.response);
            }

            let conclusion = '';
            if (LLMOutput.response) {
                conclusion = LLMOutput.response;
            }
            // set answer based on data
            setAnswer(conclusion);  
                            

        setIsAnswered(true);
        } catch (e) {
            if (e) {
                setError(e);
            } else {
                setError('There is an error, please check pixel calls');
            }
        } finally {
            setIsLoading(false);
        }
    } 

    const ask = handleSubmit(async (data: { QUESTION: string }) => {
        askQuestion(data.QUESTION)
    });
    
    useEffect(()=> {
        if (data.modelOptions.length > 0){
            setSelectedModel(data.modelOptions[0])
        }

        if(data.question){
            setValue("QUESTION", data.question)
        }

        if(data.question && selectedModel){
            askQuestion(data.question)
        }
    }, [data])

    

    return (
        <div style={{boxSizing: "border-box", minWidth:"448px"}}>
            <Handle
                type="target"
                position={Position.Left}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                style={styledHandler}
            />
            <Accordion expanded={expand} sx={{borderRadius:"12px"}}>
                {!expand ? (
                    <AccordionSummary sx={{padding:"0px"}}>
                        <div style={{display: 'flex', alignItems: 'center', flexDirection:'row'}}>
                            <IconButton onClick={() => setExpand(true)}>
                            <KeyboardArrowDown/>
                            </IconButton>
                            <Typography>
                                {getValues("QUESTION") ? getValues("QUESTION") : 'No Question Written'}
                            </Typography>
                            <Tooltip title="Delete this node">
                                <IconButton size="small" onClick={onDelete}>
                                    <DeleteOutline color="secondary" />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </AccordionSummary>
                ) :
                <AccordionDetails sx={{padding:"8px 0px", userSelect:'text'}}>
                    <div style={{display:'flex', flexDirection: 'column', width:"100%"}}>
                        <div style={{display:'flex', flexDirection: 'row', width:"100%"}}>
                            <IconButton onClick={() => setExpand(!expand)}>
                                <KeyboardArrowUp />
                            </IconButton>
                            <Autocomplete
                                options={data.modelOptions}
                                value={selectedModel}
                                placeholder="Choose a Model"
                                getOptionLabel={(option: Model) =>
                                    option.database_name || ''
                                }
                                onChange={(event, newModel) =>
                                    setSelectedModel(newModel)
                                }
                                renderInput={(params) => (
                                    <TextField {...params} variant="standard" InputProps={{...params.InputProps, disableUnderline:true}}/>
                                )}
                                fullWidth
                            />
                            {/* <IconButton>
                                <SettingsOutlined color="secondary" />
                            </IconButton> */}
                            <Tooltip title="Delete this node">
                                <IconButton size="small" onClick={onDelete}>
                                    <DeleteOutline sx={{color:"rgba(189, 189, 189, 1)"}}/>
                                </IconButton>
                            </Tooltip>
                        </div>
                        {/* <MoreVertOutlined color='secondary' /> */}
                        <div style={{display:'flex', flexDirection:'row', background:"rgba(250, 250, 250, 1)", alignItems:'center', justifyContent:'space-between', padding:"0px 16px"}}>
                            <div>
                                <Typography sx={{background: "rgba(250, 250, 250, 1)", marginRight:'10px', color:"rgba(102, 102, 102, 1)"}} variant="caption" color={"secondary"}>
                                    Input
                                </Typography>
                                {isLoading && <CircularProgress size={18} />} 
                            </div>
                            <div>
                                <Tooltip title="Copy your question">
                                    <IconButton size="small" onClick={() => {
                                        navigator.clipboard.writeText(getValues("QUESTION"))
                                        setIsCopied(true)
                                        setTimeout(() => setIsCopied(false), 1500);
                                        }}>
                                        {isCopied ?
                                            <CheckCircleOutline fontSize='small' color="primary" />
                                            :
                                            <ContentCopyRounded fontSize='small' />
                                        }
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Clear your question">
                                    <IconButton size="small" onClick={() => setValue("QUESTION", "")}>
                                        <ClearOutlined fontSize='small' />
                                    </IconButton>

                                </Tooltip>
                            </div>
                        </div>
                        <Controller
                            name={'QUESTION'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                                return (
                                        <TextField
                                            autoComplete="off"
                                            placeholder={
                                                isAnswered
                                                    ? 'Ask a new question'
                                                    : 'Ask a question here'
                                            }
                                            variant="standard"
                                            fullWidth
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    ask();
                                                }
                                            }}
                                            value={field.value ? field.value : ''}
                                            onChange={(e) =>
                                                // set the value
                                                field.onChange(e.target.value)
                                            }
                                            InputProps={{disableUnderline: true}}
                                            sx={{ padding: '8px 16px'}}
                                            multiline
                                            disabled={isLoading}
                                            className= "nodrag"
                                        />
                                );
                            }}
                        />
                    <div style={{display: "flex", justifyContent: 'flex-end'}}>                        
                        <Button
                            variant={'outlined'}
                            color="primary"
                            size='small'
                            onClick={() => ask()}
                            disabled={isLoading}
                            sx={{marginRight:'10px', marginBottom:'5px'}}
                        >
                            Ask
                        </Button>
                    </div>

                    </div>

                    <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between', background:"rgba(250, 250, 250, 1)", alignItems: 'center', padding:"0px 16px"}}>
                        <Typography variant="caption" sx={{background: "rgba(250, 250, 250, 1)", color:"rgba(102, 102, 102, 1)"}} color={"secondary"}>
                            Response
                        </Typography>
                        <div>
                            <Tooltip title="Copy the full response">
                                <IconButton size="small" onClick={() =>{ 
                                    navigator.clipboard.writeText(answer)
                                    setIsResponseCopied(true)
                                    setTimeout(() => setIsResponseCopied(false), 1500);
                                    }}>
                                    {isResponseCopied ?
                                        <CheckCircleOutline fontSize='small' color="primary" />
                                        :
                                        <ContentCopyRounded fontSize='small' />
                                    }
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Clear response">
                                <IconButton size="small" onClick={() => setAnswer("")}>
                                    <ClearOutlined fontSize='small' />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </div>
                        <Markdown className='nodrag' style={{cursor:"text", padding:"16px", maxHeight:'600px', overflowY:'scroll'}}>
                            {answer}
                        </Markdown>
                </AccordionDetails>

                }
                
            </Accordion>
            <NodeToolbar isVisible position={Position.Right} align={"start"} offset={5} style={{top:"35px"}}>
                <Tooltip title="Create a Node connected to this one">
                    <IconButton size="small" onClick={() => data.addNewNode(id)}>
                        <AddRounded />
                    </IconButton>
                </Tooltip>
            </NodeToolbar>
            <NodeResizer color="transparent" minWidth={450}/> 
            <Handle
                type="source"
                position={Position.Right}
                style={styledHandler}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
            />
        </div>
    );
}
