class UploadsController < ApplicationController

  def help
    Helper.instance
  end

  class Helper
    include Singleton
    include ActionView::Helpers::NumberHelper
  end

	requires_authentication
	requires_user
	
  def create
    mime_type   = MIME::Types.of(params[:file].original_filename).first
    media_type  = mime_type.media_type
    sub_type    = mime_type.sub_type
    
    # Determine if we're dealing with images or other assets
    asset = PostAsset.new({
      :name         => params[:name],
      :mime_type    => mime_type,
      :file_size    => help.number_to_human_size(File.size(params[:file])),
      :uploaded_by  => @current_user.id,
      :is_temp      => true
    })
    unless params[:post_id].nil? || params[:post_id].empty?
      asset.post_id = params[:post_id]
      asset.is_temp = false
    end
    # Use the correct Carrierwave mount based on asset type
    if 'image' == media_type
      asset.image = params[:file] if 'image' == media_type

      out_method = :image
    else
      # Support doc, pdf, and/or application types
      asset.file = params[:file] if %w{
        vnd.ms-excel
        vnd.ms-word
        pdf
      }.include?(sub_type) \
      || # Search the media types 
      %w{
        text
        video
      }.include?(media_type)

      out_method = :file
    end
    
    asset.save

    render :json => asset, :methods => [out_method]
  end
end