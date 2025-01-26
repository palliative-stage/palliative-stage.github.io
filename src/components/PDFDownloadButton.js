import React from 'react';

const PDFDownloadButton = ({ pdfUrl, fileName, buttonText = "📥 הורד כ-PDF" }) => {
  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    margin: '16px 16px 16px 0',  // Added right margin
    cursor: 'pointer'
  };

  return (
    <a href={pdfUrl} download={fileName} style={buttonStyle}>
      {buttonText}
    </a>
  );
};

export default PDFDownloadButton;