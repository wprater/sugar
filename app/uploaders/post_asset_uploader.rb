# encoding: utf-8

class PostAssetUploader < CarrierWave::Uploader::Base

  # Include RMagick or ImageScience support:
  include CarrierWave::RMagick
  # include CarrierWave::ImageScience

  # Choose what kind of storage to use for this uploader:
  # storage :file
  storage :s3

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  def store_dir
    "forums/"
  end

  # Override the filename of the uploaded files:
  def filename
    "#{self.model.id}_#{original_filename}" if original_filename
  end

end
