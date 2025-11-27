import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseExcel } from '../services/excelParser';
import { Question } from '../types';

interface FileUploadProps {
    onUpload: (questions: Question[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const questions = await parseExcel(file);
            onUpload(questions);
        } catch (error) {
            console.error("Error parsing file:", error);
            alert("Failed to parse Excel file. Please check the format.");
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-center">
                <div className="mx-auto h-12 w-12 text-blue-600 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <FileSpreadsheet size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Upload Question Bank</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Upload your Excel file (.xlsx) containing the questions.
                </p>

                <div className="mt-6">
                    <label className="flex flex-col items-center px-4 py-6 bg-white text-blue rounded-lg shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:bg-blue-600 hover:text-white transition-colors duration-200 group">
                        <Upload className="w-8 h-8 group-hover:animate-bounce" />
                        <span className="mt-2 text-base leading-normal">Select a file</span>
                        <input type='file' className="hidden" accept=".xlsx" onChange={handleFileChange} />
                    </label>
                </div>
            </div>
        </div>
    );
};
