require 'carrierwave'
require 'carrierwave/orm/mongoid'

class PostAsset
  include Mongoid::Document
  include Mongoid::Timestamps

  def help
    Helper.instance
  end

  class Helper
    include Singleton
    include ActionView::Helpers::NumberHelper
  end

  field :name
  field :is_temp, :type => Boolean
  field :mime_type
  field :file_size
  field :asset_type
  field :uploaded_by, :type => Integer
  field :post_id, :type => Integer

  mount_uploader :file, PostAssetUploader
  mount_uploader :image, PostImageUploader
  
  # Get the correct uploader
  def asset
    self.send(self.asset_type || :file)
  end
  
  # Set correct uploader and meta data
  def asset=(new_asset)
    self.mime_type = new_asset.is_a?(Tempfile) \
                      ? MIME::Types.of(new_asset.original_filename).first \
                      : MIME::Types.of(new_asset.path).first
    media_type     = self.mime_type.media_type  || 'application'
    sub_type       = self.mime_type.sub_type    || ''
    
    # Use the correct Carrierwave mount based on asset type
    if 'image' == media_type
      self.asset_type = 'image'
      self.image = new_asset if 'image' == media_type
      # Make sure to get the size of the processed image, we don't keep the original
      self.file_size = File.size?(self.image.path)
    else
      self.asset_type = 'file'
      self.file = new_asset if
        # Search the media types 
        %w{
          application
          text
          video
        }.include?(media_type) || \
        # Support doc, pdf, and/or application types
        %w{
          vnd.ms-excel
          vnd.ms-word
          pdf
        }.include?(sub_type)
        
      self.file_size = File.size?(self.file.path)
    end
  end
  
  def post
    Post.find(self.post_id)
  end
  
  def user
    User.find(self.uploaded_by)
  end
  
  def mime_type
    MIME::Types[self.read_attribute(:mime_type)].first
  end
  
  def is_image?
    'image' == self.mime_type.media_type
  end
  
  def file_size?
    !self.file_size.nil?
  end
  
  def file_size_human
    help.number_to_human_size(self.read_attribute(:file_size))
  end
  
  alias :size :file_size
  
  def url
    self.asset.url
  end
  
  def urls
    returning urls = {} do
      urls[:sq_url] = self.asset.sq.url if self.is_image?
      urls[:inline_post_url] = self.asset.md.url if self.is_image?
      urls[:url] = self.asset.url
    end
  end
  
  def inline_post_url
    self.asset.md.url
  end
end