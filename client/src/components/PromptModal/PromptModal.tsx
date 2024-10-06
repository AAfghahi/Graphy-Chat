import React from 'react';
import {
    styled,
    Box,
    TextField,
    Typography,
    Button,
    Stack,
    Tooltip,
    Slider,
    ButtonGroup
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { saveAs } from "file-saver";
import { Packer } from "docx";
import { DocCreator } from "../DocCreator";
import {ExcelSheetCreator} from '../ExcelCreator';
import {convert} from "libreoffice-convert"


const StyledModal = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '30px',
    boxShadow: '24',
    p: '4',
    padding: theme.spacing(4),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    padding: `${theme.spacing(3)} 0px`,
    border: 'none',
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
    alignItems: 'center',
}));

const StyledButtonGroup = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(3),
}));

const StyledDownload = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    marginTop: theme.spacing(3),
}));

const StyledDiv = styled('div')(() => ({
    display: 'flex',
}));

const StyledButton = styled(Button)(({theme})=>({
    fontSize: "medium",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  }));

type Prompt = {
    PROMPT: string;
    CONTEXT: string;
    TEMPERATURE: number;
    LIMIT: number;
};

export const PromptModal = ({
    setOpen,
    prompt,
    setPrompt,
    questionContext,
    setQuestionContext,
    context,
    limit,
    setLimit,
    temperature,
    setTemperature,
    answerLog
}) => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            PROMPT: prompt,
            CONTEXT: questionContext,
            TEMPERATURE: temperature,
            LIMIT: limit,
        },
    });

    const limitTooltipText = `
    This will change the amount of documents pulled from 
    a vector database. Pulling too many documents can potentially cause your engines
    token limit to be exceeded!
    `;

    const temperatureTooltipText = `
    This changes the randomness of the LLM's output. 
    The higher the temperature the more creative and imaginative your
    answer will be.
    `;

    const promptText = `
    This changes the prompt that the LLM receives, changing this will affect the way the LLM approaches the question you have asked. 
    `;

    const contextText = `
    This changes the formatting of the response, changing this will affect the structure of your question's output.
    `;

    const changePrompt = handleSubmit((data: Prompt) => {
        if (context === 'refine') {
            setTemperature(data.TEMPERATURE);
            setLimit(data.LIMIT);
        } else {
            setPrompt(data.PROMPT);
            setQuestionContext(data.CONTEXT);
        }
        setOpen(false);
    });

    const generateDoc = () => {
        const documentCreator = new DocCreator();
        const doc = documentCreator.create(answerLog);
        Packer.toBlob(doc).then((blob) => {
            saveAs(blob, "generatedreport.docx");
            console.log("Document created successfully");
        });
    }

    const generateXLSX = async() => {
        const sheet = await ExcelSheetCreator(answerLog)
        const blob = new Blob([sheet], {type: 'application/xlsx'});
        saveAs(blob, 'generatedreport.xlsx')
    }

    const resultsModal = () => {
        return (
            <>
                <StyledTitle variant="h6">Refine Results</StyledTitle>
                <StyledStack spacing={2}>
                    <StyledDiv>
                        <Typography>Number of queried results:</Typography>
                        <Tooltip title={limitTooltipText}>
                            <HelpOutlineIcon
                                color="primary"
                                sx={{ fontSize: 15, marginLeft: '5px' }}
                            />
                        </Tooltip>
                    </StyledDiv>
                    <Controller
                        name={'LIMIT'}
                        control={control}
                        rules={{}}
                        render={({ field }) => {
                            return (
                                <Slider
                                    value={field.value}
                                    step={1}
                                    min={1}
                                    max={10}
                                    marks
                                    valueLabelDisplay="auto"
                                    onChange={(event, newValue) =>
                                        field.onChange(newValue)
                                    }
                                />
                            );
                        }}
                    />
                    <StyledDiv>
                        <Typography>Temperature:</Typography>
                        <Tooltip title={temperatureTooltipText}>
                            <HelpOutlineIcon
                                color="primary"
                                sx={{ fontSize: 15, marginLeft: '5px' }}
                            />
                        </Tooltip>
                    </StyledDiv>

                    <Controller
                        name={'TEMPERATURE'}
                        control={control}
                        rules={{}}
                        render={({ field }) => {
                            return (
                                <Slider
                                    value={field.value}
                                    step={0.1}
                                    min={0.1}
                                    max={1}
                                    marks
                                    valueLabelDisplay="auto"
                                    onChange={(event, newValue) =>
                                        field.onChange(newValue)
                                    }
                                />
                            );
                        }}
                    />
                </StyledStack>
            </>
        );
    };

    const promptModal = () => {
        return (
            <>
                <StyledTitle variant="h6">Edit Prompt</StyledTitle>
                <StyledStack spacing={2}>
                    <Typography variant="caption">
                        This will change the default prompt that is sent to your
                        LLM, which will affect the way that it answers your
                        query.
                    </Typography>
                    <StyledDiv>
                        <Typography>Prompt:</Typography>
                        <Tooltip title={promptText}>
                            <HelpOutlineIcon
                                color="primary"
                                sx={{ fontSize: 15, marginLeft: '5px' }}
                            />
                        </Tooltip>
                    </StyledDiv>
                    <Controller
                        name={'PROMPT'}
                        control={control}
                        rules={{}}
                        render={({ field }) => {
                            return (
                                <StyledTextField
                                    value={field.value}
                                    onChange={(newValue) =>
                                        field.onChange(newValue)
                                    }
                                    rows={5}
                                    multiline
                                    fullWidth
                                    variant="standard"
                                    inputProps={{
                                        disableUnderline: true,
                                    }}
                                />
                            );
                        }}
                    />

                    <StyledDiv>
                        <Typography>Context:</Typography>
                        <Tooltip title={contextText}>
                            <HelpOutlineIcon
                                color="primary"
                                sx={{ fontSize: 15, marginLeft: '5px' }}
                            />
                        </Tooltip>
                    </StyledDiv>
                    <Controller
                        name={'CONTEXT'}
                        control={control}
                        rules={{}}
                        render={({ field }) => {
                            return (
                                <StyledTextField
                                    value={field.value}
                                    onChange={(newValue) =>
                                        field.onChange(newValue)
                                    }
                                    rows={5}
                                    multiline
                                    fullWidth
                                    variant="standard"
                                    inputProps={{
                                        disableUnderline: true,
                                    }}
                                />
                            );
                        }}
                    />
                </StyledStack>
            </>
        );
    };
    return (
        <StyledModal>
            {context !== 'download' && (
            <form onSubmit={changePrompt}>
                {context === 'refine' ? resultsModal() : promptModal()}
                <StyledButtonGroup>
                    <Button
                        variant={'outlined'}
                        color="primary"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant={'contained'}
                        sx={{ marginLeft: '5px' }}
                    >
                        Save
                    </Button>
                </StyledButtonGroup>
            </form>
            )
            }
            {answerLog.length > 0 && (
                <StyledDownload>
                    <StyledButton
                    variant="contained"
                    onClick={async () => {
                        generateDoc();
                    }}
                    sx={{marginRight: '10px'}}
                    >
                    Download Doc
                    </StyledButton>
                    <StyledButton
                    variant="contained"
                    onClick={async () => {
                        generateXLSX();
                    }}
                    >
                    Download Sheet
                    </StyledButton>
                </StyledDownload>

            )}
        </StyledModal>
    );
};
