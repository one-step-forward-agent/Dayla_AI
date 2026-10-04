import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import LandingHeader from '@/components/landing/LandingHeader';
import termsMarkdown from './md_texts/consent.md?raw';

const PersonalDataConsentPage: React.FC = () => {
  return (
    <>
      <LandingHeader />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 sm:p-8 md:p-12 transition-all duration-300">
            <div className="prose prose-lg max-w-none prose-slate dark:prose-invert
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900 dark:prose-headings:text-white
              prose-h1:text-4xl prose-h1:font-extrabold prose-h1:tracking-tight prose-h1:mb-6
              prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-blue-700 dark:prose-h2:text-blue-400
              prose-h3:text-xl prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300
              prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-ul:list-disc prose-ul:pl-5 prose-li:marker:text-blue-500
              prose-li:leading-relaxed
              prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
            ">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-200"
                    >
                      {children}
                    </a>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 last:mb-0">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 space-y-1">{children}</ul>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
                  ),
                }}
              >
                {termsMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PersonalDataConsentPage;
