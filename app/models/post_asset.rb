require 'carrierwave'
require 'carrierwave/orm/mongoid'

class PostAsset
  include Mongoid::Document
  include Mongoid::Timestamps

  field :name
  field :is_temp, :type => Boolean
  field :mime_type
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
end