"use client";

import * as React from "react"; // Import React
import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop"; // Import Area type
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter, // Import DialogFooter for button placement
} from "@/components/ui/dialog"; // Corrected import path
import { Button } from "@/components/ui/button"; // Corrected import path
import { Slider } from "@/components/ui/slider"; // Import Slider for zoom control
import { Label } from "@/components/ui/label"; // Import Label

interface ImageCropModalProps {
  imageSrc: string | null; // Use imageSrc to avoid naming conflict with Image element
  isOpen: boolean;
  onClose: () => void;
  onSaveCroppedImage: (croppedImageBlob: Blob | null) => void; // Allow null blob
}

// Define CropAreaPixels based on Area type from react-easy-crop
type CropAreaPixels = Area;

export function ImageCropModal({
  imageSrc,
  isOpen,
  onClose,
  onSaveCroppedImage,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CropAreaPixels | null>(null);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: CropAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      // Add crossOrigin attribute for potential CORS issues if loading from external URLs
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  // Function to get the cropped image as a Blob
  async function getCroppedImg(
    imageSrc: string,
    pixelCrop: CropAreaPixels | null
  ): Promise<Blob | null> {
    if (!pixelCrop) {
      return null;
    }

    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Failed to get canvas context");
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image onto the canvas
    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Return the canvas content as a Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg"); // Specify format and quality if needed
    });
  }

  const handleCropSave = async () => {
    if (!imageSrc) return;
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSaveCroppedImage(croppedImageBlob); // Pass blob (or null)
      onClose(); // Close modal after saving
    } catch (e) {
      console.error("Error cropping image:", e);
      // Optionally show an error toast to the user
      onClose(); // Close modal even on error
    }
  };

  // Reset state when modal is closed or image changes
  React.useEffect(() => {
    if (!isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [isOpen]);

  if (!imageSrc) {
    return null; // Don't render if no image source
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crop Profile Photo</DialogTitle>
        </DialogHeader>
        <div className="relative h-[400px] w-full bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // Square aspect ratio for profile pictures
            cropShape="round" // Optional: round crop shape
            showGrid={false} // Optional: hide grid
            onCropChange={onCropChange}
            onCropComplete={onCropComplete}
            onZoomChange={onZoomChange}
          />
        </div>
        {/* Zoom Slider */}
        <div className="mt-4 flex items-center gap-4 px-2">
           <Label htmlFor="zoom-slider" className="text-sm">Zoom</Label>
           <Slider
             id="zoom-slider"
             min={1}
             max={3}
             step={0.1}
             value={[zoom]}
             onValueChange={(value) => onZoomChange(value[0])}
             className="flex-1"
           />
        </div>
        <DialogFooter className="mt-4"> {/* Use DialogFooter */}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCropSave} disabled={!croppedAreaPixels}>
            Save Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
