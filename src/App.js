import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Modal from "react-modal";
import ImageGallery from "react-image-gallery";
import "./styles.css";
import "react-image-gallery/styles/css/image-gallery.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTh, faBars } from "@fortawesome/free-solid-svg-icons";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import logo from "./asset/logo.png";
import downloadAllImages from "./downloadAllImages";
import downloadImage from "./downloadImage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [file, setFile] = useState(null);
  const [extractedImages, setExtractedImages] = useState([]);
  const [layout, setLayout] = useState("grid");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const imageGalleryRef = useRef(null);
  const [showButton, setShowButton] = useState(false);
  const parentRef = useRef(null);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const shouldShowButton = scrollTop > 200;
    setShowButton(shouldShowButton);
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

        const fname = `Image-${count.toString().padStart(3, "0")}.jpg`;

        const dataUrl = await createDataUrl(jpg.buffer);

        extracted.push({ original: dataUrl, originalAlt: fname });
        start = x2 + 2;
      }

      setExtractedImages(extracted);
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
  const handleDownloadImage = (dataUrl, fname) => {
    downloadImage(dataUrl, fname);
  };

  const handleDownloadAllImages = () => {
    downloadAllImages(
      extractedImages,
      selectedImages,
      setShowError,
      setErrorMessage
    );
  };

  const openImageGallery = (index) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeImageGallery = () => {
    setIsGalleryOpen(false);
  };

  const handleZoomIn = () => {
    const images = document.getElementsByClassName("image-gallery-image");
    for (let i = 0; i < images.length; i++) {
      images[i].style.transform = "scale(1.2)";
    }
  };

  const handleZoomOut = () => {
    const images = document.getElementsByClassName("image-gallery-image");
    for (let i = 0; i < images.length; i++) {
      images[i].style.transform = "scale(1)";
    }
  };

  const unselectAllImages = () => {
    setSelectedImages([]);
  };

  const renderImages = () => {
    if (extractedImages.length === 0) {
      return (
        <div className="no-images-container">
          <h1>Click On Extract Images Button</h1>
        </div>
      );
    }

    const handleImageSelection = (index) => {
      if (selectedImages.includes(index)) {
        setSelectedImages(selectedImages.filter((i) => i !== index));
      } else {
        setSelectedImages([...selectedImages, index]);
      }
    };

    return extractedImages.map((image, index) => (
      <div
        key={index}
        className={` ${selectedImages.includes(index) ? "selected" : ""} ${
          layout === "grid" ? "grid-item" : "list-item"
        }`}
      >
        <label className="Select-icon">
          <input
            type="checkbox"
            checked={selectedImages.includes(index)}
            onChange={() => handleImageSelection(index)}
          />
          <h3>{image.originalAlt}</h3>
        </label>
        <img
          src={image.original}
          alt={image.originalAlt}
          onClick={() => openImageGallery(index)}
        />

        <button
          onClick={() => handleDownloadImage(image.original, image.originalAlt)}
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

  const handleNewScroll = () => {
    setShowButton(true);

    const parentDiv = parentRef.current;
    if (
      parentDiv.scrollTop + parentDiv.clientHeight ===
      parentDiv.scrollHeight
    ) {
      parentDiv.scrollTo(0, 0);
    }
    setShowButton(parentDiv.scrollTop > 0);
  };

  const scrollNewToTop = () => {
    const parentDiv = parentRef.current;

    parentDiv.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  let container = useRef(null);
  let [height, setHeight] = useState(null);
  useLayoutEffect(() => setHeight(container.current.offsetHeight), []);

  const [mobileScreenHeight, setMobileScreenHeight] = useState(0);
  useLayoutEffect(() => {
    function getMobileScreenHeight() {
      const isMobile = /Mobi/i.test(window.navigator.userAgent);
      const hasOuterHeight = "outerHeight" in window;

      if (isMobile && hasOuterHeight) {
        return window.outerHeight;
      }

      return window.innerHeight;
    }

    function handleResize() {
      setMobileScreenHeight(getMobileScreenHeight());
    }

    setMobileScreenHeight(getMobileScreenHeight());

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const adjustedHeight = mobileScreenHeight - height - 2;
  console.log("adjustedHeight", adjustedHeight);

  return (
    <div>
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="dark"
      />
      <header className="header" ref={container}>
        <div className="header-logo">
          <img src={logo} alt="Extract Thumbnail Image" />
        </div>
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
          <button onClick={handleDownloadAllImages} className="header-button">
            {selectedImages.length > 0 ? "Download Selected" : "Download All"}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="header-button"
          >
            Refresh
          </button>
          {}
        </div>
        <div className="layout-toggle">
          <button
            className={`toggle-button ${
              layout === "grid" ? "active" : ""
            } grid`}
            onClick={() => setLayout("grid")}
          >
            <FontAwesomeIcon icon={faTh} />
          </button>
          <button
            className={`toggle-button ${
              layout === "list" ? "active" : ""
            } list`}
            onClick={() => setLayout("list")}
          >
            <FontAwesomeIcon icon={faBars} />
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
                  layout === "grid"
                    ? "grid-container customScrollBar"
                    : "list-container customScrollBar"
                }
                onScroll={handleNewScroll}
                ref={parentRef}
              >
                {renderImages()}
              </div>
            </>
          )}
          {showButton && (
            <button className="scroll-to-top" onClick={scrollNewToTop}>
              &#8679;
            </button>
          )}
          {selectedImages.length > 0 && (
            <div className="unselect-button" onClick={unselectAllImages}>
              <FontAwesomeIcon icon={faTimes} />
            </div>
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
                ref={imageGalleryRef}
              />
              <div className="zoom-buttons">
                <button onClick={handleZoomIn} className="zoom-button">
                  Zoom In
                </button>
                <button onClick={handleZoomOut} className="zoom-button">
                  Zoom Out
                </button>
              </div>
            </Modal>
          )}
        </>
      ) : (
        <div
          className="loading-container"
          style={{ height: `${adjustedHeight}px` }}
        >
          <h1>Please Select A File To Extract Image</h1>
        </div>
      )}
    </div>
  );
}

export default App;
