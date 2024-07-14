import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Ensure you have the cordova-plugin-android-permissions installed and synced with Capacitor
const requestPermissions = async () => {
  if (Capacitor.getPlatform() === "android") {
    try {
      const permissions = window.cordova.plugins.permissions;
      const permsToRequest = [
        permissions.READ_EXTERNAL_STORAGE,
        permissions.WRITE_EXTERNAL_STORAGE,
      ];

      permissions.hasPermission(
        permsToRequest,
        (status) => {
          if (!status.hasPermission) {
            permissions.requestPermissions(
              permsToRequest,
              (status) => {
                if (!status.hasPermission) {
                  throw new Error("Required permissions not granted");
                }
              },
              (error) => {
                console.error("Permission request error:", error);
                throw error;
              }
            );
          }
        },
        (error) => {
          console.error("Permission check error:", error);
          throw error;
        }
      );
    } catch (error) {
      console.error("Permission request error:", error);
      throw error; // Propagate the error to handle it in the component
    }
  }
};

const downloadImage = async (dataUrl, fname) => {
  console.log("fname:", fname);
  console.log("dataUrl:", dataUrl);

  if (Capacitor.isNativePlatform()) {
    try {
      await requestPermissions(); // Request permissions before proceeding

      const base64Data = dataUrl.split(",")[1]; // Extract the base64 part from the data URL

      await Filesystem.writeFile({
        path: fname,
        data: base64Data,
        directory: Directory.Documents,
        encoding: Encoding.BASE64,
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
    } catch (error) {
      console.error("Error downloading file in app:", error);
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
      throw error; // Propagate the error to handle it in the component
    }
  } else {
    // Web download logic
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fname;
    link.click();
    toast.success("File Downloaded! 🎉", {
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

export default downloadImage;
