class UploadsController < ApplicationController

	requires_authentication
	requires_user
	
  def create
    # Determine if we're dealing with images or other assets
    asset = PostAsset.new({
      :name         => params[:name],
      :uploaded_by  => @current_user.id,
      :is_temp      => true
    })
    # If we have a post id, this asset will be associated with the post
    unless params[:post_id].nil? || params[:post_id].empty?
      asset.post_id = params[:post_id]
      asset.is_temp = false
    end
    asset.asset = params[:file]
    asset.save

    render :json => asset
  end
end