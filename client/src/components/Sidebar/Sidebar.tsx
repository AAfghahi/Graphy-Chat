import React from 'react';
import {
    styled,
    Paper,
    IconButton,
    Autocomplete,
    TextField,
    Slider,
    Typography,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Select,
    MenuItem,
    Stack,
    List,
    Avatar,
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';
import { Handle, Position } from '@xyflow/react';

const StyledSidebar = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '360px',
    borderRadius: '0',
    padding: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
        position: 'absolute',
        zIndex: open ? theme.zIndex.drawer + 2 : -1,
        width: '100%',
        maxWidth: '280px',
    },
    position: 'absolute',
    left: '0%',
    height: '100%',
    zIndex: 2,
    float: 'left',
}));

const StyledAccordionDetails = styled(AccordionDetails)(() => ({
    padding: '8px 16px',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    background: 'white',
    marginRight: theme.spacing(0.5),
}));

const StyledButton = styled(IconButton)(() => ({
    marginLeft: 'auto',
}));

const StyledDiv = styled('div')(() => ({
    display: 'flex',
}));

const StyledList = styled(List)(({ theme }) => ({
    width: '100%',
    padding: '8px, 16px, 8px, 16px',
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    paddingTop: theme.spacing(5),
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
    paddingTop: theme.spacing(2),
}));
const filter = createFilterOptions();

export const Sidebar = ({
    modelOptions,
    selectedModel,
    setSelectedModel,
    vectorOptions,
    selectedVectorDB,
    setSelectedVectorDB,
    setSideOpen,
}) => {
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
    return (
        <StyledSidebar>
            <StyledList>
                <StyledDiv>
                    <StyledAvatar>
                        <SmartToyOutlinedIcon
                            sx={{ color: 'rgba(0, 0, 0, 0.87)' }}
                        />
                    </StyledAvatar>
                    <Typography variant="h6" sx={{ margin: 'auto' }}>
                        Demo Policy Vector Engine
                    </Typography>
                </StyledDiv>

                <StyledButton onClick={() => setSideOpen(false)}>
                    <ArrowBackIosNewOutlinedIcon />
                </StyledButton>
            </StyledList>

            <StyledStack spacing={2}>
                <Typography> Select Model: </Typography>
                <Autocomplete
                    options={modelOptions}
                    value={selectedModel}
                    placeholder="Choose a Model"
                    getOptionLabel={(option: Model) =>
                        option.database_name || ''
                    }
                    onChange={(event, newModel) =>
                        setSelectedModel(newModel)
                    }
                    renderInput={(params) => (
                        <TextField {...params} variant="outlined" />
                    )}
                    multiple
                />
                <Typography> Select Knowledge Repository: </Typography>
                <Autocomplete
                    options={vectorOptions}
                    value={selectedVectorDB}
                    placeholder="Choose a Vector Catalog"
                    getOptionLabel={(option: Model) =>
                        option.database_name || ''
                    }
                    onChange={(event, newVectorDB) =>
                        setSelectedVectorDB(newVectorDB)
                    }
                    renderInput={(params) => (
                        <TextField {...params} variant="outlined" />
                    )}
                    multiple
                />
            </StyledStack>
        </StyledSidebar>
    );
};
