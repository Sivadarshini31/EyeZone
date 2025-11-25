
import React from 'react';
import IconButton from './IconButton';
import { AppFile, Language } from '../types';
import { fileToBase64, resizeImage } from '../utils/helpers';
import { translations } from '../utils/translations';

interface MainScreenProps {
  onFileSelect: (file: AppFile) => void;
  setLoading: (loading: boolean, message: string) => void;
  galleryInputRef: React.RefObject<HTMLInputElement>;
  cameraInputRef: React.RefObject<HTMLInputElement>;
  pdfInputRef: React.RefObject<HTMLInputElement>;
  language: Language;
}

const MainScreen: React.FC<MainScreenProps> = ({ onFileSelect, setLoading, galleryInputRef, cameraInputRef, pdfInputRef, language }) => {
  const t = translations[language];

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true, t.processing);
    try {
      let base64 = await fileToBase64(file);
      if (type === 'image') {
        base64 = await resizeImage(base64);
      }
      onFileSelect({
        name: file.name,
        type,
        content: base64,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process file.");
    } finally {
        // The final loading state is handled in the App component after text extraction
        // setLoading(false, ''); 
    }
  };

  return (
    <main className="flex-grow flex items-center justify-center p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          onChange={(e) => handleFileChange(e, 'image')}
          className="hidden"
        />
        <IconButton label={t.gallery} language={language} onClick={() => galleryInputRef.current?.click()} icon={
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        } />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={(e) => handleFileChange(e, 'image')}
          className="hidden"
        />
        <IconButton label={t.camera} language={language} onClick={() => cameraInputRef.current?.click()} icon={
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        } />
        <input
          type="file"
          accept=".pdf"
          ref={pdfInputRef}
          onChange={(e) => handleFileChange(e, 'pdf')}
          className="hidden"
        />
        <IconButton label={t.pdf} language={language} onClick={() => pdfInputRef.current?.click()} icon={
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        } />
      </div>
    </main>
  );
};

export default MainScreen;
