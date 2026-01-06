import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function DocumentViewer({ jobId, filename }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageBlobUrl, setImageBlobUrl] = useState(null);

  // Document URL for preview
  const documentUrl = `http://localhost:8001/api/v1/processing/jobs/${jobId}/preview`;
  const fileExt = filename?.split('.').pop()?.toLowerCase();
  const isPDF = fileExt === 'pdf';

  // Fetch image with authentication for non-PDF files
  // Authentication is handled via HTTP-only cookies
  useEffect(() => {
    if (!isPDF && jobId) {
      setLoading(true);
      fetch(documentUrl, {
        credentials: 'include' // Send cookies with request
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to load image');
          return response.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setImageBlobUrl(url);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading image:', err);
          setError('Failed to load image');
          setLoading(false);
        });

      // Cleanup blob URL on unmount
      return () => {
        if (imageBlobUrl) {
          URL.revokeObjectURL(imageBlobUrl);
        }
      };
    }
  }, [jobId, isPDF]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading document:', error);
    setError('Failed to load document');
    setLoading(false);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages));
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prev => Math.min(3.0, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));
  const resetZoom = () => setScale(1.0);
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">Unable to display document preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          {isPDF && (
            <button
              onClick={rotate}
              className="p-2 hover:bg-gray-100 rounded transition ml-2"
              title="Rotate"
            >
              <RotateCw size={20} />
            </button>
          )}
        </div>

        {isPDF && numPages && (
          <div className="flex items-center gap-2">
            <button
              onClick={previousPage}
              disabled={pageNumber <= 1}
              className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-700 min-w-[100px] text-center">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        <div className="text-sm text-gray-600">
          {filename}
        </div>
      </div>

      {/* Document Display */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <div className="flex justify-center">
          {isPDF ? (
            <div className="bg-white shadow-lg">
              {loading && (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading document...</p>
                  </div>
                </div>
              )}
              <Document
                file={{
                  url: documentUrl,
                  withCredentials: true // Send cookies with request
                }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
                error=""
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          ) : (
            <div className="bg-white shadow-lg p-4">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : imageBlobUrl ? (
                <img
                  src={imageBlobUrl}
                  alt={filename}
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    maxWidth: '100%',
                    transition: 'transform 0.2s'
                  }}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
