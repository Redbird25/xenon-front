import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import type { Materialization } from '../../types';

interface ContentPanelProps {
  materialization: Materialization;
  onStartQuiz: () => void;
  showStartQuiz?: boolean;
}

const ContentPanel: React.FC<ContentPanelProps> = ({ materialization, onStartQuiz, showStartQuiz = true }) => {
  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      {materialization.sections.map((section, index) => (
        <Box key={index} sx={{ mb: { xs: 2, md: 2.5 } }}>
          <Typography variant="h6" gutterBottom>
            {section.title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {section.content}
          </Typography>
          {section.examples.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="subtitle2" gutterBottom>
                Examples:
              </Typography>
              {section.examples.map((example, exIndex) => (
                <Paper
                  key={exIndex}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    overflow: 'auto'
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      fontFamily: 'Consolas, "Courier New", monospace',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {example}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      ))}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Generated from {materialization.generatedFromChunks.length} knowledge sources
        </Typography>
        {showStartQuiz && (
          <Button variant="outlined" endIcon={<ArrowForward />} onClick={onStartQuiz}>
            Start Quiz
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ContentPanel;
