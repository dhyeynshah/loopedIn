"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const subjectBoards = ['AP', 'Honors', 'IB', 'Regular'];

const subjectsByBoard = {
  'AP': ['Biology', 'Chemistry', 'Physics', 'Calculus AB', 'Calculus BC', 'Statistics', 'English Literature', 'US History'],
  'Honors': ['Biology', 'Chemistry', 'Physics', 'Algebra II', 'Pre-Calculus', 'English', 'World History', 'Spanish'],
  'IB': ['Math AA', 'Math AI', 'Biology', 'Chemistry', 'Physics', 'English A', 'Spanish B', 'History'],
  'Regular': ['Math', 'Science', 'English', 'History', 'Spanish', 'French', 'Art', 'Music']
};

const ibLevels = ['HL', 'SL'];

const questions = [
  {
    id: 'first_name',
    question: "What's your first name?",
    type: 'input',
    placeholder: "Type your first name..."
  },
  {
    id: 'last_name',
    question: "And your last name?",
    type: 'input',
    placeholder: "Type your last name..."
  },
  {
    id: 'school',
    question: "Which school do you go to?",
    type: 'input',
    placeholder: "Enter your school name..."
  },
  {
    id: 'grade',
    question: "What grade are you in?",
    type: 'options',
    options: ["9th Grade (freshman)", "10th Grade (sophomore)", "11th Grade (junior)", "12th Grade (senior)", "Other"]
  },
  {
    id: 'subject_proficient',
    question: "What subject are you awesome at?",
    type: 'subject_dropdown'
  },
  {
    id: 'subject_help',
    question: "What subject do you need help with?",
    type: 'subject_dropdown'
  },
  {
    id: 'personality_type',
    question: "How would you describe yourself?",
    type: 'options',
    options: ["Introvert", "Extrovert", "Ambivert"]
  },
  {
    id: 'study_style',
    question: "What's your learning style?",
    type: 'options',
    options: ["Visual", "Auditory", "Kinesthetic", "Reading/Writing"]
  },
  {
    id: 'communication_style',
    question: "How do you prefer to communicate?",
    type: 'options',
    options: ["Direct & Straightforward", "Friendly & Casual", "Formal & Professional", "Encouraging & Supportive"]
  },
  {
    id: 'study_schedule',
    question: "When do you study best?",
    type: 'options',
    options: ["Early Morning (6-9 AM)", "Morning (9-12 PM)", "Afternoon (12-5 PM)", "Evening (5-8 PM)", "Night (8-11 PM)", "Late Night (11+ PM)"]
  },
  {
    id: 'study_duration',
    question: "How long can you focus in one session?",
    type: 'options',
    options: ["30 minutes", "1 hour", "2 hours", "3+ hours"]
  },
  {
    id: 'study_environment',
    question: "What environment helps you focus?",
    type: 'options',
    options: ["Complete Silence", "Background Music", "Cafe/White Noise", "Group Study Energy"]
  },
  {
    id: 'favorite_food',
    question: "What's your favorite food?",
    type: 'input',
    placeholder: "Pizza, sushi, tacos...?",
    optional: true
  },
  {
    id: 'bio',
    question: "Tell us about yourself!",
    type: 'textarea',
    placeholder: "What makes you unique? What are you passionate about?",
    optional: true
  }
];

const ProfileForm = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedIBLevel, setSelectedIBLevel] = useState('');
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const isDirectProfileAccess = searchParams.get('direct') === 'true';
  const { user, loading: authLoading } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadExistingProfile = async () => {
      if (user && !hasLoadedProfile) {
        setHasLoadedProfile(true);
        try {
          if (isDirectProfileAccess) {
            const { data: connectionsData, error: connectionsError } = await supabase
              .from('connections')
              .select('id')
              .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
              .limit(1);

            if (connectionsData && connectionsData.length > 0) {
              toast.error("You cannot edit your profile after making connections");
              router.push('/connections');
              return;
            }
          }

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile && !error) {
            const existingAnswers = {
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              school: profile.school || '',
              grade: profile.grade || '',
              subject_proficient: profile.subject_proficient || '',
              subject_help: profile.subject_help || '',
              personality_type: profile.personality_type || '',
              study_style: profile.study_style || '',
              communication_style: profile.communication_style || '',
              study_schedule: profile.study_schedule || '',
              study_duration: profile.study_duration || '',
              study_environment: profile.study_environment || '',
              favorite_food: profile.favorite_food || '',
              bio: profile.bio || '',
              email: profile.email || user.email
            };

            const requiredFields = ['first_name', 'last_name', 'school', 'grade', 'subject_proficient', 'subject_help'];
            const isComplete = requiredFields.every(field => 
              existingAnswers[field] && existingAnswers[field].toString().trim() !== ''
            );

            if (isComplete && !isDirectProfileAccess) {
              router.push('/find-peers');
              return;
            }

            setAnswers(existingAnswers);

            if (isDirectProfileAccess) {
              const firstQuestion = questions[0];
              if (firstQuestion.type === 'input' || firstQuestion.type === 'textarea') {
                setInputValue(existingAnswers[firstQuestion.id] || '');
              }
              if (firstQuestion.type === 'subject_dropdown') {
                const subjectValue = existingAnswers[firstQuestion.id] || '';
                const parts = subjectValue.split(' ');
                if (parts.length >= 2) {
                  setSelectedBoard(parts[0]);
                  if (parts[0] === 'IB' && parts.length >= 3) {
                    setSelectedSubject(parts[1]);
                    setSelectedIBLevel(parts[2]);
                  } else {
                    setSelectedSubject(parts.slice(1).join(' '));
                  }
                }
              }
            } else {
              const lastFilledIndex = questions.findIndex(q => !existingAnswers[q.id] || existingAnswers[q.id].toString().trim() === '');
              if (lastFilledIndex > 0) {
                setCurrentQuestion(lastFilledIndex);
                const currentAnswer = existingAnswers[questions[lastFilledIndex].id];
                if (questions[lastFilledIndex].type === 'input' || questions[lastFilledIndex].type === 'textarea') {
                  setInputValue(currentAnswer || '');
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    if (user && !authLoading && !hasLoadedProfile) {
      loadExistingProfile();
    }
  }, [user, authLoading, router, supabase, hasLoadedProfile, isDirectProfileAccess]);

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: answer }));
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setInputValue('');
        setSelectedBoard('');
        setSelectedSubject('');
        setSelectedIBLevel('');
        
        const nextQuestion = questions[currentQuestion + 1];
        const nextAnswer = answers[nextQuestion.id];
        if (nextAnswer) {
          if (nextQuestion.type === 'input' || nextQuestion.type === 'textarea') {
            setInputValue(nextAnswer);
          }
          if (nextQuestion.type === 'subject_dropdown') {
            const parts = nextAnswer.split(' ');
            if (parts.length >= 2) {
              setSelectedBoard(parts[0]);
              if (parts[0] === 'IB' && parts.length >= 3) {
                setSelectedSubject(parts[1]);
                setSelectedIBLevel(parts[2]);
              } else {
                setSelectedSubject(parts.slice(1).join(' '));
              }
            }
          }
        }
      } else {
        saveProfile();
      }
    }, 300);
  };

  const handleInputSubmit = () => {
    if (inputValue.trim() || currentQ.optional) {
      handleAnswer(inputValue.trim());
    }
  };

  const handleSubjectSubmit = () => {
    if (selectedBoard && selectedSubject) {
      let finalSubject = selectedBoard === 'IB' && selectedIBLevel 
        ? `IB ${selectedSubject} ${selectedIBLevel}` 
        : `${selectedBoard} ${selectedSubject}`;
      
      handleAnswer(finalSubject);
      setSelectedBoard('');
      setSelectedSubject('');
      setSelectedIBLevel('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      const prevAnswer = answers[questions[currentQuestion - 1].id];
      if (questions[currentQuestion - 1].type === 'input' || questions[currentQuestion - 1].type === 'textarea') {
        setInputValue(prevAnswer || '');
      }
      if (questions[currentQuestion - 1].type === 'subject_dropdown') {
        const subjectValue = prevAnswer || '';
        const parts = subjectValue.split(' ');
        if (parts.length >= 2) {
          setSelectedBoard(parts[0]);
          if (parts[0] === 'IB' && parts.length >= 3) {
            setSelectedSubject(parts[1]);
            setSelectedIBLevel(parts[2]);
          } else {
            setSelectedSubject(parts.slice(1).join(' '));
          }
        }
      }
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const profileData = {
        id: user.id,
        email: user.email,
        ...answers,
        availability: answers.availability || {},
        display_status_lastname: 'on',
        display_status_email: 'on',
        display_status_school: 'on',
        updated_at: new Date().toISOString()
      };

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      let result;
      if (existingProfile) {
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
      } else {
        profileData.created_at = new Date().toISOString();
        result = await supabase
          .from('profiles')
          .insert([profileData]);
      }

      if (result.error) {
        throw result.error;
      }

      setCompleted(true);
      toast.success("Profile saved successfully!");
      
      setTimeout(() => {
        window.location.href = '/find-peers';
      }, 2000);
      
    } catch (error) {
      toast.error("Failed to save profile: " + error.message);
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-3xl">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Check size={40} className="text-white font-bold" strokeWidth={4} />
          </div>
          <h1 className="text-5xl font-black text-[#1A1A2E] mb-6 tracking-tight">
            You're all set!
          </h1>
          <p className="text-xl font-bold text-gray-600 mb-6 leading-relaxed">
            Your profile is complete. Time to find your study match!
          </p>
          <Button 
            onClick={() => window.location.href = '/find-peers'}
            className="bg-black hover:bg-gray-800 text-white rounded-full text-xl font-bold transition-all duration-300 hover:scale-110 shadow-xl"
          >
            <div className="flex items-center px-4">
              Find Study Peers <ArrowRight className="ml-2" size={24} strokeWidth={3} />
            </div>
          </Button>
          <div className="mt-8 flex justify-center space-x-3">
            <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="w-full bg-gray-200 h-2">
        <div 
          className="h-full bg-black transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <span className="text-gray-500 text-lg">
              {currentQuestion + 1} of {questions.length}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A2E] mb-12 text-center leading-tight">
            {currentQ.question}
          </h1>

          <div className="space-y-4">
            {currentQ.type === 'subject_dropdown' && (
              <div className="space-y-6">
                <div className="relative">
                  <select
                    value={selectedBoard}
                    onChange={(e) => {
                      setSelectedBoard(e.target.value);
                      setSelectedSubject('');
                      setSelectedIBLevel('');
                    }}
                    className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:border-black bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Select board/type...</option>
                    {subjectBoards.map((board) => (
                      <option key={board} value={board}>{board}</option>
                    ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {selectedBoard === 'IB' && (
                  <div className="relative">
                    <select
                      value={selectedIBLevel}
                      onChange={(e) => setSelectedIBLevel(e.target.value)}
                      className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:border-black bg-white appearance-none cursor-pointer"
                    >
                      <option value="">Select level...</option>
                      {ibLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}

                {selectedBoard && (selectedBoard !== 'IB' || (selectedBoard === 'IB' && selectedIBLevel)) && (
                  <div className="relative">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:border-black bg-white appearance-none cursor-pointer"
                    >
                      <option value="">Select subject...</option>
                      {subjectsByBoard[selectedBoard]?.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}

                <Button
                  onClick={handleSubjectSubmit}
                  disabled={!selectedBoard || !selectedSubject || (selectedBoard === 'IB' && !selectedIBLevel)}
                  className="w-full bg-black hover:bg-gray-800 text-white py-4 text-lg rounded-lg disabled:opacity-50"
                >
                  Continue <ArrowRight className="ml-2" size={20} />
                </Button>
              </div>
            )}

            {currentQ.type === 'options' && (
              <div className="grid gap-3">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 text-lg ${
                      answers[currentQ.id] === option 
                        ? 'border-black bg-gray-100' 
                        : 'border-gray-200 hover:border-black hover:bg-gray-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
                {answers[currentQ.id] && (
                  <Button
                    onClick={() => handleAnswer(answers[currentQ.id])}
                    className="w-full bg-black hover:bg-gray-800 text-white py-4 text-lg rounded-lg mt-4"
                  >
                    Continue <ArrowRight className="ml-2" size={20} />
                  </Button>
                )}
              </div>
            )}

            {currentQ.type === 'input' && (
              <div className="space-y-4">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={currentQ.placeholder}
                  className="text-lg p-4 border-2 border-gray-200 rounded-lg focus:border-black"
                  autoFocus
                />
                <Button
                  onClick={handleInputSubmit}
                  disabled={!inputValue.trim() && !currentQ.optional}
                  className="w-full bg-black hover:bg-gray-800 text-white py-4 text-lg rounded-lg"
                >
                  Continue <ArrowRight className="ml-2" size={20} />
                </Button>
              </div>
            )}

            {currentQ.type === 'textarea' && (
              <div className="space-y-4">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={currentQ.placeholder}
                  className="text-lg p-4 border-2 border-gray-200 rounded-lg focus:border-black h-32 resize-none"
                  autoFocus
                />
                <Button
                  onClick={handleInputSubmit}
                  className="w-full bg-black hover:bg-gray-800 text-white py-4 text-lg rounded-lg"
                >
                  {currentQuestion === questions.length - 1 ? 'Complete Profile' : 'Continue'} 
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </div>
            )}
          </div>

          {currentQuestion > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={goBack}
                className="inline-flex items-center text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>
            </div>
          )}

          {currentQ.optional && (
            <div className="mt-4 text-center">
              <button
                onClick={() => handleAnswer('')}
                className="text-gray-500 hover:text-black transition-colors"
              >
                Skip this question
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg">Saving your profile...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileForm;