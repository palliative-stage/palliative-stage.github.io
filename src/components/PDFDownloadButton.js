import React from 'react';

const PDFDownloadButton = ({ pdfUrl, fileName, buttonText = "📥 הורד כ-PDF", section }) => {
  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '4px',
    textDecoration: 'none',
    margin: '16px 16px 16px 0',
    cursor: 'pointer'
  };

  const isPptx = fileName && fileName.toLowerCase().endsWith('.pptx');
  const analyticsType = isPptx ? 'pptx' : 'pdf';

  return (
    <a
      href={pdfUrl}
      download={fileName}
      style={buttonStyle}
      data-analytics-id="pdf-download"
      data-analytics-type={analyticsType}
      data-analytics-section={section}
      data-analytics-text={buttonText}
    >
      {buttonText}
    </a>
  );
};

export default PDFDownloadButton;