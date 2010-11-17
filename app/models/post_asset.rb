require 'carrierwave'
require 'carrierwave/orm/mongoid'

class PostAsset
  include Mongoid::Document
  include Mongoid::Timestamps

  field :name
  field :is_temp, :type => Boolean
  field :mime_type
  field :file_size
  field :uploaded_by, :type => Integer
  field :post_id, :type => Integer

  mount_uploader :file, PostAssetUploader
  mount_uploader :image, PostImageUploader
  
  def post
    Post.find(self.post_id)
  end
  
  def user
    User.find(self.uploaded_by)
  end
  
  def mime_type
    MIME::Types[self.read_attribute(:mime_type)].first
  end
  
  def file_size?
    !self.file_size.nil?
  end
  
  def url
    self.image.url || self.file.url
  end
end