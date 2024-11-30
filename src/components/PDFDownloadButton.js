import React from 'react';

const PDFDownloadButton = ({ pdfUrl, fileName }) => {
  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    margin: '16px 0',
    cursor: 'pointer'
  };

  return (
    <a href={pdfUrl} download={fileName} style={buttonStyle}>
      📥 הורד כ-PDF
    </a>
  );
};

export default PDFDownloadButton;