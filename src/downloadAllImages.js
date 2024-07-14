import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import JSZip from "jszip";
import { toast } from "react-toastify";

const convertBlobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result.split(",")[1]); // Remove the data URL prefix
    reader.readAsDataURL(blob);
  });

const downloadAllImages = async (
  extractedImages,
  selectedImages,
  setShowError,
  setErrorMessage
) => {
  if (extractedImages.length === 0) {
    setShowError(true);
    setErrorMessage("No images to download");
    toast.error("Download Fail 😢", {
      position: "bottom-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: "bounce",
    });
    return;
  }

  setShowError(false);
  const zip = new JSZip();
  const imagesToDownload =
    selectedImages.length === 0
      ? extractedImages
      : selectedImages.map((index) => extractedImages[index]);

  imagesToDownload.forEach((image, index) => {
    const base64Data = image.original.replace(/^data:image\/\w+;base64,/, "");
    const fileName = `Image-${(index + 1).toString().padStart(3, "0")}.jpg`;

    zip.file(fileName, base64Data, { base64: true });
  });

  try {
    const zipBlob = await zip.generateAsync({ type: "blob" });

    if (Capacitor.isNativePlatform()) {
      const zipBase64 = await convertBlobToBase64(zipBlob);

      await Filesystem.writeFile({
        path:
          selectedImages.length === 0
            ? "extracted_images.zip"
            : "selected_images.zip",
        data: zipBase64,
        directory: Directory.Documents,
      });

      console.log("File downloaded successfully");
      toast.success("File Downloaded 🎉", {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: "bounce",
      });
    } else {
      const zipUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.href = zipUrl;
      link.download =
        selectedImages.length === 0
          ? "extracted_images.zip"
          : "selected_images.zip";
      link.click();

      URL.revokeObjectURL(zipUrl);

      toast.success("File Downloaded 🎉", {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: "bounce",
      });
    }
  } catch (error) {
    console.error("Error generating ZIP file:", error);
    setShowError(true);
    setErrorMessage("Error generating ZIP file");
    toast.error("Download Fail 😢", {
      position: "bottom-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: "bounce",
    });
  }
};

export default downloadAllImages;
