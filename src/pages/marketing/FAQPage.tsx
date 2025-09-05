import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Container, Typography } from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';

const items = [
  { q: 'How do I ingest content?', a: 'Paste links or upload files. Xenon chunks, indexes, and builds routes and quizzes.' },
  { q: 'Can I collaborate?', a: 'Team plan supports multiple seats and roles (teacher, admin, self-learner).' },
  { q: 'Is there an API?', a: 'Yes, a REST API for ingestion, courses and progress (see docs).' },
];

const FAQPage: React.FC = () => (
  <Container sx={{ py: 8 }}>
    <Typography variant="h3" sx={{ fontWeight: 800 }} gutterBottom>FAQ</Typography>
    {items.map((it, i) => (
      <Accordion key={i} sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>{it.q}</AccordionSummary>
        <AccordionDetails>
          <Typography color="text.secondary">{it.a}</Typography>
        </AccordionDetails>
      </Accordion>
    ))}
  </Container>
);

export default FAQPage;

