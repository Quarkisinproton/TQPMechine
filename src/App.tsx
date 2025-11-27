import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ExamConfigForm } from './components/ExamConfigForm';
import type { Question, ExamConfig } from './types';
import { generateExamPaper } from './services/questionSelector';
import { generateDocx } from './services/docxGenerator';
import { Packer } from 'docx';
import { saveAs } from 'file-saver';
import { CheckCircle } from 'lucide-react';

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState<'upload' | 'config' | 'done'>('upload');

  const handleUpload = (data: Question[]) => {
    setQuestions(data);
    setStep('config');
  };

  const handleGenerate = async (config: ExamConfig) => {
    try {
      const paper = generateExamPaper(questions, config);
      const doc = generateDocx(paper);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, 'ExamPaper.docx');
      setStep('done');
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate paper. Please check console.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              EP
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Exam Paper Generator
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className={step === 'upload' ? 'text-blue-600 font-medium' : ''}>1. Upload</span>
            <span>→</span>
            <span className={step === 'config' ? 'text-blue-600 font-medium' : ''}>2. Configure</span>
            <span>→</span>
            <span className={step === 'done' ? 'text-blue-600 font-medium' : ''}>3. Download</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {step === 'upload' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Create Professional Exam Papers
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Upload your question bank and let our intelligent system generate a perfectly balanced exam paper in seconds.
              </p>
            </div>
            <FileUpload onUpload={handleUpload} />
          </div>
        )}

        {step === 'config' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Configure Exam Structure</h2>
              <p className="text-gray-600">Loaded {questions.length} questions from your bank.</p>
            </div>
            <ExamConfigForm onGenerate={handleGenerate} />
          </div>
        )}

        {step === 'done' && (
          <div className="max-w-md mx-auto text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Paper Generated Successfully!</h2>
            <p className="text-gray-600 mb-8">
              Your exam paper has been downloaded. You can now create another one or check the file.
            </p>
            <button
              onClick={() => setStep('config')}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Generate Another
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
