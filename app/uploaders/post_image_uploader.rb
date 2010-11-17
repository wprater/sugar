# encoding: utf-8

class PostImageUploader < CarrierWave::Uploader::Base

  # Include RMagick or ImageScience support:
  include CarrierWave::RMagick
  # include CarrierWave::ImageScience

  # Choose what kind of storage to use for this uploader:
  if 'production' == ENV['RACK_ENV']
    storage :s3
  else
    storage :file
  end

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  def store_dir
    if 'production' == ENV['RACK_ENV']
      "forums/"
    else
      'public/forums/'
    end
  end
  
  def cache_dir
    Rails.root.join('tmp/uploads/')
  end

  def root
    Rails.root
  end

  # enable_processing = false
  # Process files as they are uploaded; we dont save original image
  # they should not be larger than
  process :watermark
  process :resize_to_limit => [2000, 2000]
  version :inline_post do
    process :resize_to_limit => [500, 400]
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
