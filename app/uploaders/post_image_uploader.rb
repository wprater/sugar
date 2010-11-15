# encoding: utf-8

class PostImageUploader < CarrierWave::Uploader::Base

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

  # Process files as they are uploaded; we dont save original image
  # they should not be larger than
  process :watermark
  process :resize_to_limit => [2000, 2000]
  version :inline_post do
    process :resize_to_limit => [600, 500]
  end

  def watermark
    # TODO put on a watermark for all uploaded images
  end

  # Add a white list of extensions which are allowed to be uploaded.
  # For images you might use something like this:
  def extension_white_list
    %w(jpg jpeg gif png)
  end

  # Override the filename of the uploaded files:
  def filename
    "#{self.model.id}_#{original_filename}" if original_filename
  end

end
