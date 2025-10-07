import { useState } from 'react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizProps {
  questions: Question[];
  title: string;
}

export default function Quiz({ questions, title }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResults(true);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setShowResults(false);
    setScore(0);
  };

  if (showResults) {
    return (
      <div style={{
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        padding: '2rem',
        margin: '2rem 0',
        backgroundColor: 'white'
      }}>

        <div style={{ marginBottom: '2rem' }}>
          {questions.map((question, index) => (
            <div key={question.id}>
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: 'white'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.8rem', fontWeight: '600' }}>
                  Question {index + 1}: {question.question}
                </h4>
                
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} style={{
                    padding: '0.25rem',
                    margin: '0.25rem 0',
                    borderRadius: '4px',
                    backgroundColor: optionIndex === question.correctAnswer 
                      ? '#e8f5e8'
                      : selectedAnswers[index] === optionIndex && optionIndex !== question.correctAnswer
                      ? '#ffebee'
                      : 'white',
                    color: optionIndex === question.correctAnswer 
                      ? '#3A5D44'
                      : selectedAnswers[index] === optionIndex && optionIndex !== question.correctAnswer
                      ? '#c62828'
                      : '#333',
                    fontSize: '1.6rem',
                    fontWeight: 'normal'
                  }}>
                    <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}
                    {optionIndex === question.correctAnswer && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '1.6rem' }}>✓</span>
                    )}
                    {selectedAnswers[index] === optionIndex && optionIndex !== question.correctAnswer && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '1.6rem' }}>✗</span>
                    )}
                  </div>
                ))}
                
                <div style={{
                  marginTop: '1rem',
                  padding: '1.25rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '1.6rem'
                }}>
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              </div>
              {index < questions.length - 1 && (
                <div style={{
                  height: '1px',
                  backgroundColor: '#e1e5e9',
                  margin: '1rem 0'
                }}></div>
              )}
            </div>
          ))}
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '2rem',
          padding: '0 1rem',
          minHeight: '3rem'
        }}>
          <span style={{ color: '#3A5D44', fontSize: '1.6rem', fontWeight: '600' }}>
            You scored {score}/{questions.length}!
          </span>
          
          <button
            onClick={resetQuiz}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1.4rem',
              backgroundColor: '#3A5D44',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const allAnswered = selectedAnswers.every(answer => answer !== -1);

  return (
    <div style={{
      border: '1px solid #e1e5e9',
      borderRadius: '8px',
      padding: '2rem',
      margin: '2rem 0',
      backgroundColor: 'white'
    }}>
      <div style={{ marginBottom: '1rem', fontSize: '1.4rem', color: '#666', fontWeight: '600' }}>
        Question {currentQuestion + 1} of {questions.length}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', fontSize: '1.8rem', fontWeight: '600' }}>
          {currentQ.question}
        </h4>
        
        {currentQ.options.map((option, index) => (
          <label key={index} style={{
            display: 'block',
            padding: '0.25rem',
            margin: '0.25rem 0',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '1.6rem',
            fontWeight: 'normal'
          }}>
            <input
              type="radio"
              name={`question-${currentQuestion}`}
              value={index}
              checked={selectedAnswers[currentQuestion] === index}
              onChange={() => handleAnswerSelect(index)}
              style={{ 
                marginRight: '0.75rem',
                accentColor: '#000000'
              }}
            />
            <strong>{String.fromCharCode(65 + index)}.</strong> {option}
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1.4rem',
            backgroundColor: currentQuestion === 0 ? '#f5f5f5' : '#6c757d',
            color: currentQuestion === 0 ? '#999' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1.4rem',
              backgroundColor: allAnswered ? '#3A5D44' : '#f5f5f5',
              color: allAnswered ? 'white' : '#999',
              border: 'none',
              borderRadius: '6px',
              cursor: allAnswered ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1.4rem',
              backgroundColor: '#3A5D44',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}