import React from "react";
import { toast } from "react-toastify";

const ImageUpload = ({
  setImageUrl = () => {},
  setPreviewImageUrl = () => {},
  setValue = () => {},
  label = "Upload Image",
}) => {
  const handleImageUpload = async (e) => {
    const imageFile = e.target.files[0];
    if (!imageFile) return;

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      const path = data.url;

      if (response.ok) {
        if (setImageUrl) setImageUrl(path);
        if (setPreviewImageUrl) setPreviewImageUrl(path);
        if (setValue) setValue("photourl", path);
        toast.success("Image uploaded successfully");
      } else {
        toast.error(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error uploading image");
    }
  };

  return (
    <div className="w-full space-y-2 pt-1">
      <label className="capitalize font-extrabold text-xs text-brand-dark-grey dark:text-brand-gold-light">{label}</label>
      <div className="form-control border border-brand-beige/60 dark:border-brand-dark-grey/60 rounded-2xl shadow-sm bg-brand-offwhite dark:bg-brand-midnight overflow-hidden p-1">
        <input
          onChange={handleImageUpload}
          type="file"
          className="file-input w-full outline-none focus:outline-none bg-transparent text-brand-black dark:text-brand-white border-none p-1.5 text-xs font-medium cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
