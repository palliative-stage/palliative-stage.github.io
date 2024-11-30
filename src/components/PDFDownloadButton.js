import React from 'react';

const PDFDownloadButton = ({ pdfUrl, fileName }) => {
  return (
    <a
      href={pdfUrl}
      download={fileName}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 my-4"
    >
      📥 הורד כ-PDF
    </a>
  );
};

export default PDFDownloadButton;