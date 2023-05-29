import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import Modal from "react-modal";
import ImageGallery from "react-image-gallery";
import "./styles.css";
import "react-image-gallery/styles/css/image-gallery.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTh, faBars } from "@fortawesome/free-solid-svg-icons";

function App() {
  const [file, setFile] = useState(null);
  const [extractedImages, setExtractedImages] = useState([]);
  const [layout, setLayout] = useState("grid");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const extractImages = async () => {
    if (!file) {
      console.log("Please select a file");
      setShowError(true);
      setErrorMessage("Please select a file");
      return;
    }
    setShowError(false);
    setIsLoading(true);

    try {
      const extracted = [];
      const tdata = await readFileAsArrayBuffer(file);

      let count = 0;
      let start = 0;

      while (true) {
        const x1 = findMarker(tdata, start, [0xff, 0xd8, 0xff]);
        if (x1 < 0) {
          break;
        }

        const x2 = findMarker(tdata, x1, [0xff, 0xd9]);
        if (x2 < 0) {
          break;
        }

        const jpg = tdata.slice(x1, x2 + 1);
        count++;

        const fname = `extracted${count.toString().padStart(3, "0")}.jpg`;
        const dataUrl = await createDataUrl(jpg.buffer);

        extracted.push({ original: dataUrl, originalAlt: fname });
        start = x2 + 2;
      }

      setExtractedImages(extracted);
      console.log(`Extracted ${count} JPEG images`);
    } catch (error) {
      console.error("Error extracting images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(new Uint8Array(reader.result));
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const createDataUrl = (buffer) => {
    return new Promise((resolve) => {
      const blob = new Blob([buffer], { type: "image/jpeg" });
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result);
      };

      reader.readAsDataURL(blob);
    });
  };

  const findMarker = (data, start, marker) => {
    for (let i = start; i < data.length; i++) {
      let found = true;
      for (let j = 0; j < marker.length; j++) {
        if (data[i + j] !== marker[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        return i;
      }
    }
    return -1;
  };

  const downloadImage = (dataUrl, fname) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fname;
    link.click();
  };

  const downloadAllImages = async () => {
    if (extractedImages.length === 0) {
      console.log("No images to download");
      setShowError(true);
      setErrorMessage("No images to download");
      return;
    }

    setShowError(false);
    const zip = new JSZip();

    extractedImages.forEach((image, index) => {
      const base64Data = image.original.replace(
        /^data:image\/jpeg;base64,/,
        ""
      );
      const fileName = `extracted${(index + 1)
        .toString()
        .padStart(3, "0")}.jpg`;
      zip.file(fileName, base64Data, { base64: true });
    });

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = "extracted_images.zip";
      link.click();

      URL.revokeObjectURL(zipUrl);
    } catch (error) {
      console.error("Error generating ZIP file:", error);
    }
  };

  const toggleLayout = () => {
    setLayout((prevLayout) => (prevLayout === "grid" ? "list" : "grid"));
  };

  const openImageGallery = (index) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeImageGallery = () => {
    setIsGalleryOpen(false);
  };

  const handleImageGalleryKeyPress = (event) => {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      handleZoomIn();
    } else if (event.key === "-" || event.key === "Minus") {
      event.preventDefault();
      handleZoomOut();
    }
  };

  const handleZoomIn = () => {
    const gallery = document.getElementsByClassName("image-gallery-slide")[0];
    gallery.imageGallery.current.scaleTo(1.2);
  };

  const handleZoomOut = () => {
    const gallery = document.getElementsByClassName("image-gallery-slide")[0];
    gallery.imageGallery.current.scaleTo(1);
  };

  const renderImages = () => {
    if (extractedImages.length === 0) {
      return (
        <div className="no-images-container">
          <h1>Click On Extract Images Button</h1>
        </div>
      );
    }

    return extractedImages.map((image, index) => (
      <div key={index} className="grid-item">
        <h3>{image.originalAlt}</h3>
        <img
          src={image.original}
          alt={image.originalAlt}
          onClick={() => openImageGallery(index)}
        />
        <button
          onClick={() => downloadImage(image.original, image.originalAlt)}
        >
          Download
        </button>
      </div>
    ));
  };

  const renderThumbnails = (props) => {
    const { images, currentSlide, onClick } = props;

    if (images.length === 0) {
      return (
        <div className="no-thumbnails-container">
          <h3>No Thumbnails to Display</h3>
        </div>
      );
    }

    return (
      <div className="image-gallery-thumbnails-container">
        {images.map((image, index) => (
          <div
            key={index}
            className={`image-gallery-thumbnail ${
              index === currentSlide ? "active" : ""
            }`}
            onClick={() => onClick(index)}
          >
            <img src={image.thumbnail} alt={image.originalAlt} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <header className="header">
        <div className="header-logo">Extract Thumbnail Image</div>
        <div className="header-actions">
          <label htmlFor="file-upload" className="custom-file-input">
            {file ? (
              <span>
                <i className="fa fa-file"></i>File Selected
              </span>
            ) : (
              <span>
                <i className="fas fa-cloud-upload-alt"></i> Choose File
              </span>
            )}
          </label>
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="file-upload-input"
          />
          <button onClick={extractImages} className="header-button">
            Extract Images
          </button>
          <button onClick={downloadAllImages} className="header-button">
            Download All
          </button>
          <button
            onClick={() => window.location.reload()}
            className="header-button"
          >
            Refresh
          </button>
        </div>
        <div className="layout-toggle">
          <button onClick={toggleLayout} className="header-icon-button">
            {layout === "grid" ? (
              <FontAwesomeIcon icon={faBars} />
            ) : (
              <FontAwesomeIcon icon={faTh} />
            )}
          </button>
        </div>
      </header>
      {showError && <div className="error-message">{errorMessage}</div>}
      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Loading file...</span>
        </div>
      )}
      {file ? (
        <>
          {!isLoading && file && (
            <>
              <div
                className={
                  layout === "grid" ? "grid-container" : "list-container"
                }
              >
                {renderImages()}
              </div>
            </>
          )}
          {isGalleryOpen && (
            <Modal
              isOpen={isGalleryOpen}
              onRequestClose={closeImageGallery}
              contentLabel="Image Gallery Modal"
              className="image-gallery-modal"
            >
              <div className="modal-header">
                <button
                  className="modal-close-button"
                  onClick={closeImageGallery}
                >
                  &times;
                </button>
              </div>
              <ImageGallery
                items={extractedImages}
                startIndex={selectedImageIndex}
                showPlayButton={false}
                showFullscreenButton={false}
                showIndex={true}
                renderThumbInner={renderThumbnails}
                onKeyPress={handleImageGalleryKeyPress}
              />
            </Modal>
          )}
        </>
      ) : (
        <div className="loading-container">
          <h1>Please Select A File To Extract Image</h1>
        </div>
      )}
    </div>
  );
}

export default App;
