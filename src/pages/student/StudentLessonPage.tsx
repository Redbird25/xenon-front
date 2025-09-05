import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link } from 'react-router-dom';
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const StudentLessonPage: React.FC = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  // Mock lesson data
  const lesson = {
    id: lessonId,
    title: 'Introduction to Variables',
    content: `
      <h2>What are Variables?</h2>
      <p>Variables are containers for storing data values. In Python, you don't need to declare variables with any particular type, and you can change the type after they have been set.</p>

      <h3>Creating Variables</h3>
      <p>Python has no command for declaring a variable. A variable is created the moment you first assign a value to it.</p>

      <pre><code>x = 5
y = "Hello, World!"
print(x)
print(y)</code></pre>

      <h3>Variable Names</h3>
      <ul>
        <li>A variable name must start with a letter or the underscore character</li>
        <li>A variable name cannot start with a number</li>
        <li>A variable name can only contain alpha-numeric characters and underscores</li>
        <li>Variable names are case-sensitive</li>
      </ul>
    `,
    quiz: {
      questions: [
        {
          id: 1,
          question: "What is a variable in Python?",
          options: [
            "A container for storing data values",
            "A type of function",
            "A mathematical operation",
            "A comment in code"
          ],
          correctAnswer: 0,
          explanation: "Variables are containers that store data values in Python."
        },
        {
          id: 2,
          question: "Which of the following is a valid variable name in Python?",
          options: [
            "2variable",
            "variable_name",
            "_private",
            "for"
          ],
          correctAnswer: 1,
          explanation: "Variable names must start with a letter or underscore, and 'for' is a reserved keyword."
        }
      ]
    }
  };

  const handleQuizAnswer = (questionId: number, answerIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const computeUnique = (events: Array<{courseId?:string; lessonId?:string}>) => new Set(events.map(e => `${e.courseId}:${e.lessonId}`)).size;
  const computeStreak = (events: Array<{ts:string}>) => {
    const days = Array.from(new Set(events.map(e => new Date(e.ts).toDateString()))).sort((a,b)=> new Date(a).getTime()-new Date(b).getTime());
    let s = 0; const current = new Date(); current.setHours(0,0,0,0);
    for (let i=days.length-1;i>=0;i--){ const d=new Date(days[i]); d.setHours(0,0,0,0); const diff=Math.round((current.getTime()-d.getTime())/(24*60*60*1000)); if(diff===s) s++; else if(diff> s) break; }
    return Math.max(0,s);
  };

  const handleSubmitQuiz = () => {
    setShowResults(true);
    try {
      if (!user?.id) return;
      const key = `study_events_${user.id}`;
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const prevUnique = computeUnique(prev);
      const prevStreak = computeStreak(prev);
      const score = calculateScore();
      const evt = { ts: new Date().toISOString(), courseId, lessonId, score };
      const next = [...prev, evt];
      localStorage.setItem(key, JSON.stringify(next));
      const nextUnique = computeUnique(next);
      const nextStreak = computeStreak(next);
      if (prevUnique < 10 && nextUnique >= 10) {
        showToast('Achievement unlocked: 10 lessons!', 'success');
      }
      if (prevStreak < 7 && nextStreak >= 7) {
        showToast('Achievement unlocked: 7‑day streak!', 'success');
      }
    } catch {}
  };

  const calculateScore = () => {
    let correct = 0;
    lesson.quiz.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / lesson.quiz.questions.length) * 100);
  };

  const steps = [
    { id: 'content', label: 'Lesson Content', completed: true },
    { id: 'quiz', label: 'Quiz', completed: showResults },
    { id: 'results', label: 'Results', completed: false }
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} component={Link} to={`/courses/${courseId}`}>
          Back to Course
        </Button>
        <Typography variant="h5">
          {lesson.title}
        </Typography>
        <Box width={100} /> {/* Spacer */}
      </Box>

      {/* Progress Steps */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {steps.map((step, index) => (
            <Grid size={4} key={step.id}>
              <Box textAlign="center">
                <Chip
                  icon={step.completed ? <CheckCircle /> : <RadioButtonUnchecked />}
                  label={step.label}
                  color={step.completed ? 'success' : currentStep === index ? 'primary' : 'default'}
                  variant={currentStep === index ? 'filled' : 'outlined'}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Lesson Content */}
      {currentStep === 0 && (
        <Paper sx={{ p: 3 }}>
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={() => setCurrentStep(1)}
            >
              Take Quiz
            </Button>
          </Box>
        </Paper>
      )}

      {/* Quiz */}
      {currentStep === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Knowledge Check
          </Typography>

          {lesson.quiz.questions.map((question, qIndex) => (
            <Card key={question.id} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {qIndex + 1}. {question.question}
                </Typography>

                {question.options.map((option, oIndex) => (
                  <Box
                    key={oIndex}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: '1px solid',
                      borderColor: quizAnswers[question.id] === oIndex ? 'primary.main' : 'grey.300',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleQuizAnswer(question.id, oIndex)}
                  >
                    <Typography>
                      {String.fromCharCode(65 + oIndex)}. {option}
                    </Typography>
                  </Box>
                ))}

                {showResults && (
                  <Alert
                    severity={quizAnswers[question.id] === question.correctAnswer ? 'success' : 'error'}
                    sx={{ mt: 2 }}
                  >
                    {quizAnswers[question.id] === question.correctAnswer ? 'Correct!' : 'Incorrect. '}
                    {question.explanation}
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}

          {!showResults ? (
            <Box display="flex" justifyContent="space-between">
              <Button
                startIcon={<ArrowBack />}
                onClick={() => setCurrentStep(0)}
              >
                Back to Lesson
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitQuiz}
                disabled={Object.keys(quizAnswers).length !== lesson.quiz.questions.length}
              >
                Submit Quiz
              </Button>
            </Box>
          ) : (
            <Box textAlign="center" sx={{ mt: 3 }}>
              <Typography variant="h5" gutterBottom>
                Quiz Complete!
              </Typography>
              <Typography variant="h4" color="primary" sx={{ mb: 2 }}>
                {calculateScore()}% Score
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculateScore()}
                sx={{ height: 10, borderRadius: 5, mb: 2 }}
              />
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => setCurrentStep(2)}
              >
                Continue
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Results */}
      {currentStep === 2 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Lesson Completed! 🎉
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Great job! You've successfully completed this lesson.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={75} // Mock progress
              sx={{ height: 12, borderRadius: 6 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Course Progress: 75%
            </Typography>
          </Box>

          <Box display="flex" gap={2} justifyContent="center">
            <Button variant="outlined" href={`/courses/${courseId}`}>
              Back to Course
            </Button>
            <Button variant="contained">
              Next Lesson
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default StudentLessonPage;
