# encoding: utf-8

class PostAssetUploader < CarrierWave::Uploader::Base

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
      "forum/assets/"
  end
    
  def cache_dir
    Rails.root.join('tmp/uploads/')
  end

  def root
    Rails.root.join('public/')
  end

  # Override the filename of the uploaded files:
  def filename
    "#{self.model.id.to_s[0..4]}_#{original_filename}" if original_filename
  end

end
